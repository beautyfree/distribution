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
    cached = { nodes: parsed.nodes ?? [], built_at: parsed.built_at, model: parsed.model };
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
