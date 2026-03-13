import { NextResponse } from "next/server";
import { db } from "@/db";
import { supplies, supplyLog } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const supplyId = parseInt(id, 10);
    if (Number.isNaN(supplyId)) {
      return NextResponse.json({ error: "Invalid supply ID" }, { status: 400 });
    }

    const body = await request.json();
    const amount = typeof body.quantity === "number" && body.quantity > 0 ? body.quantity : 1;

    const current = await db
      .select()
      .from(supplies)
      .where(and(eq(supplies.id, supplyId), eq(supplies.userId, userId)))
      .limit(1);

    if (current.length === 0) {
      return NextResponse.json({ error: "Supply not found" }, { status: 404 });
    }

    const newQuantity = current[0].quantity + amount;

    const updated = await db
      .update(supplies)
      .set({ quantity: newQuantity, updatedAt: new Date() })
      .where(and(eq(supplies.id, supplyId), eq(supplies.userId, userId)))
      .returning();

    await db.insert(supplyLog).values({
      supplyId,
      action: "restock",
      quantity: amount,
    });

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to restock supply:", error);
    return NextResponse.json({ error: "Failed to restock supply" }, { status: 500 });
  }
}
