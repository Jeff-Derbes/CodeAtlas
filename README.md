# CodeAtlas

CodeAtlas is a local-first developer tool for exploring a codebase with natural-language questions. It scans a repository, chunks source files, generates embeddings, retrieves the most relevant code snippets for a question, and asks a local model in LM Studio to produce a grounded answer with citations.

The project is intentionally small and modular. Each stage of the pipeline lives in its own library folder so the indexing, retrieval, and answer-generation pieces can evolve independently.

## What It Does

- indexes a local repository from a path you provide
- chunks supported source files into line-aware code segments
- generates embeddings for those chunks using LM Studio
- saves the active index to disk under `data/indexes/current-index.json`
- retrieves the most relevant chunks for a question
- builds a grounded prompt from retrieved code
- generates an answer through LM Studio
- returns citations with file paths, line ranges, snippets, and retrieval scores

## Current User Flow

1. Start LM Studio with:
   - a chat model for answer generation
   - an embedding-capable model for indexing and retrieval
2. Start the Next.js app.
3. Enter a local repository path in the UI and index it.
4. Ask a question about that repository.
5. Review the generated answer and supporting citations in-app.

## How It Works

### 1. Repository scanning

CodeAtlas recursively scans the selected repository, applies ignore rules, and filters for supported file types before reading file contents.

### 2. Chunking

Files are split into overlapping code chunks with line metadata. Each chunk keeps:

- file path
- start line
- end line
- content
- stable chunk id

### 3. Embedding and persistence

Each chunk is embedded through LM Studio's OpenAI-compatible `/embeddings` endpoint. The resulting embedded chunks are written to disk so the UI can ask questions against the current active index without rebuilding it every time.

### 4. Retrieval

When a question is submitted, CodeAtlas embeds the question, compares it to saved chunk embeddings with cosine similarity, and selects the top relevant chunks.

### 5. Answer generation

The retrieved chunks are formatted into a prompt-safe context block like:

````text
[Source 1]
File: src/lib/example.ts
Lines: 10-42
```ts
...
```
````

That context is sent to LM Studio's OpenAI-compatible `/chat/completions` endpoint with instructions to answer only from the provided sources and include source references.

### 6. Citations

The final answer is returned with structured citations that include:

- source id
- relative path
- line range
- snippet preview
- retrieval score when available

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- LM Studio using OpenAI-compatible local endpoints

## Project Layout

```text
src/
  app/
    api/
      answer/
      index/
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

3. Update the LM Studio values in `.env.local`.

4. Start the dev server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Environment Variables

- `LM_STUDIO_BASE_URL`: OpenAI-compatible LM Studio base URL. Default: `http://127.0.0.1:1234/v1`
- `LM_STUDIO_MODEL`: chat/completions model used for answer generation
- `LM_STUDIO_EMBEDDING_MODEL`: embeddings model used for indexing and retrieval
- `LM_STUDIO_API_KEY`: optional API key if your LM Studio setup expects one

## Recommended LM Studio Setup

- Use a chat or instruct model for `LM_STUDIO_MODEL`
- Use an embedding-capable model for `LM_STUDIO_EMBEDDING_MODEL`

If you are not sure which local models support embeddings, you can inspect them with:

```powershell
lms ls --embedding
```

## Available Scripts

- `npm run dev`: start the local development server
- `npm run build`: build the app for production
- `npm run start`: run the production build
- `npm run lint`: run ESLint
- `npm run typecheck`: run TypeScript without emitting files

## Current Status

Implemented:

- repository scanning with ignore rules and allowed-extension filtering
- file reading with binary and large-file safeguards
- chunking with overlap and line metadata
- embedding generation through LM Studio
- index persistence to `data/indexes/current-index.json`
- cosine-similarity retrieval over embedded chunks
- answer-generation flow with grounded prompt construction
- structured citations mapped back to retrieved code chunks
- in-app indexing and question-answering UI
- Next.js API routes for indexing and answering

Still intentionally simple in v1:

- single active saved index file instead of multi-repo index management
- no streaming answer responses yet
- no background indexing jobs or progress reporting
- no citation highlighting directly inside source files
- no conversation history or follow-up question state
- no evals, benchmarks, or quality scoring yet

## Notes and Limitations

- CodeAtlas is designed for grounded answers, so answer quality depends heavily on retrieval quality and the selected local models.
- If indexing fails, the most common cause is using a chat model that does not support embeddings.
- The current UI works against one active saved index at a time.
- Large repositories may take noticeable time to index because v1 keeps the pipeline simple and sequential.

## Near-Term Direction

Likely next improvements include:

- streaming answer output
- LM Studio health/model readiness checks
- better indexing feedback in the UI
- multi-index management
- richer citation rendering and source navigation
