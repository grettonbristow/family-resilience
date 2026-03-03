import { NextResponse } from "next/server";
import { db } from "@/db";
import { supplies } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const checks: Record<string, string> = {
    status: "ok",
    database_url: process.env.DATABASE_URL ? "set" : "NOT SET",
    anthropic_api_key: process.env.ANTHROPIC_API_KEY ? "set" : "NOT SET",
  };

  try {
    const result = await db.execute(sql`SELECT 1 as ping`);
    checks.db_connection = "connected";
  } catch (error) {
    checks.db_connection = `failed: ${error instanceof Error ? error.message : String(error)}`;
    checks.status = "error";
  }

  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(supplies);
    checks.supply_count = String(result[0]?.count ?? 0);
  } catch (error) {
    checks.supply_count = `query failed: ${error instanceof Error ? error.message : String(error)}`;
  }

  const status = checks.status === "ok" ? 200 : 500;
  return NextResponse.json(checks, { status });
}
