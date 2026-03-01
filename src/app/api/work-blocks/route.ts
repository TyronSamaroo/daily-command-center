import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { workBlocks, workStreaks } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { formatDateKey } from "@/lib/utils/dates";
import { calculateStreak } from "@/lib/utils/calculations";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date");

  const conditions = date
    ? and(eq(workBlocks.userId, userId), eq(workBlocks.date, date))
    : eq(workBlocks.userId, userId);

  const blocks = await db
    .select()
    .from(workBlocks)
    .where(conditions)
    .orderBy(desc(workBlocks.startTime));

  return NextResponse.json(blocks);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const now = new Date();
  const todayKey = formatDateKey(now);

  const [block] = await db
    .insert(workBlocks)
    .values({
      userId,
      date: todayKey,
      startTime: body.startTime || now.toISOString(),
      label: body.label || null,
    })
    .returning();

  return NextResponse.json(block, { status: 201 });
}

// Complete a block and update streak
export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const todayKey = formatDateKey(new Date());

  if (!body.id) {
    return NextResponse.json({ error: "Missing block id" }, { status: 400 });
  }

  // Update the block
  const [updated] = await db
    .update(workBlocks)
    .set({
      endTime: body.endTime || new Date().toISOString(),
      durationMin: body.durationMin || 0,
    })
    .where(and(eq(workBlocks.id, body.id), eq(workBlocks.userId, userId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  // Update streak
  const [existingStreak] = await db
    .select()
    .from(workStreaks)
    .where(eq(workStreaks.userId, userId));

  const { currentStreak, longestStreak } = calculateStreak(
    existingStreak?.currentStreak ?? 0,
    existingStreak?.longestStreak ?? 0,
    existingStreak?.lastBlockDate ?? null,
    todayKey
  );

  if (existingStreak) {
    await db
      .update(workStreaks)
      .set({ currentStreak, longestStreak, lastBlockDate: todayKey })
      .where(eq(workStreaks.userId, userId));
  } else {
    await db.insert(workStreaks).values({
      userId,
      currentStreak,
      longestStreak,
      lastBlockDate: todayKey,
    });
  }

  return NextResponse.json({ block: updated, streak: { currentStreak, longestStreak } });
}
