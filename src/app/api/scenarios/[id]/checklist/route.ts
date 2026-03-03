import { NextResponse } from "next/server";
import { db } from "@/db";
import { checklistItems } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    void id; // scenario ID for validation if needed

    const body = await request.json();
    const { itemId, isCompleted } = body;

    if (typeof itemId !== "number") {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const updated = await db
      .update(checklistItems)
      .set({ isCompleted: !!isCompleted })
      .where(eq(checklistItems.id, itemId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to update checklist:", error);
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 });
  }
}
