import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.select().from(settings).limit(1);

    if (rows.length === 0) {
      return NextResponse.json({
        householdSize: 2,
        expiryWarningDays: 30,
        lowStockAlertEnabled: true,
      });
    }

    return NextResponse.json({
      householdSize: rows[0].householdSize,
      expiryWarningDays: rows[0].expiryWarningDays,
      lowStockAlertEnabled: rows[0].lowStockAlertEnabled,
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const householdSize = typeof body.householdSize === "number" ? body.householdSize : 2;
    const expiryWarningDays = typeof body.expiryWarningDays === "number" ? body.expiryWarningDays : 30;
    const lowStockAlertEnabled = body.lowStockAlertEnabled !== false;

    const rows = await db.select().from(settings).limit(1);

    if (rows.length === 0) {
      await db.insert(settings).values({ householdSize, expiryWarningDays, lowStockAlertEnabled });
    } else {
      await db
        .update(settings)
        .set({ householdSize, expiryWarningDays, lowStockAlertEnabled, updatedAt: new Date() })
        .where(eq(settings.id, rows[0].id));
    }

    return NextResponse.json({ householdSize, expiryWarningDays, lowStockAlertEnabled });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
