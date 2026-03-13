import { NextResponse } from "next/server";
import { db } from "@/db";
import { supplies, scenarios, checklistItems, settings, stockpileItems } from "@/db/schema";
import { eq, sql, lte, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-utils";

export async function GET() {
  try {
    const userId = await requireUserId();

    // Get settings for warning days
    const settingsRows = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
    const warningDays = settingsRows[0]?.expiryWarningDays ?? 30;

    // Total supplies count
    const supplyCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(supplies)
      .where(eq(supplies.userId, userId));
    const totalSupplies = Number(supplyCountResult[0]?.count ?? 0);

    // Expiring items
    const now = new Date();
    const warningDate = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);
    const warningDateStr = warningDate.toISOString().split("T")[0];

    const expiringItems = await db
      .select()
      .from(supplies)
      .where(and(eq(supplies.userId, userId), lte(supplies.expiryDate, warningDateStr)));

    // Low-stock items
    const allSupplies = await db.select().from(supplies).where(eq(supplies.userId, userId));
    const lowStockItems = allSupplies.filter(
      (s) => s.minimumQuantity != null && s.quantity <= s.minimumQuantity && s.minimumQuantity > 0
    );

    // Scenario readiness
    const allScenarios = await db.select().from(scenarios).where(eq(scenarios.userId, userId));
    const scenarioSummaries = await Promise.all(
      allScenarios.map(async (s) => {
        const items = await db
          .select()
          .from(checklistItems)
          .where(eq(checklistItems.scenarioId, s.id));

        if (items.length === 0) return { id: s.id, name: s.name, category: s.category, readiness: 100 };

        const fulfilled = items.filter((item) => item.isCompleted).length;

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

    // Stockpile summary
    const householdSize = settingsRows[0]?.householdSize ?? 2;
    const stockpile = await db.select().from(stockpileItems).where(eq(stockpileItems.userId, userId));

    const totalCalories = stockpile
      .filter((i) => i.category === "food" && i.caloriesTotal)
      .reduce((sum, i) => sum + (i.caloriesTotal ?? 0), 0);
    const foodDays = householdSize > 0 ? Math.round((totalCalories / (householdSize * 2000)) * 10) / 10 : 0;

    const waterLiters = stockpile
      .filter((i) => i.category === "water")
      .reduce((sum, i) => {
        if (i.unit === "liters") return sum + i.quantity;
        if (i.unit === "gallons") return sum + i.quantity * 3.785;
        if (i.unit === "bottles") return sum + i.quantity * 0.5;
        return sum + i.quantity;
      }, 0);
    const waterDays = householdSize > 0 ? Math.round((waterLiters / (householdSize * 3)) * 10) / 10 : 0;

    const cashTotal = stockpile
      .filter((i) => i.category === "cash")
      .reduce((sum, i) => sum + (i.valueAmount ?? 0), 0);

    const goldOz = stockpile
      .filter((i) => i.category === "gold")
      .reduce((sum, i) => sum + i.quantity * 0.25, 0);

    const savingsTotal = stockpile
      .filter((i) => i.category === "savings")
      .reduce((sum, i) => sum + (i.valueAmount ?? 0), 0);

    const energyItems = stockpile.filter((i) => i.category === "energy").length;
    const medicineItems = stockpile.filter((i) => i.category === "medicine").length;

    return NextResponse.json({
      overallReadiness,
      expiringItems,
      lowStockItems,
      scenarioSummaries,
      totalSupplies,
      stockpileSummary: {
        foodDays,
        waterDays,
        cashTotal,
        goldOz,
        savingsTotal,
        energyItems,
        medicineItems,
        totalItems: stockpile.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
