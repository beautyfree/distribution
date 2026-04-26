import { promises as fs } from "node:fs";
import path from "node:path";
import type { CachedPayload } from "./match";

const CACHE_PATH = path.join(process.cwd(), "data", "embeddings.json");

let cached: CachedPayload | null = null;

/**
 * Load embeddings.json from disk. Cached in module memory for the lifetime of
 * the server process (Vercel Function instance).
 */
export async function getCache(): Promise<CachedPayload> {
  if (cached) return cached;
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw) as CachedPayload;
    const nodes = parsed.nodes ?? [];
    const sample = nodes[0]?.embedding;
    const hasRealEmbeddings =
      !!sample && sample.length > 0 && sample.some((v) => v !== 0);
    if (nodes.length > 0 && !hasRealEmbeddings) {
      console.warn(
        "[cache] embeddings.json has zero-vector embeddings — rebuild via `bun run build` or `bunx tsx scripts/build-embeddings.ts`. Falling back to topical scoring.",
      );
    }
    cached = {
      nodes,
      built_at: parsed.built_at,
      model: parsed.model,
      hasRealEmbeddings,
    };
    return cached;
  } catch (err) {
    console.warn("[cache] failed to read embeddings.json:", err);
    cached = { nodes: [] };
    return cached;
  }
}

/** Test-only — reset module memo. */
export function _resetCacheForTests() {
  cached = null;
}
