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
