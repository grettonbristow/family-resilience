import { NextResponse } from "next/server";
import { db } from "@/db";
import { scenarios, checklistItems, supplies } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

async function computeReadiness(scenarioId: number): Promise<number> {
  const items = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.scenarioId, scenarioId));

  if (items.length === 0) return 100;

  let fulfilled = 0;

  for (const item of items) {
    if (item.itemType !== "supply") {
      if (item.isCompleted) fulfilled++;
      continue;
    }

    if (item.supplyCategory && item.requiredQuantity) {
      const totals = await db
        .select({ total: sql<number>`COALESCE(SUM(quantity), 0)` })
        .from(supplies)
        .where(eq(supplies.category, item.supplyCategory));

      const current = Number(totals[0]?.total ?? 0);
      if (current >= item.requiredQuantity) {
        fulfilled++;
      }
    } else if (item.isCompleted) {
      fulfilled++;
    }
  }

  return Math.round((fulfilled / items.length) * 100);
}

export async function GET() {
  try {
    const allScenarios = await db
      .select()
      .from(scenarios)
      .orderBy(desc(scenarios.createdAt));

    const result = await Promise.all(
      allScenarios.map(async (s) => ({
        ...s,
        readiness: await computeReadiness(s.id),
      }))
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch scenarios:", message);
    return NextResponse.json({ error: `Failed to fetch scenarios: ${message}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Scenario name is required" }, { status: 400 });
    }

    const newScenario = await db
      .insert(scenarios)
      .values({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        category: body.category || "general",
        isCustom: body.isCustom ?? false,
      })
      .returning();

    const scenarioId = newScenario[0].id;

    if (body.checklistItems && Array.isArray(body.checklistItems)) {
      const items = body.checklistItems.map((item: Record<string, unknown>, i: number) => ({
        scenarioId,
        description: String(item.description || ""),
        itemType: String(item.itemType || "supply"),
        supplyCategory: item.supplyCategory ? String(item.supplyCategory) : null,
        requiredQuantity: typeof item.requiredQuantity === "number" ? item.requiredQuantity : null,
        requiredUnit: item.requiredUnit ? String(item.requiredUnit) : null,
        isCompleted: false,
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : i,
      }));

      if (items.length > 0) {
        await db.insert(checklistItems).values(items);
      }
    }

    return NextResponse.json(newScenario[0], { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to create scenario:", message);
    return NextResponse.json({ error: `Failed to create scenario: ${message}` }, { status: 500 });
  }
}
