import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import { venues, type VenueInsert } from "../lib/db/schema";

const __dirname = dirname(fileURLToPath(import.meta.url));

type SeedRow = Omit<
  VenueInsert,
  "id" | "createdAt" | "updatedAt" | "lastVerifiedAt"
> & { lastVerifiedAt?: string | null };

function loadSeed(): SeedRow[] {
  const path = join(__dirname, "..", "data", "venues.seed.json");
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as SeedRow[];
}

async function main() {
  const db = getDb();
  const rows = loadSeed();
  for (const row of rows) {
    const insert: VenueInsert = {
      slug: row.slug,
      name: row.name,
      type: row.type,
      source: row.source,
      url: row.url ?? null,
      description: row.description ?? "",
      language: row.language ?? null,
      region: row.region ?? null,
      rulesUrl: row.rulesUrl ?? null,
      requiresApproval: row.requiresApproval ?? false,
      isNsfwOrRestricted: row.isNsfwOrRestricted ?? false,
      scoringWeight: row.scoringWeight ?? 1,
      lastVerifiedAt: row.lastVerifiedAt
        ? new Date(row.lastVerifiedAt)
        : null,
      tags: row.tags ?? [],
      metadata: row.metadata ?? {},
    };
    const existing = await db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.slug, insert.slug!))
      .limit(1)
      .then((r) => r[0]);
    if (existing) {
      await db
        .update(venues)
        .set({
          ...insert,
          updatedAt: new Date(),
        })
        .where(eq(venues.slug, insert.slug!));
      console.log("updated", insert.slug);
    } else {
      await db.insert(venues).values(insert);
      console.log("inserted", insert.slug);
    }
  }
  console.log("seed done");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
