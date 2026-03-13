import { NextResponse } from "next/server";
import { db } from "@/db";
import { supplies } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (category) {
      const result = await db
        .select()
        .from(supplies)
        .where(and(eq(supplies.userId, userId), eq(supplies.category, category)))
        .orderBy(desc(supplies.updatedAt));
      return NextResponse.json(result);
    }

    const result = await db
      .select()
      .from(supplies)
      .where(eq(supplies.userId, userId))
      .orderBy(desc(supplies.updatedAt));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch supplies:", message);
    return NextResponse.json({ error: `Failed to fetch supplies: ${message}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Supply name is required" }, { status: 400 });
    }

    if (!body.category?.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const newSupply = await db
      .insert(supplies)
      .values({
        userId,
        name: body.name.trim(),
        category: body.category,
        quantity: typeof body.quantity === "number" ? body.quantity : 0,
        unit: body.unit?.trim() || "units",
        minimumQuantity: typeof body.minimumQuantity === "number" ? body.minimumQuantity : 0,
        expiryDate: body.expiryDate || null,
        location: body.location?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .returning();

    return NextResponse.json(newSupply[0], { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to create supply:", message);
    return NextResponse.json({ error: `Failed to create supply: ${message}` }, { status: 500 });
  }
}
