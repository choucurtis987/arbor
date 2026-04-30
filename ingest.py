import os
from dotenv import load_dotenv
from firecrawl import V1FirecrawlApp as FirecrawlApp, V1ScrapeOptions
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import OpenAI
from pinecone import Pinecone, ServerlessSpec

load_dotenv()

URLS = [
    "https://www.joinarbor.com/faq",
    "https://www.joinarbor.com/faq-categories/getting-started",
    "https://www.joinarbor.com/faq-categories/electricity-rates-101",
    "https://www.joinarbor.com/faq-categories/my-account",
    "https://www.joinarbor.com/faq-categories/moving",
]

CRAWL_URLS = [
    "https://www.joinarbor.com/resources",
]

INDEX_NAME = "arbor-chatbot"
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536


def scrape(urls):
    app = FirecrawlApp(api_key=os.getenv("FIRECRAWL_KEY"))
    docs = []
    for url in urls:
        print(f"Scraping {url}...")
        result = app.scrape_url(url, formats=["markdown"])
        docs.append({"url": url, "content": result.markdown})
        print(f"  Got {len(result.markdown)} chars")
    return docs


def crawl(urls):
    app = FirecrawlApp(api_key=os.getenv("FIRECRAWL_KEY"))
    docs = []
    for url in urls:
        print(f"Crawling {url} and sub-pages...")
        result = app.crawl_url(url, limit=30, scrape_options=V1ScrapeOptions(formats=["markdown"]))
        for page in result.data:
            source = page.metadata.get("url") or page.metadata.get("sourceURL") or url if isinstance(page.metadata, dict) else url
            docs.append({"url": source, "content": page.markdown})
            print(f"  Scraped {source} ({len(page.markdown)} chars)")
    return docs


def chunk(docs):
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = []
    for doc in docs:
        splits = splitter.split_text(doc["content"])
        for i, text in enumerate(splits):
            chunks.append({"id": f"{doc['url']}#{i}", "text": text, "url": doc["url"]})
    print(f"Created {len(chunks)} chunks")
    return chunks


def embed(chunks):
    client = OpenAI(api_key=os.getenv("OPENAI_CF_KEY"))
    texts = [c["text"] for c in chunks]
    response = client.embeddings.create(input=texts, model=EMBEDDING_MODEL)
    for i, c in enumerate(chunks):
        c["embedding"] = response.data[i].embedding
    print(f"Embedded {len(chunks)} chunks")
    return chunks


def store(chunks):
    pc = Pinecone(api_key=os.getenv("PINECONE_KEY"))

    existing = [idx.name for idx in pc.list_indexes()]
    if INDEX_NAME not in existing:
        print(f"Creating index '{INDEX_NAME}'...")
        pc.create_index(
            name=INDEX_NAME,
            dimension=EMBEDDING_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )

    index = pc.Index(INDEX_NAME)
    vectors = [
        {
            "id": c["id"],
            "values": c["embedding"],
            "metadata": {"text": c["text"], "url": c["url"]},
        }
        for c in chunks
    ]
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        index.upsert(vectors=vectors[i:i + batch_size])
        print(f"  Upserted batch {i // batch_size + 1} ({min(i + batch_size, len(vectors))}/{len(vectors)})")
    print(f"Stored {len(vectors)} vectors in Pinecone index '{INDEX_NAME}'")
    stats = index.describe_index_stats()
    print(f"Index now has {stats.total_vector_count} total vectors")


if __name__ == "__main__":
    docs = scrape(URLS)
    docs += crawl(CRAWL_URLS)
    chunks = chunk(docs)
    chunks = embed(chunks)
    store(chunks)
    print("Ingest complete.")
