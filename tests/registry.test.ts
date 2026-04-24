import { describe, it, expect } from "bun:test";
import { loadRegistry } from "../lib/registry/load";
import type { RegistrySource } from "../lib/registry/source";

function okSource(nodes: unknown[]): RegistrySource {
  return { async fetchNodes() { return nodes; } };
}
function throwingSource(): RegistrySource {
  return {
    async fetchNodes() {
      throw new Error("registry offline");
    },
  };
}

const goodNode = {
  schema_version: 1,
  id: "valid-one",
  type: "subreddit",
  name: "r/Valid",
  url: "https://reddit.com/r/valid",
  audience_size: 500,
  topics: ["test"],
  post_rules: "post nicely",
  post_format: "formal",
  language: "en",
  last_verified_at: "2026-04-24",
  contributor: "devall",
};

describe("loadRegistry", () => {
  it("accepts valid nodes", async () => {
    const nodes = await loadRegistry(okSource([goodNode]));
    expect(nodes).toHaveLength(1);
    expect(nodes[0]!.id).toBe("valid-one");
  });

  it("skips invalid nodes but keeps valid ones (never fails the whole batch)", async () => {
    const bad = { ...goodNode, id: "bad", audience_size: -1 };
    const nodes = await loadRegistry(okSource([goodNode, bad]));
    expect(nodes.map((n) => n.id)).toEqual(["valid-one"]);
  });

  it("rejects unknown type", async () => {
    const bad = { ...goodNode, id: "bad", type: "blog-post" };
    const nodes = await loadRegistry(okSource([bad]));
    expect(nodes).toHaveLength(0);
  });

  it("rejects wrong schema_version", async () => {
    const bad = { ...goodNode, id: "bad", schema_version: 2 };
    const nodes = await loadRegistry(okSource([bad]));
    expect(nodes).toHaveLength(0);
  });

  it("rejects invalid URL", async () => {
    const bad = { ...goodNode, id: "bad", url: "not a url" };
    const nodes = await loadRegistry(okSource([bad]));
    expect(nodes).toHaveLength(0);
  });

  it("falls back to cache when source throws (no crash)", async () => {
    // data/embeddings.json may or may not exist depending on prior builds.
    // Contract: must NOT throw, must return an array (possibly empty).
    const nodes = await loadRegistry(throwingSource());
    expect(Array.isArray(nodes)).toBe(true);
  });
});
