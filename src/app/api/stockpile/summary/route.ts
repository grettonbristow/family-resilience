import { NextResponse } from "next/server";
import { db } from "@/db";
import { stockpileItems, settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const settingsRows = await db.select().from(settings).limit(1);
    const householdSize = settingsRows[0]?.householdSize ?? 2;

    const items = await db.select().from(stockpileItems);

    // Food: sum calories / (household × 2000 cal/day)
    const totalCalories = items
      .filter((i) => i.category === "food" && i.caloriesTotal)
      .reduce((sum, i) => sum + (i.caloriesTotal ?? 0), 0);
    const foodDays = householdSize > 0 ? Math.round((totalCalories / (householdSize * 2000)) * 10) / 10 : 0;

    // Water: sum liters / (household × 3 liters/day)
    const waterLiters = items
      .filter((i) => i.category === "water")
      .reduce((sum, i) => {
        if (i.unit === "liters") return sum + i.quantity;
        if (i.unit === "gallons") return sum + i.quantity * 3.785;
        if (i.unit === "bottles") return sum + i.quantity * 0.5; // assume 500ml bottles
        return sum + i.quantity;
      }, 0);
    const waterDays = householdSize > 0 ? Math.round((waterLiters / (householdSize * 3)) * 10) / 10 : 0;

    // Cash: sum value_amount
    const cashTotal = items
      .filter((i) => i.category === "cash")
      .reduce((sum, i) => sum + (i.valueAmount ?? 0), 0);

    // Gold: sum quantity (in 1/4 oz coins)
    const goldOz = items
      .filter((i) => i.category === "gold")
      .reduce((sum, i) => sum + i.quantity * 0.25, 0);

    // Savings: sum value_amount
    const savingsTotal = items
      .filter((i) => i.category === "savings")
      .reduce((sum, i) => sum + (i.valueAmount ?? 0), 0);

    // Energy: count items
    const energyItems = items.filter((i) => i.category === "energy").length;

    // Medicine: count items
    const medicineItems = items.filter((i) => i.category === "medicine").length;

    return NextResponse.json({
      foodDays,
      waterDays,
      cashTotal,
      goldOz,
      savingsTotal,
      energyItems,
      medicineItems,
      totalItems: items.length,
      householdSize,
    });
  } catch (error) {
    console.error("Failed to fetch stockpile summary:", error);
    return NextResponse.json({ error: "Failed to fetch stockpile summary" }, { status: 500 });
  }
}
