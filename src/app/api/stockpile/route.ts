import { NextResponse } from "next/server";
import { db } from "@/db";
import { stockpileItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let items;
    if (category) {
      items = await db.select().from(stockpileItems).where(and(eq(stockpileItems.userId, userId), eq(stockpileItems.category, category)));
    } else {
      items = await db.select().from(stockpileItems).where(eq(stockpileItems.userId, userId));
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch stockpile:", error);
    return NextResponse.json({ error: "Failed to fetch stockpile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { name, category, quantity, unit, caloriesTotal, valueAmount, daysSupply, expiryDate, location, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!["food", "water", "energy", "cash", "gold", "savings", "medicine"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const inserted = await db.insert(stockpileItems).values({
      userId,
      name: name.trim(),
      category,
      quantity: typeof quantity === "number" ? quantity : 0,
      unit: unit || "units",
      caloriesTotal: typeof caloriesTotal === "number" ? caloriesTotal : null,
      valueAmount: typeof valueAmount === "number" ? valueAmount : null,
      daysSupply: typeof daysSupply === "number" ? daysSupply : null,
      expiryDate: expiryDate || null,
      location: location?.trim() || null,
      notes: notes?.trim() || null,
    }).returning();

    return NextResponse.json(inserted[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create stockpile item:", error);
    return NextResponse.json({ error: "Failed to create stockpile item" }, { status: 500 });
  }
}
