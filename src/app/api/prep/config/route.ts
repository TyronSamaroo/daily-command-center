import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { prepConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(null, { status: 200 });
    }

    const [config] = await db
      .select()
      .from(prepConfig)
      .where(eq(prepConfig.userId, userId));

    return NextResponse.json(config || null);
  } catch (err) {
    console.error("GET /api/prep/config error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const [existing] = await db
    .select()
    .from(prepConfig)
    .where(eq(prepConfig.userId, userId));

  if (existing) {
    const [updated] = await db
      .update(prepConfig)
      .set({
        showDate: body.showDate ?? existing.showDate,
        showName: body.showName ?? existing.showName,
        targetWeight: body.targetWeight ?? existing.targetWeight,
        startWeight: body.startWeight ?? existing.startWeight,
      })
      .where(eq(prepConfig.userId, userId))
      .returning();

    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(prepConfig)
    .values({
      userId,
      showDate: body.showDate ?? null,
      showName: body.showName ?? null,
      targetWeight: body.targetWeight ?? null,
      startWeight: body.startWeight ?? null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
