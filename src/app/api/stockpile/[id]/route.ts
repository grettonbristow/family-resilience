import { NextResponse } from "next/server";
import { db } from "@/db";
import { stockpileItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-utils";

function parseId(id: string): number | null {
  const num = parseInt(id, 10);
  return Number.isNaN(num) ? null : num;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const itemId = parseId(id);
    if (itemId === null) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const rows = await db.select().from(stockpileItems).where(and(eq(stockpileItems.id, itemId), eq(stockpileItems.userId, userId))).limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to fetch stockpile item:", error);
    return NextResponse.json({ error: "Failed to fetch stockpile item" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const itemId = parseId(id);
    if (itemId === null) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const updated = await db
      .update(stockpileItems)
      .set({
        name: body.name?.trim(),
        category: body.category,
        quantity: typeof body.quantity === "number" ? body.quantity : undefined,
        unit: body.unit,
        caloriesTotal: body.caloriesTotal !== undefined ? (typeof body.caloriesTotal === "number" ? body.caloriesTotal : null) : undefined,
        valueAmount: body.valueAmount !== undefined ? (typeof body.valueAmount === "number" ? body.valueAmount : null) : undefined,
        daysSupply: body.daysSupply !== undefined ? (typeof body.daysSupply === "number" ? body.daysSupply : null) : undefined,
        expiryDate: body.expiryDate !== undefined ? (body.expiryDate || null) : undefined,
        location: body.location !== undefined ? (body.location?.trim() || null) : undefined,
        notes: body.notes !== undefined ? (body.notes?.trim() || null) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(stockpileItems.id, itemId), eq(stockpileItems.userId, userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to update stockpile item:", error);
    return NextResponse.json({ error: "Failed to update stockpile item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const itemId = parseId(id);
    if (itemId === null) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await db.delete(stockpileItems).where(and(eq(stockpileItems.id, itemId), eq(stockpileItems.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete stockpile item:", error);
    return NextResponse.json({ error: "Failed to delete stockpile item" }, { status: 500 });
  }
}
