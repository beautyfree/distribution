"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Recommendation } from "@/lib/recommendations";

type ChecklistState = Record<string, Record<string, boolean>>;

function loadChecklistState(): ChecklistState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("distribution:checklist:v0");
    if (!raw) return {};
    return JSON.parse(raw) as ChecklistState;
  } catch {
    return {};
  }
}

function saveChecklistState(next: ChecklistState) {
  localStorage.setItem("distribution:checklist:v0", JSON.stringify(next));
}

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [language, setLanguage] = useState("en");
  const [tagsStr, setTagsStr] = useState("indie, saas");
  const [linksStr, setLinksStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistState>({});
  const [finishedRequest, setFinishedRequest] = useState(false);

  useEffect(() => {
    setChecklist(loadChecklistState());
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const toggleChecklist = useCallback(
    (recId: string, itemId: string, done: boolean) => {
      setChecklist((prev) => {
        const next = {
          ...prev,
          [recId]: { ...prev[recId], [itemId]: done },
        };
        saveChecklistState(next);
        return next;
      });
    },
    [],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setCopyToast(null);
      setLoading(true);
      setFinishedRequest(false);
      setRecommendations([]);
      try {
        const tags = tagsStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const links = linksStr
          .split(/\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schema_version: "1.0",
            title,
            summary,
            language,
            tags,
            links,
          }),
        });
        const data = (await res.json()) as {
          recommendations?: Recommendation[];
          error?: string;
          details?: string;
        };
        if (!res.ok) {
          setError(
            data.details ?? data.error ?? `Request failed (${res.status})`,
          );
          return;
        }
        setRecommendations(data.recommendations ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
      } finally {
        setLoading(false);
        setFinishedRequest(true);
      }
    },
    [title, summary, language, tagsStr, linksStr],
  );

  const copyDraft = useCallback(async (body: string) => {
    try {
      await navigator.clipboard.writeText(body);
      setCopyToast("Copied");
      setTimeout(() => setCopyToast(null), 2000);
    } catch {
      setCopyToast("Copy failed");
      setTimeout(() => setCopyToast(null), 2500);
    }
  }, []);

  const checklistFor = useCallback(
    (rec: Recommendation) => {
      const stored = checklist[rec.recommendation_id] ?? {};
      return rec.checklist.map((item) => ({
        ...item,
        done: stored[item.id] ?? item.done,
      }));
    },
    [checklist],
  );

  const emptyMessage = useMemo(() => {
    if (!finishedRequest || loading || recommendations.length > 0) return null;
    return (
      <div className="empty-state" role="status">
        <p>
          <strong>No venues match yet.</strong> Try broadening language, adding
          tags that describe your stack or audience, or seeding more curated rows
          in Postgres.
        </p>
      </div>
    );
  }, [finishedRequest, loading, recommendations.length]);

  return (
    <>
      <header className="app-header">
        <strong>Distribution</strong>
      </header>
      <main>
        <h1>Where to post</h1>
        <p className="value-prop">
          Describe your project — get ranked venues, evidence, and a draft you
          can edit. Suggestions come from <strong>your curated index</strong>{" "}
          (v0.1 Telegram slice ranks DB rows only; no global Telegram search).
        </p>

        <h2 id="brief">Your project</h2>
        <form className="form-grid" onSubmit={onSubmit} aria-labelledby="brief">
          <label>
            Title <span aria-hidden="true">*</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label>
            Summary <span aria-hidden="true">*</span>
            <textarea
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </label>
          <label>
            Language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">en</option>
              <option value="ru">ru</option>
            </select>
          </label>
          <label>
            Tags (comma-separated)
            <input
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="indie, devtool"
            />
          </label>
          <label>
            Links (one URL per line, optional)
            <textarea
              value={linksStr}
              onChange={(e) => setLinksStr(e.target.value)}
              rows={2}
            />
          </label>
          <button
            type="submit"
            className="primary"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Loading…" : "Get recommendations"}
          </button>
        </form>

        {error ? (
          <div className="alert" role="alert">
            {error}
          </div>
        ) : null}

        <h2 id="results">Recommendations</h2>
        <div aria-live="polite">
          {emptyMessage}
          <ul className="venue-list">
            {recommendations.map((rec) => {
              const v = rec.venue;
              const name = String(v.name ?? "Venue");
              const type = String(v.type ?? "");
              const source = String(v.source ?? "");
              const isAdapter = source === "adapter_telegram";
              const open = expanded.has(rec.recommendation_id);
              const draft = rec.draft_posts[0]?.body ?? "";
              return (
                <li key={rec.recommendation_id} className="venue-row">
                  <header>
                    <strong>{name}</strong>
                    <span className="badge">{type.replace("_", " ")}</span>
                    <span
                      className={isAdapter ? "badge adapter" : "badge"}
                      title="Provenance"
                    >
                      {isAdapter ? "adapter:telegram (DB)" : "curated"}
                    </span>
                    {v.url ? (
                      <a href={String(v.url)} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    ) : null}
                  </header>
                  <ul className="evidence">
                    {rec.evidence.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <div className="copy-row">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => toggleExpand(rec.recommendation_id)}
                      aria-expanded={open}
                    >
                      {open ? "Hide draft" : "Show draft"}
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => copyDraft(draft)}
                    >
                      Copy draft
                    </button>
                    {copyToast ? (
                      <span className="toast" role="status">
                        {copyToast}
                      </span>
                    ) : null}
                  </div>
                  {open ? (
                    <pre
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.65rem",
                        background: "#f3f1ec",
                        borderRadius: "var(--radius-input)",
                        fontSize: "0.8rem",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {draft}
                    </pre>
                  ) : null}
                  <div style={{ marginTop: "0.65rem" }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                      Checklist (saved in this browser)
                    </div>
                    <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.2rem" }}>
                      {checklistFor(rec).map((item) => (
                        <li key={item.id} style={{ listStyle: "none" }}>
                          <label
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              alignItems: "center",
                              fontSize: "0.875rem",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={(e) =>
                                toggleChecklist(
                                  rec.recommendation_id,
                                  item.id,
                                  e.target.checked,
                                )
                              }
                            />
                            {item.label}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="disclaimer">
          <p>
            Suggestions are not endorsed by venue moderators. Read each
            community&apos;s rules before posting.
          </p>
          <p>Do not spam; this tool only suggests where to look.</p>
        </div>

        <footer className="site-footer">
          Privacy: checklist toggles stay in <code>localStorage</code> on this
          device only. Brief text is sent to this app&apos;s server for ranking
          and is not logged by default — define retention in README for
          production.
        </footer>
      </main>
    </>
  );
}
