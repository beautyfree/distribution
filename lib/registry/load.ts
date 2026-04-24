import { promises as fs } from "node:fs";
import path from "node:path";
import { NodeSchema, type Node } from "./types";
import { StaticRegistrySource, type RegistrySource } from "./source";

const CACHE_PATH = path.join(process.cwd(), "data", "embeddings.json");

type CachedNode = { node: Node };

/**
 * Load + validate every node. On fetch failure, falls back to the last
 * successful build's cached embeddings.json so broken registry fetches
 * don't deploy a broken prod.
 */
export async function loadRegistry(
  source: RegistrySource = new StaticRegistrySource(),
): Promise<Node[]> {
  try {
    const raw = await source.fetchNodes();
    const nodes: Node[] = [];
    for (const entry of raw) {
      const parsed = NodeSchema.safeParse(entry);
      if (!parsed.success) {
        console.warn(
          "[registry] skipping invalid node:",
          parsed.error.issues.map((i) => i.message).join("; "),
        );
        continue;
      }
      nodes.push(parsed.data);
    }
    return nodes;
  } catch (err) {
    console.warn("[registry] fetch failed, falling back to cache:", err);
    return loadFromCache();
  }
}

async function loadFromCache(): Promise<Node[]> {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw) as { nodes?: CachedNode[] };
    return (parsed.nodes ?? []).map((n) => n.node);
  } catch {
    return [];
  }
}
