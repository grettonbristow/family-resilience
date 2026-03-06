import { NextResponse } from "next/server";
import { db } from "@/db";
import { scenarios, checklistItems, supplies } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
// supplies + sql kept for quantity annotation on legacy items

function parseId(id: string): number | null {
  const num = parseInt(id, 10);
  return Number.isNaN(num) ? null : num;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scenarioId = parseId(id);
    if (scenarioId === null) {
      return NextResponse.json({ error: "Invalid scenario ID" }, { status: 400 });
    }

    const scenario = await db
      .select()
      .from(scenarios)
      .where(eq(scenarios.id, scenarioId))
      .limit(1);

    if (scenario.length === 0) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.scenarioId, scenarioId))
      .orderBy(checklistItems.sortOrder);

    // Annotate supply items with current quantities
    const annotatedItems = await Promise.all(
      items.map(async (item) => {
        if (item.itemType === "supply" && item.supplyCategory) {
          const totals = await db
            .select({ total: sql<number>`COALESCE(SUM(quantity), 0)` })
            .from(supplies)
            .where(eq(supplies.category, item.supplyCategory));

          return { ...item, currentQuantity: Number(totals[0]?.total ?? 0) };
        }
        return { ...item, currentQuantity: undefined };
      })
    );

    // Compute readiness
    const fulfilled = annotatedItems.filter((item) => item.isCompleted).length;
    const readiness = items.length > 0 ? Math.round((fulfilled / items.length) * 100) : 100;

    return NextResponse.json({
      ...scenario[0],
      readiness,
      checklistItems: annotatedItems,
    });
  } catch (error) {
    console.error("Failed to fetch scenario:", error);
    return NextResponse.json({ error: "Failed to fetch scenario" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scenarioId = parseId(id);
    if (scenarioId === null) {
      return NextResponse.json({ error: "Invalid scenario ID" }, { status: 400 });
    }

    await db.delete(scenarios).where(eq(scenarios.id, scenarioId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete scenario:", error);
    return NextResponse.json({ error: "Failed to delete scenario" }, { status: 500 });
  }
}
