import { describe, it, expect } from "bun:test";
import {
  cosine,
  topicalScore,
  applyFilters,
  sortResults,
  rank,
  type CachedPayload,
  type CachedEntry,
} from "../lib/registry/match";
import type { Node } from "../lib/registry/types";

function node(overrides: Partial<Node> = {}): Node {
  return {
    schema_version: 1,
    id: "test-id",
    type: "subreddit",
    name: "Test",
    url: "https://example.com",
    audience_size: 100,
    topics: [],
    post_rules: "rules",
    post_format: "formal",
    language: "en",
    last_verified_at: "2026-04-24",
    contributor: "devall",
    ...overrides,
  };
}

function entry(n: Partial<Node> = {}, embedding: number[] = []): CachedEntry {
  return { node: node(n), embedding };
}

describe("cosine", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosine([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5);
  });
  it("returns 0 for orthogonal vectors", () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });
  it("returns 0 for zero vectors (stub mode)", () => {
    expect(cosine([0, 0, 0], [1, 2, 3])).toBe(0);
    expect(cosine([0, 0], [0, 0])).toBe(0);
  });
});

describe("topicalScore", () => {
  it("ranks higher when more query tokens match", () => {
    const n = node({ name: "AI Builders Telegram", topics: ["ai", "llm"] });
    const high = topicalScore(n, "ai builders");
    const low = topicalScore(n, "knitting circle");
    expect(high).toBeGreaterThan(low);
    expect(low).toBe(0);
  });
  it("returns 0 for empty query", () => {
    expect(topicalScore(node(), "")).toBe(0);
  });
  it("ignores short tokens (<=2 chars)", () => {
    const n = node({ name: "AI" });
    expect(topicalScore(n, "ai")).toBe(0);
  });
});

describe("applyFilters", () => {
  it("filters by type", () => {
    expect(applyFilters(entry({ type: "subreddit" }), { types: ["subreddit"] })).toBe(true);
    expect(applyFilters(entry({ type: "subreddit" }), { types: ["telegram-chat"] })).toBe(false);
  });
  it("empty types array means no type filter", () => {
    expect(applyFilters(entry({ type: "subreddit" }), { types: [] })).toBe(true);
  });
  it("filters by language", () => {
    expect(applyFilters(entry({ language: "en" }), { language: "en" })).toBe(true);
    expect(applyFilters(entry({ language: "ru" }), { language: "en" })).toBe(false);
  });
  it("filters by minAudience", () => {
    expect(applyFilters(entry({ audience_size: 1500 }), { minAudience: 1000 })).toBe(true);
    expect(applyFilters(entry({ audience_size: 500 }), { minAudience: 1000 })).toBe(false);
  });
  it("combines filters with AND", () => {
    const e = entry({ type: "subreddit", language: "en", audience_size: 5000 });
    expect(
      applyFilters(e, { types: ["subreddit"], language: "en", minAudience: 1000 }),
    ).toBe(true);
    expect(applyFilters(e, { types: ["subreddit"], minAudience: 10000 })).toBe(false);
  });
});

describe("sortResults", () => {
  it("sorts by score desc when mode=best", () => {
    const r = sortResults(
      [
        { node: node({ id: "a" }), score: 0.3 },
        { node: node({ id: "b" }), score: 0.9 },
        { node: node({ id: "c" }), score: 0.5 },
      ],
      "best",
    );
    expect(r.map((x) => x.node.id)).toEqual(["b", "c", "a"]);
  });
  it("sorts by audience_size desc when mode=audience", () => {
    const r = sortResults(
      [
        { node: node({ id: "a", audience_size: 100 }), score: 0.9 },
        { node: node({ id: "b", audience_size: 9000 }), score: 0.1 },
        { node: node({ id: "c", audience_size: 500 }), score: 0.5 },
      ],
      "audience",
    );
    expect(r.map((x) => x.node.id)).toEqual(["b", "c", "a"]);
  });
  it("sorts by last_verified_at desc when mode=newest", () => {
    const r = sortResults(
      [
        { node: node({ id: "a", last_verified_at: "2026-01-01" }), score: 0 },
        { node: node({ id: "b", last_verified_at: "2026-04-01" }), score: 0 },
        { node: node({ id: "c", last_verified_at: "2025-12-01" }), score: 0 },
      ],
      "newest",
    );
    expect(r.map((x) => x.node.id)).toEqual(["b", "a", "c"]);
  });
});

describe("rank — integration", () => {
  const cache: CachedPayload = {
    nodes: [
      entry({ id: "ai-tg", type: "telegram-chat", name: "AI Builders", topics: ["ai", "llm"] }, [0]),
      entry({ id: "side-r", type: "subreddit", name: "r/SideProject", audience_size: 200000, topics: ["side-projects"] }, [0]),
      entry({ id: "ph", type: "directory", name: "Product Hunt", audience_size: 5_000_000, topics: ["launches"] }, [0]),
    ],
  };

  it("falls back to topical scoring when embedding is all-zeros", () => {
    const r = rank(cache, { text: "AI builders", embedding: [0] }, {}, "best");
    expect(r[0]?.node.id).toBe("ai-tg");
    expect(r[0]?.score).toBeGreaterThan(0);
  });

  it("filters apply before scoring", () => {
    const r = rank(cache, { text: "anything" }, { types: ["subreddit"] }, "best");
    expect(r).toHaveLength(1);
    expect(r[0]!.node.id).toBe("side-r");
  });

  it("returns all matches (no top-N cap)", () => {
    const r = rank(cache, { text: "build" }, {}, "best");
    expect(r).toHaveLength(3);
  });

  it("audience sort overrides relevance score", () => {
    const r = rank(cache, { text: "anything" }, {}, "audience");
    expect(r.map((x) => x.node.id)).toEqual(["ph", "side-r", "ai-tg"]);
  });
});
