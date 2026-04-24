"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

type ApiNode = {
  id: string;
  type: string;
  name: string;
  url: string;
  audience_size: number;
  topics: string[];
  post_rules: string;
  post_format: string;
  language: string;
  description: string | null;
  score: number;
};

type MatchResponse = {
  count: number;
  mode: "semantic" | "topical" | "empty";
  nodes: ApiNode[];
};

type Sort = "best" | "newest" | "audience";

const TYPE_FILTERS: { label: string; value: string }[] = [
  { label: "telegram", value: "telegram-chat" },
  { label: "reddit", value: "subreddit" },
  { label: "discord", value: "discord-server" },
  { label: "directory", value: "directory" },
];

const EXAMPLES = [
  "AI tool for video editors",
  "B2B sales agent",
  "indie writing app",
];

export function SearchExperience() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [description, setDescription] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [enOnly, setEnOnly] = useState(false);
  const [minK, setMinK] = useState(false);
  const [sort, setSort] = useState<Sort>("best");
  const [results, setResults] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, { state: "loading" | "ok" | "error"; text?: string }>>({});

  // Cmd/Ctrl+K focuses textarea (replaces app/keyboard.tsx wiring inline)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setError(null);
      const filters: Record<string, unknown> = {};
      if (activeTypes.size > 0) filters.types = Array.from(activeTypes);
      if (enOnly) filters.language = "en";
      if (minK) filters.minAudience = 1000;
      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: trimmed, filters, sort }),
        });
        if (!res.ok) {
          setError(`search failed: ${res.status}`);
          return;
        }
        const data = (await res.json()) as MatchResponse;
        setResults(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "network error");
      }
    },
    [activeTypes, enOnly, minK, sort],
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(() => {
      void submit(description);
    });
  }

  function toggleType(value: string) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    if (description.trim()) startTransition(() => void submit(description));
  }

  async function generateDraft(node: ApiNode) {
    if (!description.trim()) return;
    setDrafts((d) => ({ ...d, [node.id]: { state: "loading" } }));
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: node.id, description }),
      });
      const data = (await res.json()) as { draft?: string; error?: string };
      if (!res.ok || !data.draft) {
        setDrafts((d) => ({ ...d, [node.id]: { state: "error", text: data.error ?? `${res.status}` } }));
        return;
      }
      setDrafts((d) => ({ ...d, [node.id]: { state: "ok", text: data.draft } }));
    } catch (e) {
      setDrafts((d) => ({
        ...d,
        [node.id]: { state: "error", text: e instanceof Error ? e.message : "network error" },
      }));
    }
  }

  const showResults = results !== null || pending;
  const hasResults = !!results && results.nodes.length > 0;
  const isEmpty = results !== null && results.nodes.length === 0;

  return (
    <>
      <section className="mt-8">
        <h1 className="mb-3 text-[40px] font-semibold tracking-[-0.025em] leading-[1.1]">
          Where to post your side-project.
        </h1>
        <p className="mb-8 max-w-[540px] text-[16px] text-muted">
          An open registry of communities where AI builders ship and share.
          Telegram, Reddit, Discord, dev directories. Updated by the community.
        </p>

        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-border bg-bg p-1 transition-[border-color,box-shadow] duration-150 focus-within:border-[color:var(--fg)] focus-within:shadow-[0_0_0_4px_rgba(15,15,15,0.04)]"
        >
          <label htmlFor="project-description" className="sr-only">
            Describe what you built
          </label>
          <textarea
            ref={textareaRef}
            id="project-description"
            name="description"
            placeholder="Describe what you built…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[88px] w-full resize-none border-0 bg-transparent p-3.5 text-[15px] text-fg outline-none placeholder:text-muted"
            autoFocus
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-2 pb-2 pl-2">
            <div className="flex flex-wrap gap-1.5" aria-label="example prompts">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setDescription(ex);
                    startTransition(() => void submit(ex));
                  }}
                  className="rounded border border-border px-2 py-1 text-[12px] text-muted hover:border-[color:var(--fg)] hover:text-fg"
                >
                  {ex}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={pending || !description.trim()}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md bg-fg px-3.5 py-2 text-[13px] font-medium text-bg hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-fg)] disabled:opacity-40 md:min-h-0"
            >
              {pending ? "Searching…" : "Find"}{" "}
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
        <FilterChip
          label="all types"
          active={activeTypes.size === 0}
          onClick={() => {
            setActiveTypes(new Set());
            if (description.trim()) startTransition(() => void submit(description));
          }}
        />
        {TYPE_FILTERS.map((f) => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={activeTypes.has(f.value)}
            onClick={() => toggleType(f.value)}
          />
        ))}
        <FilterChip
          label="en"
          active={enOnly}
          onClick={() => {
            setEnOnly((v) => !v);
            if (description.trim()) startTransition(() => void submit(description));
          }}
        />
        <FilterChip
          label="1k+ subs"
          active={minK}
          onClick={() => {
            setMinK((v) => !v);
            if (description.trim()) startTransition(() => void submit(description));
          }}
        />
        <label htmlFor="sort-select" className="sr-only">
          Sort results
        </label>
        <select
          id="sort-select"
          value={sort}
          onChange={(e) => {
            const next = e.target.value as Sort;
            setSort(next);
            if (description.trim()) startTransition(() => void submit(description));
          }}
          className="ml-auto rounded border border-border bg-transparent px-2 py-1 text-[12px] text-muted"
        >
          <option value="best">Best match</option>
          <option value="newest">Newest</option>
          <option value="audience">Audience size</option>
        </select>
      </div>

      <section className="mt-4" aria-label="Results" aria-busy={pending}>
        {error ? (
          <div
            role="alert"
            className="mb-3 rounded-md border border-[color:var(--accent)] bg-[rgba(255,92,0,0.06)] p-3 text-[13px] text-fg"
          >
            {error} —{" "}
            <button
              type="button"
              onClick={() => startTransition(() => void submit(description))}
              className="underline"
            >
              retry
            </button>
          </div>
        ) : null}

        {!showResults ? (
          <EmptyHint />
        ) : pending && !results ? (
          <SkeletonList />
        ) : isEmpty ? (
          <EmptyResults />
        ) : hasResults ? (
          <>
            <div
              className="mb-3 text-[12px] text-muted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span className="font-semibold text-fg">{results!.count}</span>{" "}
              channels found
              {results!.mode === "topical" ? (
                <span> · topical fallback (no OpenAI key)</span>
              ) : null}
            </div>
            {results!.nodes.map((n) => (
              <ResultCard
                key={n.id}
                node={n}
                draft={drafts[n.id]}
                disabled={!description.trim()}
                onGenerate={() => generateDraft(n)}
              />
            ))}
          </>
        ) : null}
      </section>
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
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

