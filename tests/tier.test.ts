import { describe, it, expect } from "bun:test";
import { classifyTier, groupByTier, groupByPlatform } from "../lib/tier";
import type { ApiNode } from "../lib/api-types";

function n(overrides: Partial<ApiNode> = {}): ApiNode {
  return {
    id: "x",
    type: "subreddit",
    name: "n",
    url: "https://example.com",
    audience_size: 100,
    topics: [],
    post_rules: "",
    post_format: "",
    language: "en",
    description: null,
    score: 0.1,
    ...overrides,
  };
}

describe("classifyTier — semantic", () => {
  it("S: score >= 0.40 regardless of type or audience", () => {
    expect(classifyTier(n({ score: 0.5, type: "telegram-channel" }))).toBe("S");
    expect(classifyTier(n({ score: 0.4, type: "directory" }))).toBe("S");
    expect(classifyTier(n({ score: 0.45, type: "discord-server" }))).toBe("S");
  });

  it("A: 0.25 <= score < 0.40", () => {
    expect(classifyTier(n({ score: 0.39 }))).toBe("A");
    expect(classifyTier(n({ score: 0.25 }))).toBe("A");
  });

  it("B: score < 0.25", () => {
    expect(classifyTier(n({ score: 0.24 }))).toBe("B");
    expect(classifyTier(n({ score: 0 }))).toBe("B");
  });
});

describe("classifyTier — topical", () => {
  it("uses lower thresholds (0.30 / 0.15)", () => {
    expect(classifyTier(n({ score: 0.3 }), "topical")).toBe("S");
    expect(classifyTier(n({ score: 0.15 }), "topical")).toBe("A");
    expect(classifyTier(n({ score: 0.14 }), "topical")).toBe("B");
  });
});

describe("groupByTier", () => {
  it("empty input → all buckets empty", () => {
    expect(groupByTier([])).toEqual({ S: [], A: [], B: [] });
  });

  it("preserves order within a tier", () => {
    const nodes = [
      n({ id: "a", score: 0.6, audience_size: 2000, type: "subreddit" }),
      n({ id: "b", score: 0.55, audience_size: 5000, type: "telegram-chat" }),
      n({ id: "c", score: 0.05, audience_size: 10 }),
    ];
    const g = groupByTier(nodes);
    expect(g.S.map((x) => x.id)).toEqual(["a", "b"]);
    expect(g.B.map((x) => x.id)).toEqual(["c"]);
  });
});

describe("groupByPlatform", () => {
  it("groups by type preserving first-seen order", () => {
    const nodes = [
      n({ id: "a", type: "subreddit" }),
      n({ id: "b", type: "telegram-chat" }),
      n({ id: "c", type: "subreddit" }),
    ];
    const g = groupByPlatform(nodes);
    expect(Array.from(g.keys())).toEqual(["subreddit", "telegram-chat"]);
    expect(g.get("subreddit")!.map((x) => x.id)).toEqual(["a", "c"]);
  });

  it("empty → empty map", () => {
    expect(groupByPlatform([]).size).toBe(0);
  });
});
