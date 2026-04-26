"use client";

import { useState } from "react";
import type { ApiNode, MatchMode, ViewMode } from "@/lib/api-types";
import {
  classifyTier,
  groupByPlatform,
  groupByTier,
  TIER_DESCRIPTOR,
  type Tier,
} from "@/lib/tier";
import {
  isSaved,
  togglePosted,
  toggleSaved,
  useSaved,
  type SavedEntry,
} from "@/lib/saved";
import {
  PlatformIcon,
  platformLabel,
  platformShortLabel,
} from "./PlatformIcon";

type DraftState = { state: "loading" | "ok" | "error"; text?: string };

type Props = {
  nodes: ApiNode[];
  mode: MatchMode;
  viewMode: ViewMode;
  drafts: Record<string, DraftState>;
  disabled: boolean;
  onGenerate: (node: ApiNode) => void;
};

export function ResultsView({
  nodes,
  mode,
  viewMode,
  drafts,
  disabled,
  onGenerate,
}: Props) {
  const saved = useSaved();

  if (viewMode === "saved") {
    return (
      <SavedView
        saved={saved}
        mode={mode}
        drafts={drafts}
        disabled={disabled}
        onGenerate={onGenerate}
      />
    );
  }

  if (viewMode === "tier") {
    const groups = groupByTier(nodes, mode);
    const tiers: Tier[] = ["S", "A", "B"];
    return (
      <>
        {tiers.map((tier) =>
          groups[tier].length > 0 ? (
            <Section
              key={tier}
              headerId={`tier-${tier}`}
              header={<TierHeader tier={tier} count={groups[tier].length} />}
              items={groups[tier]}
              mode={mode}
              drafts={drafts}
              disabled={disabled}
              onGenerate={onGenerate}
              showTierDot
            />
          ) : null,
        )}
      </>
    );
  }

  if (viewMode === "platform") {
    const groups = groupByPlatform(nodes);
    return (
      <>
        {Array.from(groups.entries()).map(([type, list]) => (
          <Section
            key={type}
            headerId={`platform-${type}`}
            header={
              <PlatformHeader type={type} count={list.length} />
            }
            items={list}
            mode={mode}
            drafts={drafts}
            disabled={disabled}
            onGenerate={onGenerate}
            showTierDot
          />
        ))}
      </>
    );
  }

  return (
    <ul className="m-0 list-none p-0">
      {nodes.map((n) => (
        <li key={n.id}>
          <ResultCard
            node={n}
            tier={classifyTier(n, mode)}
            showTierDot
            draft={drafts[n.id]}
            disabled={disabled}
            onGenerate={() => onGenerate(n)}
          />
        </li>
      ))}
    </ul>
  );
}

