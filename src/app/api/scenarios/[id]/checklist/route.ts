import { NextResponse } from "next/server";
import { db } from "@/db";
import { checklistItems, scenarios } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const scenarioId = parseInt(id, 10);
    if (Number.isNaN(scenarioId)) {
      return NextResponse.json({ error: "Invalid scenario ID" }, { status: 400 });
    }

    // Verify scenario belongs to user
    const scenario = await db
      .select()
      .from(scenarios)
      .where(and(eq(scenarios.id, scenarioId), eq(scenarios.userId, userId)))
      .limit(1);

    if (scenario.length === 0) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    const body = await request.json();
    const { itemId, isCompleted } = body;

    if (typeof itemId !== "number") {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const updated = await db
      .update(checklistItems)
      .set({ isCompleted: !!isCompleted })
      .where(and(eq(checklistItems.id, itemId), eq(checklistItems.scenarioId, scenarioId)))
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
