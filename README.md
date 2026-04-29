# Arbor AI Chatbot — Technical Walkthrough

A RAG-powered customer support chatbot for [Arbor](https://www.joinarbor.com), built to address their core business problem: high customer education overhead and a persistent "is this a scam?" trust gap.

---

## The Business Problem

Arbor is a free app that helps people in deregulated electricity markets switch to cheaper suppliers. Their #1 customer concern — visible on Reddit, TrustPilot, and the App Store — is "Is this a scam?" That skepticism drives a heavy support burden because the same questions get asked over and over.

A chatbot grounded in Arbor's actual FAQ content can:
- Deflect repetitive support tickets
- Answer legitimacy questions directly and consistently, at scale
- Maintain Arbor's warm brand voice without requiring a human

---

## Architecture

```
Browser → Next.js (UI + API route) → FastAPI (RAG logic) → Pinecone + OpenAI
```

Three deliberate tiers, each with a clear responsibility:

| Tier | Role |
|------|------|
| **Next.js** | Serves the UI; proxies streaming requests to FastAPI |
| **FastAPI** | Holds API keys; runs all RAG logic; streams the response |
| **Pinecone / OpenAI** | Vector store and LLM — never called directly from the browser |

**Why not call OpenAI from the browser directly?** API keys would be exposed in client-side code. The Next.js API route (`/api/chat`) acts as a thin proxy — it forwards requests to FastAPI and pipes the stream back. No keys ever touch the frontend.

---

## Phase 1 — Ingest Pipeline (`ingest.py`)

Run once locally to populate the vector database. Four sequential steps:

### 1. Scrape
[Firecrawl](https://firecrawl.dev) scrapes Arbor's FAQ pages and returns clean Markdown. Firecrawl handles JavaScript-rendered content and anti-bot measures that a plain `requests` call can't.

**Source URLs (v0):**
- `https://www.joinarbor.com/faq`
- `https://www.joinarbor.com/faq-categories/getting-started`

### 2. Chunk
LangChain's `RecursiveCharacterTextSplitter` breaks the Markdown into overlapping chunks:
- **chunk_size = 500** — small enough to be semantically focused, large enough to hold a full FAQ answer
- **chunk_overlap = 50** — prevents answers from being split at chunk boundaries, preserving context

The recursive splitter respects natural text boundaries (paragraphs → sentences → words) rather than cutting blindly by character count.

### 3. Embed
Each chunk is sent to OpenAI's `text-embedding-3-small` to produce a 1536-dimensional vector. This model was chosen over `text-embedding-3-large` because:
- It's ~5x cheaper with only marginal quality loss for this use case
- The knowledge base is small and domain-specific — the simpler model is sufficient

### 4. Store
Vectors are upserted into a Pinecone serverless index. Pinecone was chosen over a local solution (FAISS, Chroma) because:
- Serverless — no infrastructure to manage, scales to zero cost at rest
- Persistent — survives restarts, no re-ingestion needed between demo runs
- The index creation is idempotent — running ingest again just updates existing vectors

```bash
conda activate CF && python ingest.py
```

---

## Phase 2 — FastAPI Backend (`app.py`)

Handles one endpoint: `POST /chat`. For every incoming message:

### 1. Embed the query
The user's message gets embedded with the same model used during ingest (`text-embedding-3-small`). This is critical — query and document embeddings must live in the same vector space for similarity search to be meaningful.

### 2. Retrieve relevant chunks
Pinecone returns the top-3 most semantically similar chunks (cosine similarity). `TOP_K = 3` is a deliberate choice — enough context to answer compound questions, few enough to avoid diluting the prompt with irrelevant content.

### 3. Prompt the LLM
The retrieved chunks are injected into the user message before passing to GPT-4o:

```
Context from Arbor's knowledge base:
<chunk 1>

<chunk 2>

<chunk 3>

Customer question: <user message>
```

GPT-4o is grounded in retrieved content rather than its general training data, which prevents hallucination about Arbor-specific details.

### 4. Stream the response
FastAPI uses `StreamingResponse` to pipe tokens back to Next.js as they're generated — no waiting for the full response before the user sees output.

### System Prompt Design

The system prompt does three things:

**Brand voice:** Warm, direct, non-defensive. Explicitly handles skepticism ("is this a scam?") without deflecting.

**Grounding instruction:** Tells the model to answer from context, not general knowledge, and to acknowledge gaps honestly rather than hallucinate.

**Auto-linking (scalable):** Rather than hard-coding links in the UI, the system prompt contains a URL table:

```python
SITE_URLS = {
    "check availability / sign up": "https://app.joinarbor.com/signup",
    "FAQ": "https://www.joinarbor.com/faq",
    ...
}
```

The model is instructed to emit Markdown links whenever it references a known page. Adding a new URL is one line in one dict — no frontend changes needed. The alternative (regex post-processing in the UI) would be brittle and hard to maintain.

---

## Phase 3 — Next.js Frontend (`/frontend`)

### Streaming via Vercel AI SDK

The `useChat` hook from `ai/react` handles the full streaming lifecycle:
- Sends the message to `/api/chat`
- Accumulates streamed tokens into the message state
- Exposes `isLoading` for the typing indicator
- Provides `append()` for programmatic message submission (used by suggestion chips)

`streamProtocol: "text"` is set explicitly because FastAPI streams plain text — not the Vercel AI SDK's default SSE format. The Next.js API route adds the `X-Vercel-AI-Data-Stream: v1` header that the SDK expects to treat it correctly.

### Component Architecture

```
ChatHome          — orchestrator; owns useChat state
├── TopBar        — back navigation (hidden on welcome screen)
├── WelcomeHero   — headline + logo medallion
├── SuggestionGrid — pre-seeded question chips
├── Composer      — input + send button (two visual variants)
└── MessageList   — scrolling message thread
    ├── UserBubble
    ├── BotMessage — renders Markdown via react-markdown
    └── TypingDots — animated loading state
```

`ChatHome` holds all state and passes down only what each component needs. The `isWelcome = messages.length === 0` flag drives the layout switch between the centered welcome screen and the conversation view — one boolean, no routing.

### Tailwind v4 Design Tokens

Arbor's design system is encoded as CSS custom properties in `globals.css` using Tailwind v4's `@theme` block — not a `tailwind.config.ts`. This approach:
- Co-locates design tokens with CSS (where they belong)
- Works with Tailwind's JIT compiler without configuration files
- Keeps the token names semantic (`arbor-forest`, `arbor-cream`) rather than generic

### Markdown Rendering

Bot responses are rendered with `react-markdown` using custom components for `<a>` and `<p>`. This is what makes the auto-linking system visible — the model emits `[text](url)` syntax, and `react-markdown` turns it into clickable links that open in a new tab.

---

## Data Flow (end-to-end)

```
1. User types a message and hits Send
2. useChat POSTs { messages } to /api/chat (Next.js route)
3. Next.js route extracts the last message, forwards to FastAPI /chat
4. FastAPI embeds the message → queries Pinecone → gets top-3 chunks
5. FastAPI calls GPT-4o with system prompt + context + user message
6. FastAPI streams tokens back via StreamingResponse
7. Next.js pipes the stream back to the browser
8. useChat accumulates tokens → React re-renders each token
9. react-markdown renders the final message with working links
```

---

## Running Locally

```bash
# Terminal 1 — backend
conda activate CF && uvicorn app:app --reload

# Terminal 2 — frontend
cd frontend && npm run dev

# Browser
open http://localhost:3000
```

---

## Environment Variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `OPENAI_CF_KEY` | FastAPI, ingest | OpenAI API key |
| `PINECONE_KEY` | FastAPI, ingest | Pinecone API key |
| `FIRECRAWL_KEY` | ingest only | Firecrawl API key |
| `NEXT_PUBLIC_API_URL` | Next.js | FastAPI base URL (defaults to localhost:8000) |

Copy `.env.example` → `.env` and fill in values. Never commit `.env`.

---

## Design Decisions Worth Discussing

| Decision | Alternative Considered | Why This Choice |
|----------|----------------------|-----------------|
| Pinecone (cloud) | Chroma / FAISS (local) | Persistent between runs; no disk management |
| FastAPI between browser and OpenAI | Call OpenAI from browser | API keys never exposed client-side |
| Streaming from FastAPI | Return full response | Users see output immediately; better perceived latency |
| Auto-linking via system prompt | Regex post-processing in UI | Scales to new URLs with one line; model handles context-aware placement |
| `text-embedding-3-small` | `text-embedding-3-large` | ~5x cheaper; sufficient for a focused, small knowledge base |
| `TOP_K = 3` | Higher values | Enough context; avoids diluting the prompt |
| `chunk_size = 500, overlap = 50` | Larger chunks | Keeps chunks semantically focused; overlap prevents answer truncation |
| Vercel AI SDK `useChat` | Custom fetch + state | Handles streaming, loading state, and message history out of the box |
