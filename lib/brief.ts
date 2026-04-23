import { z } from "zod";

export const projectBriefSchema = z.object({
  schema_version: z.enum(["1.0"]).default("1.0"),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(8000),
  target_audience: z.string().max(2000).optional(),
  links: z.array(z.string().url()).max(20).default([]),
  tags: z.array(z.string().max(64)).max(40).default([]),
  language: z.string().max(16).default("en"),
  locale_hint: z.string().max(64).optional(),
});

export type ProjectBrief = z.infer<typeof projectBriefSchema>;

export function parseProjectBrief(body: unknown): ProjectBrief {
  return projectBriefSchema.parse(body);
}
