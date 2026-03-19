"use client";

import { useState } from "react";

import type { AnswerResult, IndexingResult } from "@/lib/types";

interface AskApiResponse {
  repoPath: string;
  retrievedChunkCount: number;
  result: AnswerResult;
}

interface HomeShellProps {
  defaultRepoPath: string;
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export function HomeShell({ defaultRepoPath }: HomeShellProps) {
  const [repoPath, setRepoPath] = useState(defaultRepoPath);
  const [question, setQuestion] = useState("");
  const [indexing, setIndexing] = useState(false);
  const [asking, setAsking] = useState(false);
  const [indexResult, setIndexResult] = useState<IndexingResult | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [answerMeta, setAnswerMeta] = useState<{ repoPath: string; retrievedChunkCount: number } | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleIndexRepository() {
    setIndexing(true);
    setErrorMessage(null);
    setAnswerResult(null);
    setAnswerMeta(null);

    try {
      const response = await fetch("/api/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoPath }),
      });
      const payload = await readJson<IndexingResult | { message?: string }>(response);

      if (!response.ok) {
        throw new Error("message" in payload ? payload.message || "Indexing failed." : "Indexing failed.");
      }

      setIndexResult(payload as IndexingResult);
    } catch (error) {
      setIndexResult(null);
      setErrorMessage(error instanceof Error ? error.message : "Indexing failed.");
    } finally {
      setIndexing(false);
    }
  }

  async function handleAskQuestion() {
    setAsking(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });
      const payload = await readJson<AskApiResponse | { message?: string }>(response);

      if (!response.ok) {
        throw new Error(
          "message" in payload ? payload.message || "Answer generation failed." : "Answer generation failed.",
        );
      }

      const successPayload = payload as AskApiResponse;
      setAnswerResult(successPayload.result);
      setAnswerMeta({
        repoPath: successPayload.repoPath,
        retrievedChunkCount: successPayload.retrievedChunkCount,
      });
    } catch (error) {
      setAnswerResult(null);
      setAnswerMeta(null);
      setErrorMessage(error instanceof Error ? error.message : "Answer generation failed.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10">
      <section className="rounded-3xl border border-border bg-surface px-6 py-8 shadow-sm sm:px-8">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted">
            CodeAtlas
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Explore a codebase with a simple local-first workflow.
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted">
            Index a local repository, retrieve relevant code chunks, and send a
            grounded question to LM Studio without leaving the app.
          </p>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
          {errorMessage}
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-surface px-6 py-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Repository
              </h2>
              <p className="mt-1 text-sm text-muted">
                Point CodeAtlas at a local repository to prepare an index.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground">
                Repo path
              </label>
              <input
                type="text"
                value={repoPath}
                onChange={(event) => setRepoPath(event.target.value)}
                placeholder="C:\\Users\\you\\projects\\example-repo"
                className="w-full rounded-2xl border border-border bg-surface-secondary px-4 py-3 text-sm text-foreground outline-none transition focus:border-slate-400"
              />
              <button
                type="button"
                onClick={() => void handleIndexRepository()}
                disabled={indexing || !repoPath.trim()}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                {indexing ? "Indexing..." : "Index Repository"}
              </button>
              <p className="text-sm leading-6 text-muted">
                {indexResult
                  ? `${indexResult.indexedChunkCount} chunks indexed across ${indexResult.indexedFileCount} files.`
                  : "The current repo path will be saved as the active index for questions."}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface px-6 py-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Question
              </h2>
              <p className="mt-1 text-sm text-muted">
                Ask about the active indexed repository and inspect the cited
                code that supports the answer.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground">
                Question input
              </label>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="How is repository indexing orchestrated?"
                rows={5}
                className="w-full resize-none rounded-2xl border border-border bg-surface-secondary px-4 py-3 text-sm text-foreground outline-none transition focus:border-slate-400"
              />
              <button
                type="button"
                onClick={() => void handleAskQuestion()}
                disabled={asking || !question.trim()}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-white px-5 text-sm font-medium text-foreground transition hover:bg-slate-50"
              >
                {asking ? "Asking..." : "Ask Question"}
              </button>
              <p className="text-sm leading-6 text-muted">
                {answerMeta
                  ? `Using ${answerMeta.retrievedChunkCount} retrieved chunks from ${answerMeta.repoPath}.`
                  : "Ask after indexing to run retrieval plus grounded answer generation."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-surface px-6 py-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">Answer</h2>
              <p className="mt-1 text-sm text-muted">
                The answer is generated from retrieved code context and returned
                with source citations.
              </p>
            </div>
            <div className="min-h-52 whitespace-pre-wrap rounded-2xl border border-dashed border-border bg-surface-secondary p-4 text-sm leading-7 text-muted">
              {answerResult?.answer ||
                "No answer yet. Index a repository, ask a question, and the grounded response will appear here."}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface px-6 py-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Citations
              </h2>
              <p className="mt-1 text-sm text-muted">
                Supporting files and chunk references will be listed here.
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-border bg-surface-secondary p-4">
              <ul className="space-y-3 text-sm text-muted">
                {answerResult?.citations.length ? (
                  answerResult.citations.map((citation) => (
                    <li
                      key={`${citation.sourceId}:${citation.relativePath}:${citation.startLine}`}
                      className="rounded-xl border border-border bg-white px-4 py-3"
                    >
                      <div className="font-medium text-foreground">
                        [Source {citation.sourceId}] {citation.relativePath}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                        Lines {citation.startLine}-{citation.endLine}
                        {typeof citation.score === "number"
                          ? ` | Score ${citation.score.toFixed(4)}`
                          : ""}
                      </div>
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-700">
                        {citation.snippet}
                      </pre>
                    </li>
                  ))
                ) : (
                  <li className="rounded-xl border border-border bg-white px-4 py-3">
                    No citations yet. Retrieved chunk references will appear here after an answer.
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface px-6 py-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">
              Local LM Studio
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              Environment variable support is ready through
              <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                LM_STUDIO_BASE_URL
              </code>
              ,
              <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                LM_STUDIO_MODEL
              </code>
              ,
              <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                LM_STUDIO_EMBEDDING_MODEL
              </code>
              , and
              <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                LM_STUDIO_API_KEY
              </code>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
