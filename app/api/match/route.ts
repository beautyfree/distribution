import { NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  description: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  // TODO: cosine search against data/embeddings.json
  return NextResponse.json({ nodes: [] });
}
