import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { workBlocks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const blockId = parseInt(id, 10);

  await db
    .delete(workBlocks)
    .where(and(eq(workBlocks.id, blockId), eq(workBlocks.userId, userId)));

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const blockId = parseInt(id, 10);
  const body = await req.json();

  const [updated] = await db
    .update(workBlocks)
    .set({ label: body.label || null })
    .where(and(eq(workBlocks.id, blockId), eq(workBlocks.userId, userId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
