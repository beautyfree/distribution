import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { telegramCapabilities, telegramHealth } from "@/lib/adapters/telegram";
import { getDb } from "@/lib/db";

export async function GET() {
  let databaseOk = false;
  try {
    await getDb().execute(sql`select 1`);
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  const health = telegramHealth();
  return NextResponse.json({
    ok: databaseOk && health.ok,
    database: databaseOk,
    adapter_capabilities: telegramCapabilities(),
    adapter_health: health,
  });
}