function EmptyHint() {
  return (
    <div className="mt-2 text-[13px] text-muted">
      Type what you built, hit{" "}
      <kbd
        className="rounded-[3px] border border-border px-[5px] py-[1px] text-[11px]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        ⏎
      </kbd>{" "}
      or click an example chip.
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="mt-2 rounded-lg border border-border p-6 text-center text-[14px] text-muted">
      <div className="mb-2 text-fg">No channels match this yet.</div>
      <div>
        Try a broader phrase, or{" "}
        <a
          href="https://github.com/devall/distribution-registry/issues/new?template=add-channel.md"
          className="underline hover:text-fg"
          target="_blank"
          rel="noreferrer"
        >
          suggest one →
        </a>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="mb-2 h-[110px] animate-pulse rounded-lg border border-border bg-[color:var(--border)] opacity-30"
        />
      ))}
    </>
  );
}

function formatAudience(n: number): string {
  if (n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M subs`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k subs`;
  return `${n} subs`;
}

function ResultCard({
  node,
  draft,
  disabled,
  onGenerate,
}: {
  node: ApiNode;
  draft?: { state: "loading" | "ok" | "error"; text?: string };
  disabled: boolean;
  onGenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!draft?.text) return;
    try {
      await navigator.clipboard.writeText(draft.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — leave text visible for manual copy */
    }
  }
  return (
    <article
      aria-label={`${node.name}, ${formatAudience(node.audience_size)}`}
      className="mb-2 rounded-lg border border-border p-4 transition-colors duration-150 hover:border-[color:var(--fg)]"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-[15px] font-semibold">{node.name}</span>
          <span
            className="rounded-sm bg-border px-1.5 py-0.5 text-[11px] text-muted"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {node.type}
          </span>
        </div>
        <span
          className="whitespace-nowrap text-[13px] text-muted"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {formatAudience(node.audience_size)}
        </span>
      </div>
      <div className="mb-3 text-[13px] text-muted">{node.post_rules}</div>

      {draft?.state === "ok" ? (
        <div className="mb-3 rounded-md border border-border bg-[color:var(--border)]/30 p-3 text-[13px] text-fg whitespace-pre-wrap">
          {draft.text}
        </div>
      ) : draft?.state === "error" ? (
        <div
          role="alert"
          className="mb-3 rounded-md border border-[color:var(--accent)] bg-[rgba(255,92,0,0.06)] p-2 text-[12px] text-fg"
        >
          Draft failed: {draft.text}
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={disabled || draft?.state === "loading"}
          aria-busy={draft?.state === "loading"}
          className="inline-flex min-h-[44px] items-center rounded-md border-0 bg-[color:var(--accent)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--accent-fg)] disabled:opacity-40 md:min-h-0"
        >
          {draft?.state === "loading"
            ? "Generating…"
            : draft?.state === "ok"
              ? "Regenerate"
              : "Generate post"}
        </button>
        {draft?.state === "ok" ? (
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-[44px] items-center rounded-md border border-border px-3 py-1.5 text-[12px] text-muted hover:border-[color:var(--fg)] hover:text-fg md:min-h-0"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        ) : null}
        <a
          href={node.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] items-center rounded-md border border-border px-3 py-1.5 text-[12px] text-muted hover:border-[color:var(--fg)] hover:text-fg md:min-h-0"
        >
          Open ↗
        </a>
      </div>
    </article>
  );
}
