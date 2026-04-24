import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * A RegistrySource produces raw (unvalidated) node JSON objects for the reader.
 * The reader validates every object via zod before use.
 */
export interface RegistrySource {
  fetchNodes(): Promise<unknown[]>;
}

const NODE_TYPES = [
  "telegram-channel",
  "telegram-chat",
  "discord-server",
  "subreddit",
  "slack-community",
  "directory",
  "x-person",
  "email-list",
] as const;

/**
 * Default MVP source: reads `nodes/{type}/*.json` from a GitHub repo via
 * raw.githubusercontent.com. Set `REGISTRY_LOCAL_PATH` to a local clone for
 * dev when the registry repo is offline or unpublished.
 */
export class StaticRegistrySource implements RegistrySource {
  constructor(
    private readonly repo = process.env.REGISTRY_REPO ??
      "devall/distribution-registry",
    private readonly branch = process.env.REGISTRY_BRANCH ?? "main",
    private readonly localPath = process.env.REGISTRY_LOCAL_PATH,
  ) {}

  async fetchNodes(): Promise<unknown[]> {
    if (this.localPath) {
      return this.fetchLocal(this.localPath);
    }
    return this.fetchRemote();
  }

  private async fetchLocal(root: string): Promise<unknown[]> {
    const nodesDir = path.join(root, "nodes");
    const out: unknown[] = [];
    for (const type of NODE_TYPES) {
      const typeDir = path.join(nodesDir, type);
      let entries: string[];
      try {
        entries = await fs.readdir(typeDir);
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (!entry.endsWith(".json")) continue;
        const raw = await fs.readFile(path.join(typeDir, entry), "utf8");
        try {
          out.push(JSON.parse(raw));
        } catch (err) {
          console.warn(`[registry] invalid JSON: ${entry}`, err);
        }
      }
    }
    return out;
  }

  private async fetchRemote(): Promise<unknown[]> {
    // Registry repo publishes an `index.json` at root listing every node path.
    // Until that exists, we try the index and fall through to an empty list.
    const base = `https://raw.githubusercontent.com/${this.repo}/${this.branch}`;
    const indexUrl = `${base}/index.json`;
    const res = await fetch(indexUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(
        `[registry] index.json fetch failed: ${res.status} ${res.statusText} (${indexUrl})`,
      );
    }
    const index = (await res.json()) as { nodes?: string[] };
    const paths = index.nodes ?? [];
    const results = await Promise.all(
      paths.map(async (p) => {
        const url = `${base}/${p}`;
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) {
          console.warn(`[registry] skip ${p}: ${r.status}`);
          return null;
        }
        return r.json();
      }),
    );
    return results.filter((x): x is unknown => x !== null);
  }
}
