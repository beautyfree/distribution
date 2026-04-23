import { and, eq, isNull, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { ProjectBrief } from "@/lib/brief";
import * as schema from "@/lib/db/schema";
import type {
  AdapterCapabilities,
  AdapterCandidate,
  AdapterHealth,
  AdapterSearchRequest,
  AdapterSearchResult,
} from "@/lib/adapters/types";

const ADAPTER_ID = "telegram" as const;
const VERSION = "1.0.0";

export function telegramCapabilities(): AdapterCapabilities {
  return {
    adapter_id: ADAPTER_ID,
    version: VERSION,
    modes: ["search"],
    rate_limit_per_minute: 20,
    notes:
      "v0.1: ranks Venue rows in Postgres only (curated-DB model). No global Telegram discovery.",
  };
}

export function telegramHealth(): AdapterHealth {
  return { adapter_id: ADAPTER_ID, ok: true };
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s#+-]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1),
  );
}

function scoreVenue(
  brief: ProjectBrief,
  row: typeof schema.venues.$inferSelect,
): { score: number; hits: string[] } {
  const corpus = [
    brief.title,
    brief.summary,
    ...brief.tags,
    ...(brief.target_audience ? [brief.target_audience] : []),
  ].join(" ");
  const bt = tokenize(corpus);
  const vt = new Set([
    ...tokenize(row.name),
    ...tokenize(row.description),
    ...row.tags.flatMap((t) => tokenize(t)),
  ]);
  let overlap = 0;
  const hits: string[] = [];
  for (const w of bt) {
    if (vt.has(w)) {
      overlap += 1;
      if (hits.length < 5) hits.push(w);
    }
  }
  const langBoost =
    row.language && row.language === brief.language ? 1.15 : row.language ? 0.85 : 1;
  const score = (overlap + 0.01) * (row.scoringWeight ?? 1) * langBoost;
  return { score, hits };
}

function diversify(
  rows: { row: typeof schema.venues.$inferSelect; score: number; hits: string[] }[],
  maxResults: number,
  perTypeCap: number,
): { row: typeof schema.venues.$inferSelect; score: number; hits: string[] }[] {
  const out: typeof rows = [];
  const typeCount = new Map<string, number>();
  for (const item of rows) {
    const t = item.row.type;
    const c = typeCount.get(t) ?? 0;
    if (c >= perTypeCap) continue;
    typeCount.set(t, c + 1);
    out.push(item);
    if (out.length >= maxResults) break;
  }
  return out;
}

/**
 * v0.1 telegram.search: load matching venues from DB, rank by keyword overlap + weights.
 * No outbound Telegram API (see docs/telegram-strategy.md).
 */
export async function telegramSearch(
  db: NodePgDatabase<typeof schema>,
  req: AdapterSearchRequest,
): Promise<AdapterSearchResult> {
  const { project_brief: brief, max_results } = req;
  const lang = brief.language;

  const base = db.select().from(schema.venues);
  const rows = await base.where(
    and(
      eq(schema.venues.isNsfwOrRestricted, false),
      or(eq(schema.venues.language, lang), isNull(schema.venues.language)),
    ),
  );

  const scored = rows
    .map((row) => {
      const { score, hits } = scoreVenue(brief, row);
      return { row, score, hits };
    })
    .sort((a, b) => b.score - a.score);

  const picked = diversify(scored, Math.min(max_results, 20), 3);

  const items: AdapterCandidate[] = picked.map(({ row, score, hits }) => ({
    external_id: row.slug,
    title: row.name,
    relevance_score: Math.round(score * 1000) / 1000,
    evidence: [
      hits.length
        ? `Keyword overlap with your brief: ${hits.join(", ")}`
        : "Low direct keyword overlap — still listed if language matched; broaden tags or summary.",
      row.source === "adapter_telegram"
        ? "Source: adapter_telegram (metadata in your DB; not a live search of Telegram)."
        : "Source: curated index.",
    ],
    suggested_venue: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      type: row.type,
      source: row.source,
      url: row.url,
      description: row.description,
      language: row.language,
      region: row.region,
      rules_url: row.rulesUrl,
      requires_approval: row.requiresApproval,
      is_nsfw_or_restricted: row.isNsfwOrRestricted,
      scoring_weight: row.scoringWeight,
      tags: row.tags,
      metadata: row.metadata,
    },
  }));

  return {
    request_id: req.request_id,
    status: "ok",
    items,
  };
}
