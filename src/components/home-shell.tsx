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

function statusLabel(
  indexing: boolean,
  asking: boolean,
  answerResult: AnswerResult | null,
): string {
  if (indexing) {
    return "Indexing repository";
  }

  if (asking) {
    return "Interpreting question";
  }

  if (answerResult?.status === "answered") {
    return "Grounded answer ready";
  }

  return "Local-first code reasoning";
}

export function HomeShell({ defaultRepoPath }: HomeShellProps) {
  const [repoPath, setRepoPath] = useState(defaultRepoPath);
  const [question, setQuestion] = useState("");
  const [indexing, setIndexing] = useState(false);
  const [asking, setAsking] = useState(false);
  const [indexResult, setIndexResult] = useState<IndexingResult | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [answerMeta, setAnswerMeta] = useState<{
    repoPath: string;
    retrievedChunkCount: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusCopy = statusLabel(indexing, asking, answerResult);

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
        throw new Error(
          "message" in payload ? payload.message || "Indexing failed." : "Indexing failed.",
        );
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
          "message" in payload
            ? payload.message || "Answer generation failed."
            : "Answer generation failed.",
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
    <main className="signal-grid relative min-h-screen overflow-hidden px-5 py-6 text-foreground sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="glass-panel hero-glow animate-rise rounded-[2rem] px-6 py-7 sm:px-8 lg:px-10 lg:py-9">
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-accent">
                <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_18px_rgba(124,230,214,0.9)]" />
                CodeAtlas
              </div>

              <div className="space-y-4">
                <p className="max-w-xl text-xs uppercase tracking-[0.38em] text-accent-warm">
                  Dark local-first workspace for code intelligence
                </p>
                <h1 className="max-w-4xl font-display text-5xl leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Sleek codebase exploration with grounded answers and luminous citations.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                  Index a repository, retrieve the most relevant code fragments,
                  and let a local LM Studio model explain how the system works
                  without leaving the page.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/8 bg-white/6 px-4 py-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-slate-400">
                    Active mode
                  </p>
                  <p className="mt-3 text-xl font-semibold text-white">
                    {statusCopy}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-white/8 bg-white/6 px-4 py-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-slate-400">
                    Indexed chunks
                  </p>
                  <p className="mt-3 text-xl font-semibold text-white">
                    {indexResult?.indexedChunkCount ?? "--"}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-white/8 bg-white/6 px-4 py-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.28em] text-slate-400">
                    Retrieved sources
                  </p>
                  <p className="mt-3 text-xl font-semibold text-white">
                    {answerMeta?.retrievedChunkCount ?? "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="animate-rise-slow rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.32em] text-slate-400">
                    Pipeline
                  </p>
                  <p className="mt-2 font-display text-3xl text-white">
                    Signal Chain
                  </p>
                </div>
                <div className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-accent">
                  Live
                </div>
              </div>
              <div className="mt-5 space-y-4 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-4">
                  Scan and chunk the repository into line-aware source segments.
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-4">
                  Embed the index and retrieve the strongest matching code
                  evidence.
                </div>
                <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-4">
                  Generate a grounded answer through LM Studio with structured
                  citations.
                </div>
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="glass-panel animate-rise rounded-[1.7rem] border-danger/30 bg-danger/10 px-5 py-4 text-sm text-rose-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-danger/30 bg-danger/15 px-3 py-1 text-[0.68rem] uppercase tracking-[0.3em] text-danger">
                Error channel
              </span>
              <span className="leading-7">{errorMessage}</span>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <div className="glass-panel animate-rise rounded-[1.9rem] p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.32em] text-accent-warm">
                    Input 01
                  </p>
                  <h2 className="mt-3 font-display text-4xl text-white">
                    Repository
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
                  Active index target
                </div>
              </div>

              <div className="mt-7 space-y-5">
                <label className="block text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Repository path
                </label>
                <input
                  type="text"
                  value={repoPath}
                  onChange={(event) => setRepoPath(event.target.value)}
                  placeholder="C:\\Users\\you\\projects\\example-repo"
                  className="w-full rounded-[1.35rem] border border-white/10 bg-black/20 px-5 py-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-accent-strong focus:bg-black/28"
                />
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => void handleIndexRepository()}
                    disabled={indexing || !repoPath.trim()}
                    className="relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full border border-accent-strong/30 bg-gradient-to-r from-accent-strong/85 to-accent/80 px-6 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] hover:shadow-[0_18px_40px_rgba(107,183,255,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="absolute inset-y-0 left-0 w-24 -translate-x-full bg-white/20 blur-2xl animate-sheen" />
                    <span className="relative z-10">
                      {indexing ? "Indexing repository..." : "Index Repository"}
                    </span>
                  </button>
                  <p className="text-sm leading-7 text-slate-400">
                    {indexResult
                      ? `${indexResult.indexedChunkCount} chunks indexed across ${indexResult.indexedFileCount} files.`
                      : "The selected path becomes the active saved index used for questions."}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel animate-rise-slow rounded-[1.9rem] p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.32em] text-accent-warm">
                    Input 02
                  </p>
                  <h2 className="mt-3 font-display text-4xl text-white">
                    Question
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
                  Grounded response only
                </div>
              </div>

              <div className="mt-7 space-y-5">
                <label className="block text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Natural-language prompt
                </label>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="How is repository indexing orchestrated?"
                  rows={6}
                  className="w-full resize-none rounded-[1.45rem] border border-white/10 bg-black/20 px-5 py-4 text-sm leading-7 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-accent-strong focus:bg-black/28"
                />
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => void handleAskQuestion()}
                    disabled={asking || !question.trim()}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 text-sm font-semibold text-white transition hover:border-accent/35 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {asking ? "Synthesizing answer..." : "Ask Question"}
                  </button>
                  <p className="text-sm leading-7 text-slate-400">
                    {answerMeta
                      ? `Using ${answerMeta.retrievedChunkCount} retrieved chunks from ${answerMeta.repoPath}.`
                      : "Ask after indexing to retrieve evidence and compose a cited answer."}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[1.9rem] p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.32em] text-accent-warm">
                    Runtime
                  </p>
                  <h2 className="mt-3 font-display text-3xl text-white">
                    LM Studio Configuration
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
                  Local endpoints
                </div>
              </div>
              <div className="mt-6 grid gap-3 text-sm leading-7 text-slate-300">
                <div className="rounded-[1.25rem] border border-white/10 bg-black/16 px-4 py-4">
                  <code className="font-mono text-xs text-accent">
                    LM_STUDIO_BASE_URL
                  </code>{" "}
                  points the app at your local OpenAI-compatible LM Studio
                  server.
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-black/16 px-4 py-4">
                  <code className="font-mono text-xs text-accent">
                    LM_STUDIO_MODEL
                  </code>{" "}
                  is used for grounded answer generation.
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-black/16 px-4 py-4">
                  <code className="font-mono text-xs text-accent">
                    LM_STUDIO_EMBEDDING_MODEL
                  </code>{" "}
                  should point to an embedding-capable model.
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-black/16 px-4 py-4">
                  <code className="font-mono text-xs text-accent">
                    LM_STUDIO_API_KEY
                  </code>{" "}
                  is optional and only needed if your local setup expects one.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel animate-rise rounded-[2rem] p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.32em] text-accent-warm">
                    Output
                  </p>
                  <h2 className="mt-3 font-display text-4xl text-white">
                    Answer Canvas
                  </h2>
                </div>
                <div className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-accent">
                  {answerResult?.status ?? "idle"}
                </div>
              </div>
              <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(6,12,23,0.82),rgba(10,19,34,0.92))] p-5">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/8 pb-4">
                  <p className="text-[0.72rem] uppercase tracking-[0.3em] text-slate-400">
                    Grounded narrative
                  </p>
                  <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em] text-slate-300">
                    Citations attached
                  </div>
                </div>
                <div className="min-h-72 whitespace-pre-wrap text-[0.96rem] leading-8 text-slate-200">
                  {answerResult?.answer ||
                    "No answer yet. Index a repository, ask a question, and the generated response will appear here with source references."}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.32em] text-accent-warm">
                    Evidence
                  </p>
                  <h2 className="mt-3 font-display text-4xl text-white">
                    Cited Sources
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
                  {answerResult?.citations.length ?? 0} items
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {answerResult?.citations.length ? (
                  answerResult.citations.map((citation) => (
                    <article
                      key={`${citation.sourceId}:${citation.relativePath}:${citation.startLine}`}
                      className="rounded-[1.6rem] border border-white/10 bg-black/18 p-5 transition hover:border-accent-strong/25 hover:bg-black/24"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[0.68rem] uppercase tracking-[0.32em] text-accent">
                            Source {citation.sourceId}
                          </p>
                          <h3 className="mt-3 text-base font-semibold text-white">
                            {citation.relativePath}
                          </h3>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em] text-slate-300">
                          Lines {citation.startLine}-{citation.endLine}
                          {typeof citation.score === "number"
                            ? ` | Score ${citation.score.toFixed(4)}`
                            : ""}
                        </div>
                      </div>
                      <pre className="mt-5 overflow-x-auto rounded-[1.25rem] border border-white/8 bg-[#050b15] px-4 py-4 font-mono text-xs leading-6 text-slate-300">
                        {citation.snippet}
                      </pre>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[1.6rem] border border-dashed border-white/14 bg-black/14 px-5 py-10 text-center text-sm leading-7 text-slate-400">
                    Retrieved chunk references will appear here after the model
                    answers a question.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
