import { NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  nodeId: z.string().min(1),
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
  // TODO: LLM call — generate a draft post formatted for this node's post_format.
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
