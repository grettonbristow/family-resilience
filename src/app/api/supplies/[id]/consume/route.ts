import { NextResponse } from "next/server";
import { db } from "@/db";
import { supplies, supplyLog } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      .where(eq(supplies.id, supplyId))
      .limit(1);

    if (current.length === 0) {
      return NextResponse.json({ error: "Supply not found" }, { status: 404 });
    }

    const newQuantity = Math.max(0, current[0].quantity - amount);

    const updated = await db
      .update(supplies)
      .set({ quantity: newQuantity, updatedAt: new Date() })
      .where(eq(supplies.id, supplyId))
      .returning();

    await db.insert(supplyLog).values({
      supplyId,
      action: "consume",
      quantity: amount,
    });

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to consume supply:", error);
    return NextResponse.json({ error: "Failed to consume supply" }, { status: 500 });
  }
}
