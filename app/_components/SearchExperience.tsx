"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import type {
  ApiNode,
  MatchResponse,
  Sort,
  ViewMode,
} from "@/lib/api-types";
import {
  decodeSearchState,
  encodeSearchState,
  type SearchState,
} from "@/lib/url-state";
import { savedCounts, useSaved } from "@/lib/saved";
import { ResultsView } from "./ResultsView";

type DraftState = { state: "loading" | "ok" | "error"; text?: string };

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

const VIEW_OPTIONS: { label: string; value: ViewMode }[] = [
  { label: "Tier", value: "tier" },
  { label: "Platform", value: "platform" },
  { label: "Flat", value: "flat" },
  { label: "Saved", value: "saved" },
];

const COOKIE_NAME = "dist_sid";
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${
    typeof location !== "undefined" && location.protocol === "https:" ? "; secure" : ""
  }`;
}

async function hashSid(sid: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) return sid.slice(0, 12);
  const buf = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(sid),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

export function SearchExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Hydrate once from URL. After mount, state lives in React and the URL
  // mirrors state via router.replace — not the other way around. Re-reading
  // searchParams would fight the component's own writes.
  const initial = useMemo(
    () => decodeSearchState(new URLSearchParams(searchParams.toString())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [description, setDescription] = useState(initial.description);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    () => new Set(initial.types),
  );
  const [enOnly, setEnOnly] = useState(initial.language === "en");
  const [minK, setMinK] = useState(
    initial.minAudience !== null && initial.minAudience >= 1000,
  );
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [view, setView] = useState<ViewMode>(initial.view);
  const [results, setResults] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const didAutoSubmitRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = readCookie(COOKIE_NAME);
      const sid = existing ?? crypto.randomUUID();
      writeCookie(COOKIE_NAME, sid);
      if (existing) {
        const hash = await hashSid(sid);
        if (!cancelled) track("session_return", { sid: hash });
      } else if (!cancelled) {
        track("session_new");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const syncURL = useCallback(
    (state: SearchState) => {
      const p = encodeSearchState(state);
      const query = p.toString();
      const target = query ? `/?${query}` : "/";
      router.replace(target, { scroll: false });
    },
    [router],
  );

  const submit = useCallback(
    async (text: string, overrides?: Partial<SearchState>) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setError(null);
      const state: SearchState = {
        description: trimmed,
        types: overrides?.types ?? Array.from(activeTypes),
        language: overrides?.language ?? (enOnly ? "en" : null),
        minAudience: overrides?.minAudience ?? (minK ? 1000 : null),
        sort: overrides?.sort ?? sort,
        view: overrides?.view ?? view,
      };
      const filters: Record<string, unknown> = {};
      if (state.types.length > 0) filters.types = state.types;
      if (state.language === "en") filters.language = "en";
      if (state.minAudience) filters.minAudience = state.minAudience;

      syncURL(state);

      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: trimmed,
            filters,
            sort: state.sort,
          }),
        });
        if (!res.ok) {
          setError(`search failed: ${res.status}`);
          return;
        }
        const data = (await res.json()) as MatchResponse;
        setResults(data);
        track("match_submitted", { mode: data.mode, count: data.count });
      } catch (e) {
        setError(e instanceof Error ? e.message : "network error");
      }
    },
    [activeTypes, enOnly, minK, sort, view, syncURL],
  );

  useEffect(() => {
    if (didAutoSubmitRef.current) return;
    if (initial.description.trim()) {
      didAutoSubmitRef.current = true;
      startTransition(() => void submit(initial.description));
    }
  }, [initial.description, submit]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(() => void submit(description));
  }

  function toggleType(value: string) {
    const next = new Set(activeTypes);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setActiveTypes(next);
    if (description.trim())
      startTransition(() =>
        void submit(description, { types: Array.from(next) }),
      );
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
        setDrafts((d) => ({
          ...d,
          [node.id]: { state: "error", text: data.error ?? `${res.status}` },
        }));
        return;
      }
      setDrafts((d) => ({ ...d, [node.id]: { state: "ok", text: data.draft } }));
      track("draft_generated", { type: node.type });
    } catch (e) {
      setDrafts((d) => ({
        ...d,
        [node.id]: {
          state: "error",
          text: e instanceof Error ? e.message : "network error",
        },
      }));
    }
  }

  const saved = useSaved();
  const counts = savedCounts(saved);
  const isSavedView = view === "saved";
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

      <div
        className="mt-8 flex flex-wrap items-center gap-2"
        role="radiogroup"
        aria-label="Results view mode"
      >
        <span className="mr-1 text-[12px] text-muted">View</span>
        {VIEW_OPTIONS.map((opt) => {
          const active = view === opt.value;
          const isSavedOpt = opt.value === "saved";
          const label =
            isSavedOpt && counts.saved > 0
              ? `${opt.label} (${counts.saved}${counts.posted > 0 ? `, ${counts.posted}✓` : ""})`
              : opt.label;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setView(opt.value);
                syncURL({
                  description,
                  types: Array.from(activeTypes),
                  language: enOnly ? "en" : null,
                  minAudience: minK ? 1000 : null,
                  sort,
                  view: opt.value,
                });
              }}
              className={
                active
                  ? "rounded border border-[color:var(--accent)] bg-[rgba(255,92,0,0.06)] px-2.5 py-1 text-[12px] text-[color:var(--accent)]"
                  : "rounded border border-border bg-transparent px-2.5 py-1 text-[12px] text-muted hover:border-[color:var(--fg)] hover:text-fg"
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[12px] text-muted">Filter</span>
        <FilterChip
          label="all types"
          active={activeTypes.size === 0}
          onClick={() => {
            setActiveTypes(new Set());
            if (description.trim())
              startTransition(() => void submit(description, { types: [] }));
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
            const next = !enOnly;
            setEnOnly(next);
            if (description.trim())
              startTransition(() =>
                void submit(description, { language: next ? "en" : null }),
              );
          }}
        />
        <FilterChip
          label="1k+ subs"
          active={minK}
          onClick={() => {
            const next = !minK;
            setMinK(next);
            if (description.trim())
              startTransition(() =>
                void submit(description, { minAudience: next ? 1000 : null }),
              );
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
            if (description.trim())
              startTransition(() =>
                void submit(description, { sort: next }),
              );
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

        {isSavedView ? (
          <ResultsView
            nodes={results?.nodes ?? []}
            mode={results?.mode ?? "semantic"}
            viewMode="saved"
            drafts={drafts}
            disabled={!description.trim()}
            onGenerate={generateDraft}
          />
        ) : !showResults ? (
          <EmptyHint />
        ) : pending && !results ? (
          <SkeletonList />
        ) : isEmpty ? (
          <EmptyResults />
        ) : hasResults ? (
          <>
            <div
              className="mb-3 flex flex-wrap items-center gap-2 text-[12px] text-muted"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span>
                <span className="font-semibold text-fg">{results!.count}</span>{" "}
                channels found
              </span>
              {results!.mode === "topical" ? (
                <span
                  className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted"
                  title="No embedding key configured — ranking by keyword overlap. Set OPENAI_API_KEY for semantic search."
                >
                  <span aria-hidden>ⓘ</span>
                  <span>[mode: topical]</span>
                </span>
              ) : null}
            </div>
            <ResultsView
              nodes={results!.nodes}
              mode={results!.mode}
              viewMode={view}
              drafts={drafts}
              disabled={!description.trim()}
              onGenerate={generateDraft}
            />
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
          href="https://github.com/beautyfree/distribution-registry/issues/new?template=add-channel.md"
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
