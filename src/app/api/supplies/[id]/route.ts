import { NextResponse } from "next/server";
import { db } from "@/db";
import { supplies, supplyLog } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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
    const supplyId = parseId(id);
    if (supplyId === null) {
      return NextResponse.json({ error: "Invalid supply ID" }, { status: 400 });
    }

    const supply = await db
      .select()
      .from(supplies)
      .where(eq(supplies.id, supplyId))
      .limit(1);

    if (supply.length === 0) {
      return NextResponse.json({ error: "Supply not found" }, { status: 404 });
    }

    const log = await db
      .select()
      .from(supplyLog)
      .where(eq(supplyLog.supplyId, supplyId))
      .orderBy(desc(supplyLog.createdAt))
      .limit(20);

    return NextResponse.json({ ...supply[0], log });
  } catch (error) {
    console.error("Failed to fetch supply:", error);
    return NextResponse.json({ error: "Failed to fetch supply" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplyId = parseId(id);
    if (supplyId === null) {
      return NextResponse.json({ error: "Invalid supply ID" }, { status: 400 });
    }

    const body = await request.json();

    const updated = await db
      .update(supplies)
      .set({
        name: body.name,
        category: body.category,
        quantity: body.quantity,
        unit: body.unit,
        minimumQuantity: body.minimumQuantity,
        expiryDate: body.expiryDate || null,
        location: body.location || null,
        notes: body.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(supplies.id, supplyId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Supply not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to update supply:", error);
    return NextResponse.json({ error: "Failed to update supply" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplyId = parseId(id);
    if (supplyId === null) {
      return NextResponse.json({ error: "Invalid supply ID" }, { status: 400 });
    }

    await db.delete(supplies).where(eq(supplies.id, supplyId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete supply:", error);
    return NextResponse.json({ error: "Failed to delete supply" }, { status: 500 });
  }
}
