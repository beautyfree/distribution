import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { telegramSearch } from "@/lib/adapters/telegram";
import { parseProjectBrief } from "@/lib/brief";
import { getDb } from "@/lib/db";
import { candidateToRecommendation } from "@/lib/recommendations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";
  if (!rateLimit(`rec:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  let brief;
  try {
    brief = parseProjectBrief(body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "validation_failed", details: msg },
      { status: 400 },
    );
  }

  const adapterReq = {
    request_id: uuidv4(),
    project_brief: brief,
    max_results: 15,
    context: { locale: brief.language, include_global: true },
  };

  try {
    const result = await telegramSearch(getDb(), adapterReq);
    const recommendations = result.items.map((c) =>
      candidateToRecommendation(c, brief),
    );
    return NextResponse.json({
      recommendations,
      adapter_status: result.status,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("DATABASE_URL")) {
      return NextResponse.json(
        { error: "server_misconfigured", details: "DATABASE_URL missing" },
        { status: 503 },
      );
    }
    console.error("recommendations_error", message);
    return NextResponse.json(
      { error: "server_error", details: message },
      { status: 500 },
    );
  }
}
