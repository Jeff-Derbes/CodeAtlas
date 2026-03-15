# CodeAtlas

CodeAtlas is a minimal local-first workspace for indexing a code repository and asking questions about it. This initial setup focuses on a clean Next.js foundation, a simple placeholder UI, and small library stubs for the future indexing and retrieval pipeline.

## Stack

- Next.js with the App Router
- TypeScript
- Tailwind CSS

## Project Layout

```text
src/
  app/
  components/
  lib/
    answering/
    chunking/
    config/
    indexing/
    llm/
    repo/
    retrieval/
    types/
data/
  indexes/
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file:

```powershell
Copy-Item .env.example .env.local
```

3. Update the LM Studio values in `.env.local` if needed.

4. Start the dev server:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## LM Studio Environment Variables

- `LM_STUDIO_BASE_URL`: OpenAI-compatible LM Studio base URL. Default: `http://127.0.0.1:1234/v1`
- `LM_STUDIO_MODEL`: Model identifier to use for future answer generation
- `LM_STUDIO_API_KEY`: Optional API key value if your local setup expects one

## Current Status

Implemented:

- repository scaffold with App Router and Tailwind
- placeholder homepage for repo indexing and Q&A
- library folders and shared types
- LM Studio config helper and example environment file

Stubbed for later:

- repository scanning
- chunking
- index persistence
- retrieval
- LLM calls
- answer generation with real citations
