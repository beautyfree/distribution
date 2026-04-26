import type { ApiNode, MatchMode } from "./api-types";

export type Tier = "S" | "A" | "B";

type Thresholds = { s: number; a: number };

const SEMANTIC: Thresholds = { s: 0.4, a: 0.25 };
const TOPICAL: Thresholds = { s: 0.3, a: 0.15 };

export function classifyTier(node: ApiNode, mode: MatchMode = "semantic"): Tier {
  const t = mode === "topical" ? TOPICAL : SEMANTIC;
  if (node.score >= t.s) return "S";
  if (node.score >= t.a) return "A";
  return "B";
}

export function groupByTier(
  nodes: ApiNode[],
  mode: MatchMode = "semantic",
): Record<Tier, ApiNode[]> {
  const out: Record<Tier, ApiNode[]> = { S: [], A: [], B: [] };
  for (const n of nodes) out[classifyTier(n, mode)].push(n);
  return out;
}

export function groupByPlatform(nodes: ApiNode[]): Map<string, ApiNode[]> {
  const out = new Map<string, ApiNode[]>();
  for (const n of nodes) {
    const existing = out.get(n.type);
    if (existing) existing.push(n);
    else out.set(n.type, [n]);
  }
  return out;
}

export const TIER_DESCRIPTOR: Record<Tier, string> = {
  S: "best match",
  A: "worth trying",
  B: "broader reach",
};
