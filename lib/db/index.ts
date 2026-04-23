import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  pool?: pg.Pool;
  drizzle?: Database;
};

/** Lazy pool so `next build` can import route modules without DATABASE_URL. */
export function getDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForDb.pool) {
    globalForDb.pool = new pg.Pool({ connectionString: url, max: 10 });
    globalForDb.drizzle = drizzle(globalForDb.pool, { schema });
  }
  return globalForDb.drizzle as Database;
}
