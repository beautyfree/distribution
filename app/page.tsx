import { KeyboardShortcuts } from "./keyboard";

/**
 * Homepage — static port of designs/homepage-20260424/variant-C-linear.html.
 *
 * Server Component. All interactivity (Cmd/Ctrl+K focus, filter chips, result
 * fetching, draft generation) is stubbed — this is the visual carcass that
 * matches the approved variant C mockup 1:1.
 *
 * TODO: wire to /api/match and /api/draft in a follow-up.
 */
export default function HomePage() {
  return (
    <>
      <KeyboardShortcuts />
      <main className="mx-auto max-w-[720px] px-6 py-6 leading-[1.5]">
        <header className="flex items-center justify-between pt-3 pb-8">
          <div className="flex items-center gap-[10px]">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-md text-[14px] font-bold text-[var(--accent-fg)]"
              style={{
                background: "var(--accent)",
                fontFamily: "var(--font-mono)",
              }}
              aria-hidden
            >
              d
            </div>
            <div className="text-[16px] font-semibold tracking-[-0.01em]">
              distribution
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <a
              href="#"
              className="text-[13px] text-muted hover:text-fg"
            >
              browse
            </a>
            <a
              href="#"
              className="inline-flex min-h-[44px] items-center rounded-md border border-border px-3 py-1.5 text-[13px] text-fg hover:border-[color:var(--fg)] md:min-h-0"
            >
              Add channel →
            </a>
          </nav>
        </header>

        <section className="mt-8">
          <h1 className="mb-3 text-[40px] font-semibold tracking-[-0.025em] leading-[1.1]">
            Where to post your side-project.
          </h1>
          <p className="mb-8 max-w-[540px] text-[16px] text-muted">
            An open registry of communities where AI builders ship and share.
            Telegram, Reddit, Discord, dev directories. Updated by the
            community.
          </p>

          <form
            className="rounded-lg border border-border bg-bg p-1 transition-[border-color,box-shadow] duration-150 focus-within:border-[color:var(--fg)] focus-within:shadow-[0_0_0_4px_rgba(15,15,15,0.04)]"
            action="/api/match"
            method="post"
          >
            {/* TODO: wire to /api/match — submit description, render results */}
            <label htmlFor="project-description" className="sr-only">
              Describe what you built
            </label>
            <textarea
              id="project-description"
              name="description"
              placeholder="Describe what you built…"
              className="min-h-[88px] w-full resize-none border-0 bg-transparent p-3.5 text-[15px] text-fg outline-none placeholder:text-muted"
              autoFocus
            />
            <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-2 pl-2">
              <div
                className="flex flex-wrap gap-1.5"
                aria-label="example prompts"
              >
                {["AI tool for video editors", "B2B sales agent", "indie writing app"].map(
                  (ex) => (
                    <button
                      key={ex}
                      type="button"
                      className="rounded border border-border px-2 py-1 text-[12px] text-muted hover:border-[color:var(--fg)] hover:text-fg"
                    >
                      {ex}
                    </button>
                  ),
                )}
              </div>
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md bg-fg px-3.5 py-2 text-[13px] font-medium text-bg hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-fg)] md:min-h-0"
              >
                Find{" "}
                <kbd
                  className="rounded-[3px] bg-white/15 px-[5px] py-[1px] text-[11px]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  ⏎
                </kbd>
              </button>
            </div>
          </form>
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[12px] text-muted">Filter</span>
          {/* TODO: wire to /api/match — filter result set client-side */}
          <FilterChip label="all types" active />
          <FilterChip label="telegram" />
          <FilterChip label="reddit" />
          <FilterChip label="discord" />
          <FilterChip label="en" />
          <FilterChip label="1k+ subs" />
          <label htmlFor="sort-select" className="sr-only">
            Sort results
          </label>
          <select
            id="sort-select"
            className="ml-auto rounded border border-border bg-transparent px-2 py-1 text-[12px] text-muted"
            defaultValue="best"
          >
            <option value="best">Best match</option>
            <option value="newest">Newest</option>
            <option value="audience">Audience size</option>
          </select>
        </div>

        <section className="mt-4" aria-label="Results">
          <div
            className="mb-3 text-[12px] text-muted"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="font-semibold text-fg">142</span> channels found ·{" "}
            <span className="font-semibold text-fg">+23</span> added this week
          </div>

          {/* TODO: wire to /api/match — replace sample cards with real results */}
          <ResultCard
            name="Indie Hackers Telegram"
            type="telegram-chat"
            audience="12.4k subs"
            rules={`Mon: "share what you're building" thread. Other days: no link spam, conversation only.`}
          />
          <ResultCard
            name="r/SideProject"
            type="subreddit"
            audience="186k subs"
            rules={`Self-promotion welcome. Format: "I built X, here's what I learned." No pure link drops.`}
          />
        </section>

        <footer className="mt-16 flex items-center gap-4 border-t border-border pt-4 text-[12px] text-muted">
          <a href="#" className="text-muted hover:text-fg">
            GitHub ↗
          </a>
          <a href="#" className="text-muted hover:text-fg">
            CC0 license
          </a>
          <span className="ml-auto">Made by builders</span>
        </footer>
      </main>
    </>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active ?? false}
      className={
        active
          ? "rounded border border-[color:var(--accent)] bg-[rgba(255,92,0,0.06)] px-2.5 py-1 text-[12px] text-[color:var(--accent)]"
          : "rounded border border-border bg-transparent px-2.5 py-1 text-[12px] text-muted hover:border-[color:var(--fg)] hover:text-fg"
      }
    >
      {label}
    </button>
  );
}

function ResultCard({
  name,
  type,
  audience,
  rules,
}: {
  name: string;
  type: string;
  audience: string;
  rules: string;
}) {
  return (
    <article
      aria-label={`${name}, ${audience}`}
      className="mb-2 rounded-lg border border-border p-4 transition-colors duration-150 hover:border-[color:var(--fg)]"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-[15px] font-semibold">{name}</span>
          <span
            className="rounded-sm bg-border px-1.5 py-0.5 text-[11px] text-muted"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {type}
          </span>
        </div>
        <span
          className="whitespace-nowrap text-[13px] text-muted"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {audience}
        </span>
      </div>
      <div className="mb-3 text-[13px] text-muted">{rules}</div>
      <div className="flex gap-2">
        <button
          type="button"
          className="min-h-[44px] rounded-md border-0 bg-[color:var(--accent)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--accent-fg)] md:min-h-0"
        >
          {/* TODO: wire to /api/draft */}
          Generate post
        </button>
        <a
          href="#"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-3 py-1.5 text-[12px] text-muted hover:border-[color:var(--fg)] hover:text-fg md:min-h-0"
        >
          Open ↗
        </a>
      </div>
    </article>
  );
}
