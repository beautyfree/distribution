import { NextResponse } from "next/server";
import { z } from "zod";
import { getCache } from "@/lib/registry/cache";
import { embedQuery } from "@/lib/registry/embed-query";
import { rank, type SortMode } from "@/lib/registry/match";

const SortSchema = z.enum(["best", "newest", "audience"]);

const BodySchema = z.object({
  description: z.string().min(1).max(2000),
  filters: z
    .object({
      types: z.array(z.string()).optional(),
      language: z.string().optional(),
      minAudience: z.number().int().nonnegative().optional(),
    })
    .optional(),
  sort: SortSchema.optional(),
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { description, filters = {}, sort = "best" } = parsed.data;

  const cache = await getCache();
  if (cache.nodes.length === 0) {
    return NextResponse.json({ nodes: [], count: 0, mode: "empty" });
  }

  const embedding = await embedQuery(description);
  const results = rank(
    cache,
    { text: description, embedding },
    filters,
    sort as SortMode,
  );

  return NextResponse.json({
    count: results.length,
    mode: embedding.length > 0 ? "semantic" : "topical",
    nodes: results.map((r) => ({
      id: r.node.id,
      type: r.node.type,
      name: r.node.name,
      url: r.node.url,
      audience_size: r.node.audience_size,
      topics: r.node.topics,
      post_rules: r.node.post_rules,
      post_format: r.node.post_format,
      language: r.node.language,
      description: r.node.description ?? null,
      score: r.score,
    })),
  });
}
