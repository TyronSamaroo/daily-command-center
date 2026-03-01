import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { prepEntries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "60", 10);

    const entries = await db
      .select()
      .from(prepEntries)
      .where(eq(prepEntries.userId, userId))
      .orderBy(desc(prepEntries.date))
      .limit(limit);

    return NextResponse.json(entries);
  } catch (err) {
    console.error("GET /api/prep/entries error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const values = {
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
  };

  const [entry] = await db
    .insert(prepEntries)
    .values({ userId, date: body.date, ...values })
    .onConflictDoUpdate({
      target: [prepEntries.userId, prepEntries.date],
      set: values,
    })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
