import { NextResponse } from "next/server";
import { db } from "@/db";
import { scenarios, checklistItems } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { isStockpileCategory } from "@/lib/constants";
import { requireUserId } from "@/lib/auth-utils";

async function computeReadiness(scenarioId: number): Promise<number> {
  const items = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.scenarioId, scenarioId));

  if (items.length === 0) return 100;

  const fulfilled = items.filter((item) => item.isCompleted).length;
  return Math.round((fulfilled / items.length) * 100);
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const allScenarios = await db
      .select()
      .from(scenarios)
      .where(eq(scenarios.userId, userId))
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
    const userId = await requireUserId();
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Scenario name is required" }, { status: 400 });
    }

    const newScenario = await db
      .insert(scenarios)
      .values({
        userId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        category: body.category || "general",
        isCustom: body.isCustom ?? false,
      })
      .returning();

    const scenarioId = newScenario[0].id;

    if (body.checklistItems && Array.isArray(body.checklistItems)) {
      // Filter out stockpile-category supply items (food, water, medicine, cash, etc.)
      // — those are tracked in the stockpile, not in scenarios
      const filtered = body.checklistItems.filter((item: Record<string, unknown>) => {
        if (item.itemType === "supply" && item.supplyCategory && isStockpileCategory(String(item.supplyCategory))) {
          return false;
        }
        return true;
      });

      const items = filtered.map((item: Record<string, unknown>, i: number) => ({
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
