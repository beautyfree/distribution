import type { Node } from "./types";

export type CachedEntry = { node: Node; embedding: number[] };
export type CachedPayload = {
  built_at?: string;
  model?: string;
  nodes: CachedEntry[];
};

export type SortMode = "best" | "newest" | "audience";

export type MatchFilters = {
  types?: string[];
  language?: string;
  minAudience?: number;
};

export type MatchResult = {
  node: Node;
  score: number;
};

/**
 * Cosine similarity. Returns 0 for zero vectors (stub mode in dev).
 */
export function cosine(a: number[] | Float32Array, b: number[] | Float32Array): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Topical fallback when embeddings are stub vectors (all-zero) — substring
 * match against node name + topics + description, normalized 0..1. Lets dev
 * mode without an OpenAI key still rank meaningfully.
 */
export function topicalScore(node: Node, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  if (tokens.length === 0) return 0;
  const haystack = [
    node.name,
    node.description ?? "",
    node.topics.join(" "),
    node.type,
  ]
    .join(" ")
    .toLowerCase();
  let hits = 0;
  for (const t of tokens) {
    if (haystack.includes(t)) hits += 1;
  }
  return hits / tokens.length;
}

export function applyFilters(entry: CachedEntry, filters: MatchFilters): boolean {
  const { node } = entry;
  if (filters.types && filters.types.length > 0 && !filters.types.includes(node.type)) {
    return false;
  }
  if (filters.language && node.language !== filters.language) {
    return false;
  }
  if (typeof filters.minAudience === "number" && node.audience_size < filters.minAudience) {
    return false;
  }
  return true;
}

export function sortResults(results: MatchResult[], mode: SortMode): MatchResult[] {
  const sorted = [...results];
  if (mode === "audience") {
    sorted.sort((a, b) => b.node.audience_size - a.node.audience_size);
  } else if (mode === "newest") {
    sorted.sort((a, b) =>
      (b.node.last_verified_at ?? "").localeCompare(a.node.last_verified_at ?? ""),
    );
  } else {
    sorted.sort((a, b) => b.score - a.score);
  }
  return sorted;
}

/**
 * Score every node against the query embedding (or query string for topical
 * fallback), apply filters, sort, return all matches. No top-N cap — UI
 * paginates if needed, but per design doc the user wants completeness.
 */
export function rank(
  cache: CachedPayload,
  query: { text: string; embedding?: number[] | Float32Array },
  filters: MatchFilters,
  sort: SortMode,
): MatchResult[] {
  const useCosine =
    query.embedding && query.embedding.length > 0 && hasNonZero(query.embedding);
  const filtered = cache.nodes.filter((entry) => applyFilters(entry, filters));
  const scored: MatchResult[] = filtered.map((entry) => {
    const score = useCosine
      ? cosine(query.embedding!, entry.embedding)
      : topicalScore(entry.node, query.text);
    return { node: entry.node, score };
  });
  return sortResults(scored, sort);
}

function hasNonZero(v: number[] | Float32Array): boolean {
  for (let i = 0; i < v.length; i++) {
    if (v[i] !== 0) return true;
  }
  return false;
}
