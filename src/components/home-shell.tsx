const placeholderCitations = [
  "No citations yet. Indexed files and chunk references will appear here later.",
];

export function HomeShell() {
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
            This starter keeps the surface area small on purpose. The UI is in
            place for selecting a repository, indexing it later, and asking
            questions once retrieval and answer generation are wired up.
          </p>
        </div>
      </section>

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
                placeholder="C:\\Users\\you\\projects\\example-repo"
                className="w-full rounded-2xl border border-border bg-surface-secondary px-4 py-3 text-sm text-foreground outline-none transition focus:border-slate-400"
              />
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Index Repository
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface px-6 py-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Question
              </h2>
              <p className="mt-1 text-sm text-muted">
                Ask a question about the indexed repository once the backend
                pipeline is connected.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground">
                Question input
              </label>
              <textarea
                placeholder="How is repository indexing orchestrated?"
                rows={5}
                className="w-full resize-none rounded-2xl border border-border bg-surface-secondary px-4 py-3 text-sm text-foreground outline-none transition focus:border-slate-400"
              />
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-white px-5 text-sm font-medium text-foreground transition hover:bg-slate-50"
              >
                Ask Question
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-surface px-6 py-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">Answer</h2>
              <p className="mt-1 text-sm text-muted">
                Response output will land here after retrieval and generation are
                implemented.
              </p>
            </div>
            <div className="min-h-52 rounded-2xl border border-dashed border-border bg-surface-secondary p-4 text-sm leading-7 text-muted">
              No answer yet. This area is intentionally stubbed while the
              indexing, retrieval, and LM Studio integration are still being
              built.
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
                {placeholderCitations.map((citation) => (
                  <li
                    key={citation}
                    className="rounded-xl border border-border bg-white px-4 py-3"
                  >
                    {citation}
                  </li>
                ))}
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
