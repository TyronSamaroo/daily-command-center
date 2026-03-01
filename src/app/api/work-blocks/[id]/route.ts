import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workBlocks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const blockId = parseInt(id, 10);

  await db
    .delete(workBlocks)
    .where(and(eq(workBlocks.id, blockId), eq(workBlocks.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