function Section({
  headerId,
  header,
  items,
  mode,
  drafts,
  disabled,
  onGenerate,
  showTierDot,
}: {
  headerId: string;
  header: React.ReactNode;
  items: ApiNode[];
  mode: MatchMode;
  drafts: Record<string, DraftState>;
  disabled: boolean;
  onGenerate: (node: ApiNode) => void;
  showTierDot: boolean;
}) {
  return (
    <section aria-labelledby={headerId} className="mb-2">
      {header}
      <ul className="m-0 list-none p-0">
        {items.map((n) => (
          <li key={n.id}>
            <ResultCard
              node={n}
              tier={classifyTier(n, mode)}
              showTierDot={showTierDot}
              draft={drafts[n.id]}
              disabled={disabled}
              onGenerate={() => onGenerate(n)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TierHeader({ tier, count }: { tier: Tier; count: number }) {
  return (
    <div className="mt-8 mb-3 first:mt-4">
      <h2
        id={`tier-${tier}`}
        className="flex items-baseline gap-2 pb-1 text-[13px]"
        aria-label={`Tier ${tier}, ${TIER_DESCRIPTOR[tier]}, ${count} channels`}
      >
        <span
          className="text-fg"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            letterSpacing: "0.08em",
          }}
        >
          TIER {tier}
        </span>
        <span className="text-muted">· {TIER_DESCRIPTOR[tier]}</span>
        <span
          className="ml-auto text-[12px] text-muted"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {count}
        </span>
      </h2>
      <div className="h-px bg-border" aria-hidden />
    </div>
  );
}

function PlatformHeader({ type, count }: { type: string; count: number }) {
  return (
    <div className="mt-8 mb-3 first:mt-4">
      <h2
        id={`platform-${type}`}
        className="flex items-center gap-2 pb-1 text-[15px]"
      >
        <PlatformIcon type={type} variant="brand" size={16} />
        <span className="font-medium text-fg">{platformShortLabel(type)}</span>
        <span
          className="ml-auto text-[12px] text-muted"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {count}
        </span>
      </h2>
      <div className="h-px bg-border" aria-hidden />
    </div>
  );
}

function formatAudience(n: number): string {
  if (n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M subs`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k subs`;
  return `${n} subs`;
}

function TierDot({ tier }: { tier: Tier }) {
  const color =
    tier === "S"
      ? "var(--accent)"
      : tier === "A"
        ? "var(--fg)"
        : "var(--muted)";
  return (
    <span
      role="img"
      aria-label={`Tier ${tier}`}
      title={`Tier ${tier} · ${TIER_DESCRIPTOR[tier]}`}
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

function ResultCard({
  node,
  tier,
  showTierDot,
  draft,
  disabled,
  onGenerate,
}: {
  node: ApiNode;
  tier: Tier;
  showTierDot: boolean;
  draft?: DraftState;
  disabled: boolean;
  onGenerate: () => void;
}) {
  const saved = useSaved();
  const entry = isSaved(node.id, saved);
  const isPosted = !!entry?.posted;
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!draft?.text) return;
    try {
      await navigator.clipboard.writeText(draft.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <article
      aria-label={`${node.name}, ${formatAudience(node.audience_size)}`}
      className={`mb-2 rounded-lg border p-4 transition-colors duration-150 hover:border-[color:var(--fg)] ${isPosted ? "border-[color:var(--border)] opacity-60" : "border-border"}`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {showTierDot ? <TierDot tier={tier} /> : null}
          <PlatformIcon
            type={node.type}
            variant="brand"
            size={18}
            className="shrink-0"
          />
          <span className="text-[15px] font-semibold">{node.name}</span>
          <span
            className="text-[11px] text-muted"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {platformLabel(node.type)}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="whitespace-nowrap text-[13px] text-muted"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {formatAudience(node.audience_size)}
          </span>
          <button
            type="button"
            onClick={() => toggleSaved(node)}
            aria-pressed={!!entry}
            aria-label={entry ? "Remove from saved" : "Save channel"}
            title={entry ? "Saved — click to remove" : "Save channel"}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-[14px] ${entry ? "border-[color:var(--accent)] text-[color:var(--accent)]" : "border-border text-muted hover:border-[color:var(--fg)] hover:text-fg"}`}
          >
            <span aria-hidden>{entry ? "★" : "☆"}</span>
          </button>
          {entry ? (
            <button
              type="button"
              onClick={() => togglePosted(node.id)}
              aria-pressed={isPosted}
              aria-label={isPosted ? "Mark as not posted" : "Mark as posted"}
              title={isPosted ? "Posted — click to unmark" : "Mark posted"}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md border text-[14px] ${isPosted ? "border-[color:var(--fg)] bg-fg text-bg" : "border-border text-muted hover:border-[color:var(--fg)] hover:text-fg"}`}
            >
              <span aria-hidden>✓</span>
            </button>
          ) : null}
        </div>
      </div>
      <div className="mb-3 text-[13px] text-muted">{node.post_rules}</div>

      {draft?.state === "ok" ? (
        <div className="mb-3 rounded-md border border-border bg-[color:var(--border)]/30 p-3 text-[13px] text-fg whitespace-pre-wrap break-words">
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

function SavedView({
  saved,
  mode,
  drafts,
  disabled,
  onGenerate,
}: {
  saved: SavedEntry[];
  mode: MatchMode;
  drafts: Record<string, DraftState>;
  disabled: boolean;
  onGenerate: (node: ApiNode) => void;
}) {
  if (saved.length === 0) {
    return (
      <div className="mt-2 rounded-lg border border-border p-6 text-center text-[14px] text-muted">
        <div className="mb-2 text-fg">No saved channels yet.</div>
        <div>
          Tap{" "}
          <span
            aria-hidden
            className="inline-flex h-5 w-5 items-center justify-center rounded border border-border text-[12px]"
          >
            ☆
          </span>{" "}
          on any channel to save it. Track which ones you’ve posted to here.
        </div>
      </div>
    );
  }
  const remaining = saved.filter((e) => !e.posted);
  const posted = saved.filter((e) => e.posted);
  return (
    <>
      {remaining.length > 0 ? (
        <Section
          headerId="saved-remaining"
          header={
            <SavedSectionHeader
              id="saved-remaining"
              label="To post"
              count={remaining.length}
            />
          }
          items={remaining.map((e) => e.node)}
          mode={mode}
          drafts={drafts}
          disabled={disabled}
          onGenerate={onGenerate}
          showTierDot={false}
        />
      ) : null}
      {posted.length > 0 ? (
        <Section
          headerId="saved-posted"
          header={
            <SavedSectionHeader
              id="saved-posted"
              label="Posted"
              count={posted.length}
              muted
            />
          }
          items={posted.map((e) => e.node)}
          mode={mode}
          drafts={drafts}
          disabled={disabled}
          onGenerate={onGenerate}
          showTierDot={false}
        />
      ) : null}
    </>
  );
}

function SavedSectionHeader({
  id,
  label,
  count,
  muted = false,
}: {
  id: string;
  label: string;
  count: number;
  muted?: boolean;
}) {
  return (
    <div className="mt-8 mb-3 first:mt-4">
      <h2
        id={id}
        className="flex items-baseline gap-2 pb-1 text-[13px]"
        aria-label={`${label}, ${count} channels`}
      >
        <span
          className={muted ? "text-muted" : "text-fg"}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            letterSpacing: "0.08em",
          }}
        >
          {label.toUpperCase()}
        </span>
        <span
          className="ml-auto text-[12px] text-muted"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {count}
        </span>
      </h2>
      <div className="h-px bg-border" aria-hidden />
    </div>
  );
}
