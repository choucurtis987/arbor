# Arbor AI Chatbot — Project Context

## What This Is
A RAG-powered chatbot prototype that answers customer questions about Arbor using their public website content as a knowledge base. The primary goal is to address Arbor's core business problem: high customer education overhead and a persistent "is this a scam?" trust gap.

This is a prototype/proof-of-concept intended to demonstrate:
- Practical AI agent thinking (not just API calls)
- Understanding of Arbor's customer operations
- Clear business value (support deflection, trust building)

## About Arbor
- Electricity cost optimization app operating in 13 deregulated US states
- Free for consumers; earns referral fees from energy suppliers
- Raised $20M+, saved customers $7.5M
- #1 customer concern: "Is this a scam?" (visible on Reddit, TrustPilot, App Store reviews)
- Heavy support burden due to customer education needs around electricity bills/deregulation

## Tech Stack
- **Scraping**: Firecrawl
- **Chunking**: LangChain RecursiveCharacterTextSplitter
- **Embeddings**: OpenAI `text-embedding-3-small`
- **Vector DB**: Pinecone (hosted, cloud)
- **LLM**: OpenAI GPT-4o
- **Backend**: FastAPI + Uvicorn (streaming responses)
- **Frontend**: Next.js + Vercel AI SDK (streaming chat UI)

## Architecture
Three-tier architecture: browser → Next.js → FastAPI → Pinecone/OpenAI

- **Next.js** serves the UI to the browser
- **FastAPI** holds API keys and runs all RAG logic — browser never calls OpenAI or Pinecone directly
- **Pinecone** stores and retrieves vector embeddings (cloud, no local disk)
- **OpenAI** handles embeddings (`text-embedding-3-small`) and chat (`GPT-4o`)

## Environment Variables
Copy `.env.example` to `.env` and fill in values. Never commit `.env`.

Required variables are documented in `.env.example`. Load via `python-dotenv` in Python, `process.env` in Next.js.

## Knowledge Base URLs
**v0 (current):**
- `https://www.joinarbor.com/faq`
- `https://www.joinarbor.com/faq-categories/getting-started`

**v1 extension (future):**
- `https://www.joinarbor.com/resources` (full blog crawl via Firecrawl)

## Build Phases

### Phase 1 — Ingest Pipeline (`ingest.py`)
Run once locally to populate Pinecone.
1. Firecrawl scrapes FAQ URLs → clean markdown
2. LangChain RecursiveCharacterTextSplitter chunks content
3. OpenAI `text-embedding-3-small` embeds each chunk
4. Pinecone stores vectors

### Phase 2 — FastAPI Backend (`app.py`)
Serves `/chat` endpoint with RAG + streaming.
1. Receive user message
2. Embed it → query Pinecone for top-k relevant chunks
3. Pass chunks + message to GPT-4o
4. Stream response back token by token via `StreamingResponse`

### Phase 3 — Next.js Frontend (`/frontend`)
Minimal chat UI with streaming.
1. Vercel AI SDK `useChat` hook handles streaming automatically
2. System prompt tuned to Arbor brand voice
3. Test end-to-end locally

## Running Locally (v0 Demo)
```bash
# Terminal 1 — backend
conda activate CF && uvicorn app:app --reload

# Terminal 2 — frontend
cd frontend && npm run dev

# Browser
open localhost:3000
```

## Deployment Path (v1, post-demo)
- FastAPI → Render (paid tier, ~$7/mo, avoids cold starts)
- Next.js → Vercel (free tier, zero-config)
- Set `NEXT_PUBLIC_API_URL` in Vercel dashboard to point at Render URL
- Set all env vars in Render and Vercel dashboards — never in committed code
- Code does not change — only where it runs

## Python Environment
- **All Python commands and package installations must use the `CF` conda environment**
- Activate before running anything: `conda activate CF`
- Install packages with: `conda activate CF && pip install <package>`
- Never run `python` or `pip` outside of the CF environment

## Python Dependencies
```
firecrawl-py
langchain
langchain-openai
openai
pinecone-client
python-dotenv
fastapi
uvicorn
```

## Key Conventions
- **Keep it simple** — this is a prototype, not production
- **No hardcoded API keys** — use environment variables, never string literals in code
- **No personal file paths** — code must work on any machine
- **One phase per Claude Code session** — scope each session tightly
- **Commit after each phase** — clean git history per working milestone
- Ingest script: `ingest.py`, backend entry point: `app.py`, frontend: `/frontend`

## System Prompt Guidance
The chatbot should be instructed to:
- Be warm, clear, and non-defensive
- Always answer legitimacy concerns directly (don't deflect)
- Ground answers in the retrieved Arbor content, not general knowledge
- Acknowledge uncertainty if a question is outside the knowledge base

## Business Case (for demo framing)
- If the chatbot deflects 30% of support tickets → direct cost savings
- Consistent, on-brand answers to "is this a scam?" → trust building at scale
- Can be embedded on website or used internally by support agents
- Phase 2 extension: monitor Reddit/TrustPilot for new concerns → feed back into knowledge base
