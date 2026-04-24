import { NextResponse } from "next/server";
import { z } from "zod";
import { getCache } from "@/lib/registry/cache";
import type { Node } from "@/lib/registry/types";

const BodySchema = z.object({
  nodeId: z.string().min(1),
  description: z.string().min(1).max(2000),
});

export const runtime = "nodejs";

const TONE_BY_FORMAT: Record<string, string> = {
  "short-link": "One sentence + the link. No preamble. No marketing fluff. Builders skim — earn the click.",
  manifest: "2-3 short paragraphs. Lead with the problem you faced. Show the build. End with the link. First-person voice.",
  casual: "Casual, conversational, 2-4 sentences. Like you're texting a friend who'd care. Lowercase OK.",
  formal: "Concise, professional, 2-3 sentences. Lead with what it does, then who it's for. Link at end.",
  "no-link": "Conversation only — describe what you built, what you learned, what you're trying next. No URL. Invite reply.",
  "ama-only": "Frame as 'I built X — happy to answer questions about Y, Z'. 2-3 sentences. No link unless asked.",
};

function buildPrompt(node: Node, description: string): { system: string; user: string } {
  const tone =
    TONE_BY_FORMAT[node.post_format] ??
    "Concise, builder-to-builder. 2-3 sentences. Link at end.";
  const system = [
    "You are an indie builder writing a single post about your side-project to share in a specific online community.",
    "Match the community's voice and rules exactly. Never mention the AI that wrote this.",
    "Output ONLY the post text. No quotes, no preamble, no explanation, no markdown headings.",
    "Avoid: emojis (unless the channel format calls for them), hashtags, exclamation marks, AI-vocabulary like 'crucial', 'leverage', 'powerful', 'comprehensive'.",
  ].join(" ");
  const user = [
    `COMMUNITY: ${node.name} (${node.type})`,
    `RULES: ${node.post_rules}`,
    `FORMAT: ${node.post_format}`,
    `TONE: ${tone}`,
    `LANGUAGE: ${node.language}`,
    "",
    "MY PROJECT:",
    description.trim(),
    "",
    "Write the post.",
  ].join("\n");
  return { system, user };
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { nodeId, description } = parsed.data;

  const cache = await getCache();
  const entry = cache.nodes.find((n) => n.node.id === nodeId);
  if (!entry) {
    return NextResponse.json({ error: "unknown nodeId" }, { status: 404 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      draft: `[stub draft — set OPENAI_API_KEY to enable real generation]\n\nFor ${entry.node.name}:\n${description.trim()}`,
      mode: "stub",
    });
  }

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { system, user } = buildPrompt(entry.node, description);
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 400,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const draft = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!draft) {
      return NextResponse.json({ error: "empty draft" }, { status: 502 });
    }
    return NextResponse.json({ draft, mode: "openai" });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return NextResponse.json(
        { error: "rate limited — try again in a few seconds" },
        { status: 503, headers: { "Retry-After": "10" } },
      );
    }
    console.error("[draft] OpenAI error:", err);
    return NextResponse.json({ error: "draft generation failed" }, { status: 502 });
  }
}
