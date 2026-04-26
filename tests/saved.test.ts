import { describe, it, expect } from "bun:test";
import { isSaved, savedCounts, type SavedEntry } from "../lib/saved";
import type { ApiNode } from "../lib/api-types";

function n(id: string, overrides: Partial<ApiNode> = {}): ApiNode {
  return {
    id,
    type: "subreddit",
    name: id,
    url: "https://example.com",
    audience_size: 100,
    topics: [],
    post_rules: "",
    post_format: "",
    language: "en",
    description: null,
    score: 0,
    ...overrides,
  };
}

function entry(id: string, posted = false): SavedEntry {
  return {
    node: n(id),
    savedAt: "2026-04-26T00:00:00.000Z",
    posted,
    postedAt: posted ? "2026-04-26T01:00:00.000Z" : undefined,
  };
}

describe("isSaved", () => {
  it("returns matching entry when present", () => {
    const list = [entry("a"), entry("b", true)];
    expect(isSaved("b", list)?.posted).toBe(true);
  });

  it("returns null when not present", () => {
    expect(isSaved("missing", [entry("a")])).toBeNull();
  });

  it("returns null for empty list", () => {
    expect(isSaved("a", [])).toBeNull();
  });
});

describe("savedCounts", () => {
  it("counts saved, posted, remaining", () => {
    const list = [entry("a"), entry("b", true), entry("c"), entry("d", true)];
    expect(savedCounts(list)).toEqual({ saved: 4, posted: 2, remaining: 2 });
  });

  it("zero on empty list", () => {
    expect(savedCounts([])).toEqual({ saved: 0, posted: 0, remaining: 0 });
  });

  it("all-remaining when nothing posted", () => {
    expect(savedCounts([entry("a"), entry("b")])).toEqual({
      saved: 2,
      posted: 0,
      remaining: 2,
    });
  });

  it("all-posted", () => {
    expect(savedCounts([entry("a", true), entry("b", true)])).toEqual({
      saved: 2,
      posted: 2,
      remaining: 0,
    });
  });
});
