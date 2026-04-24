import { z } from "zod";

/**
 * Shape of a single node in the open distribution registry.
 * Matches `distribution-registry/nodes/{type}/{slug}.json`.
 *
 * Schema is versioned; reader validates each node and skips invalid entries
 * with a console.warn instead of failing the whole build.
 */
export const NodeTypeSchema = z.enum([
  "telegram-channel",
  "telegram-chat",
  "discord-server",
  "subreddit",
  "slack-community",
  "directory",
  "x-person",
  "email-list",
]);

export const NodeSchema = z.object({
  schema_version: z.literal(1),
  id: z.string().min(1),
  type: NodeTypeSchema,
  name: z.string().min(1),
  url: z.string().url(),
  audience_size: z.number().int().nonnegative(),
  topics: z.array(z.string()).default([]),
  post_rules: z.string(),
  post_format: z.string(),
  language: z.string().min(2).max(8),
  last_verified_at: z.string(),
  contributor: z.string(),
  description: z.string().optional(),
  last_post_date: z.string().optional(),
  engagement_rate: z.number().optional(),
});

export type Node = z.infer<typeof NodeSchema>;
export type NodeType = z.infer<typeof NodeTypeSchema>;
