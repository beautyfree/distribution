/**
 * Build-time embedding pipeline. Runs as `prebuild`.
 *
 *   loadRegistry → embedAll → data/embeddings.json
 *
 * On registry-fetch failure the reader already falls back to the previous
 * cached embeddings.json, so we keep this script best-effort: log and exit 0
 * when there are no nodes, so `next build` can still ship from cache.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { loadRegistry } from "../lib/registry/load";
import { embedAll } from "../lib/registry/embed";

async function main() {
  const outPath = path.join(process.cwd(), "data", "embeddings.json");
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  const nodes = await loadRegistry();
  if (nodes.length === 0) {
    console.warn(
      "[build-embeddings] no nodes loaded — leaving existing data/embeddings.json in place",
    );
    return;
  }

  const vectors = await embedAll(nodes);
  const payload = {
    built_at: new Date().toISOString(),
    model: "text-embedding-3-small",
    nodes: nodes.map((node, i) => ({
      node,
      embedding: Array.from(vectors[i] ?? []),
    })),
  };
  await fs.writeFile(outPath, JSON.stringify(payload));
  console.log(`[build-embeddings] wrote ${nodes.length} nodes → ${outPath}`);
}

main().catch((err) => {
  console.error("[build-embeddings] failed:", err);
  process.exit(0); // don't block the build — reader handles empty/stale cache
});
