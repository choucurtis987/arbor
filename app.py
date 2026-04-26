import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
from pinecone import Pinecone

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_client = OpenAI(api_key=os.getenv("OPENAI_CF_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_KEY"))
index = pc.Index("arbor-chatbot")

EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o"
TOP_K = 3

# Add or update URLs here as the site grows. The model will link to them automatically.
SITE_URLS = {
    "check availability / sign up": "https://app.joinarbor.com/signup",
    "FAQ": "https://www.joinarbor.com/faq",
    "getting started FAQ": "https://www.joinarbor.com/faq-categories/getting-started",
    "homepage": "https://www.joinarbor.com",
    "support email": "mailto:support@joinarbor.com",
}

_url_table = "\n".join(f"- {label}: {url}" for label, url in SITE_URLS.items())

SYSTEM_PROMPT = f"""You are a helpful, warm, and knowledgeable assistant for Arbor — a free app that helps people save money on their electricity bills.

Your job is to answer customer questions clearly and honestly using the information provided to you.

Key guidance:
- If someone asks "is this a scam?" or expresses distrust, address it directly and confidently. Arbor is free for consumers and earns referral fees from energy suppliers — be transparent about this.
- Ground your answers in the provided context. If the answer isn't in the context, say so honestly rather than guessing.
- Be conversational, friendly, and clear. Avoid jargon.
- Never be defensive. Skepticism is normal — help the person understand.
- Format responses in Markdown.

Linking guidance:
When your response references a page or action listed below, include it as a Markdown link — e.g. [Check your availability](https://app.joinarbor.com/signup).
Only link to URLs from this list. Do not invent or guess URLs.

Known Arbor URLs:
{_url_table}"""


class ChatRequest(BaseModel):
    message: str


def get_context(message: str) -> str:
    response = openai_client.embeddings.create(
        input=message, model=EMBEDDING_MODEL
    )
    query_embedding = response.data[0].embedding
    results = index.query(vector=query_embedding, top_k=TOP_K, include_metadata=True)
    chunks = [match.metadata["text"] for match in results.matches]
    return "\n\n".join(chunks)


async def stream_response(message: str, context: str):
    response = openai_client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Context from Arbor's knowledge base:\n{context}\n\nCustomer question: {message}",
            },
        ],
        stream=True,
    )
    for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


@app.post("/chat")
async def chat(request: ChatRequest):
    context = get_context(request.message)
    return StreamingResponse(
        stream_response(request.message, context),
        media_type="text/plain",
    )
