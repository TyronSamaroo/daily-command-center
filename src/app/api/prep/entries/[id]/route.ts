import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { prepEntries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const entryId = parseInt(id, 10);
  if (isNaN(entryId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();

  const [updated] = await db
    .update(prepEntries)
    .set({
      date: body.date,
      weight: body.weight ?? null,
      nightWeight: body.nightWeight ?? null,
      steps: body.steps ?? null,
      calories: body.calories ?? null,
      activeEnergy: body.activeEnergy ?? null,
      protein: body.protein ?? null,
      fat: body.fat ?? null,
      carbs: body.carbs ?? null,
      workout: body.workout ?? null,
      cardio: body.cardio ?? null,
    })
    .where(and(eq(prepEntries.id, entryId), eq(prepEntries.userId, userId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const entryId = parseInt(id, 10);
  if (isNaN(entryId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(prepEntries)
    .where(and(eq(prepEntries.id, entryId), eq(prepEntries.userId, userId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
