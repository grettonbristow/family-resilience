import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-utils";

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);

    if (rows.length === 0) {
      return NextResponse.json({
        householdSize: 2,
        children: [],
        pets: [],
        expiryWarningDays: 30,
        lowStockAlertEnabled: true,
      });
    }

    return NextResponse.json({
      householdSize: rows[0].householdSize,
      children: rows[0].children ?? [],
      pets: rows[0].pets ?? [],
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
    const userId = await requireUserId();
    const body = await request.json();
    const householdSize = typeof body.householdSize === "number" ? body.householdSize : 2;
    const children = Array.isArray(body.children) ? body.children : [];
    const pets = Array.isArray(body.pets) ? body.pets : [];
    const expiryWarningDays = typeof body.expiryWarningDays === "number" ? body.expiryWarningDays : 30;
    const lowStockAlertEnabled = body.lowStockAlertEnabled !== false;

    const rows = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);

    if (rows.length === 0) {
      await db.insert(settings).values({ userId, householdSize, children, pets, expiryWarningDays, lowStockAlertEnabled });
    } else {
      await db
        .update(settings)
        .set({ householdSize, children, pets, expiryWarningDays, lowStockAlertEnabled, updatedAt: new Date() })
        .where(eq(settings.id, rows[0].id));
    }

    return NextResponse.json({ householdSize, children, pets, expiryWarningDays, lowStockAlertEnabled });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
