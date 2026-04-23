import {
  boolean,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Venue row — mirrors docs/adapter-venue-spec.md §3 (subset used in v0.1). */
export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  source: text("source").notNull(),
  url: text("url"),
  description: text("description").notNull().default(""),
  language: text("language"),
  region: text("region"),
  rulesUrl: text("rules_url"),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  isNsfwOrRestricted: boolean("is_nsfw_or_restricted").notNull().default(false),
  scoringWeight: real("scoring_weight").notNull().default(1),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  tags: text("tags").array().notNull().$defaultFn(() => []),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .$defaultFn(() => ({})),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type VenueRow = typeof venues.$inferSelect;
export type VenueInsert = typeof venues.$inferInsert;
