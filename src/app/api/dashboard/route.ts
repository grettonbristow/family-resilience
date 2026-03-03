import { NextResponse } from "next/server";
import { db } from "@/db";
import { supplies, scenarios, checklistItems, settings } from "@/db/schema";
import { eq, sql, lte, gte } from "drizzle-orm";

export async function GET() {
  try {
    // Get settings for warning days
    const settingsRows = await db.select().from(settings).limit(1);
    const warningDays = settingsRows[0]?.expiryWarningDays ?? 30;

    // Total supplies count
    const supplyCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(supplies);
    const totalSupplies = Number(supplyCountResult[0]?.count ?? 0);

    // Expiring items
    const now = new Date();
    const warningDate = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);
    const warningDateStr = warningDate.toISOString().split("T")[0];

    const expiringItems = await db
      .select()
      .from(supplies)
      .where(lte(supplies.expiryDate, warningDateStr));

    // Low-stock items
    const allSupplies = await db.select().from(supplies);
    const lowStockItems = allSupplies.filter(
      (s) => s.minimumQuantity != null && s.quantity <= s.minimumQuantity && s.minimumQuantity > 0
    );

    // Scenario readiness
    const allScenarios = await db.select().from(scenarios);
    const scenarioSummaries = await Promise.all(
      allScenarios.map(async (s) => {
        const items = await db
          .select()
          .from(checklistItems)
          .where(eq(checklistItems.scenarioId, s.id));

        if (items.length === 0) return { id: s.id, name: s.name, category: s.category, readiness: 100 };

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
            if (Number(totals[0]?.total ?? 0) >= item.requiredQuantity) fulfilled++;
          } else if (item.isCompleted) {
            fulfilled++;
          }
        }

        return {
          id: s.id,
          name: s.name,
          category: s.category,
          readiness: Math.round((fulfilled / items.length) * 100),
        };
      })
    );

    const overallReadiness =
      scenarioSummaries.length > 0
        ? Math.round(scenarioSummaries.reduce((sum, s) => sum + s.readiness, 0) / scenarioSummaries.length)
        : 0;

    return NextResponse.json({
      overallReadiness,
      expiringItems,
      lowStockItems,
      scenarioSummaries,
      totalSupplies,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
