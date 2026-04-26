import { describe, it, expect } from "bun:test";
import {
  decodeSearchState,
  encodeSearchState,
  DEFAULT_STATE,
  type SearchState,
} from "../lib/url-state";

function parse(qs: string) {
  return new URLSearchParams(qs);
}

describe("encodeSearchState", () => {
  it("omits all defaults", () => {
    expect(encodeSearchState(DEFAULT_STATE).toString()).toBe("");
  });

  it("includes only non-default fields", () => {
    const p = encodeSearchState({
      ...DEFAULT_STATE,
      description: "AI tool",
      types: ["subreddit", "telegram-chat"],
      language: "en",
      minAudience: 1000,
      sort: "newest",
      view: "platform",
    });
    expect(p.get("q")).toBe("AI tool");
    expect(p.get("types")).toBe("subreddit,telegram-chat");
    expect(p.get("lang")).toBe("en");
    expect(p.get("min")).toBe("1000");
    expect(p.get("sort")).toBe("newest");
    expect(p.get("view")).toBe("platform");
  });

  it("sorts types deterministically for stable URLs", () => {
    const a = encodeSearchState({
      ...DEFAULT_STATE,
      description: "x",
      types: ["subreddit", "discord-server"],
    }).toString();
    const b = encodeSearchState({
      ...DEFAULT_STATE,
      description: "x",
      types: ["discord-server", "subreddit"],
    }).toString();
    expect(a).toBe(b);
  });

  it("trims description", () => {
    const p = encodeSearchState({ ...DEFAULT_STATE, description: "  hi  " });
    expect(p.get("q")).toBe("hi");
  });

  it("omits view when tier (default)", () => {
    const p = encodeSearchState({ ...DEFAULT_STATE, description: "x" });
    expect(p.has("view")).toBe(false);
  });
});

describe("decodeSearchState", () => {
  it("empty params → defaults", () => {
    expect(decodeSearchState(parse(""))).toEqual(DEFAULT_STATE);
  });

  it("parses all known keys", () => {
    const s = decodeSearchState(
      parse("q=x&types=subreddit,telegram-chat&lang=en&min=1000&sort=audience&view=flat"),
    );
    expect(s).toEqual({
      description: "x",
      types: ["subreddit", "telegram-chat"],
      language: "en",
      minAudience: 1000,
      sort: "audience",
      view: "flat",
    });
  });

  it("ignores unknown sort/view values", () => {
    const s = decodeSearchState(parse("sort=bogus&view=hyper"));
    expect(s.sort).toBe("best");
    expect(s.view).toBe("tier");
  });

  it("ignores malformed min", () => {
    expect(decodeSearchState(parse("min=abc")).minAudience).toBeNull();
    expect(decodeSearchState(parse("min=-500")).minAudience).toBeNull();
  });

  it("ignores non-en language", () => {
    expect(decodeSearchState(parse("lang=fr")).language).toBeNull();
  });

  it("filters empty type tokens from trailing commas", () => {
    expect(decodeSearchState(parse("types=subreddit,,")).types).toEqual([
      "subreddit",
    ]);
  });

  it("clamps description at 2000 chars", () => {
    const long = "a".repeat(3000);
    expect(decodeSearchState(parse(`q=${long}`)).description.length).toBe(2000);
  });
});

describe("roundtrip", () => {
  it("encode→decode preserves non-default state", () => {
    const original: SearchState = {
      description: "indie writing app",
      types: ["discord-server", "subreddit"],
      language: "en",
      minAudience: 1000,
      sort: "newest",
      view: "platform",
    };
    const encoded = encodeSearchState(original).toString();
    const decoded = decodeSearchState(parse(encoded));
    expect(decoded).toEqual({ ...original, types: ["discord-server", "subreddit"].sort() });
  });

  it("encode→decode preserves defaults as defaults", () => {
    const encoded = encodeSearchState(DEFAULT_STATE).toString();
    expect(decodeSearchState(parse(encoded))).toEqual(DEFAULT_STATE);
  });
});
