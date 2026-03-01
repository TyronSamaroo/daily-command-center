import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DEMO_USER_ID = "demo-user";
const DEMO_USER_NAME = "Tyron";
const DEMO_USER_EMAIL = "demo@commandcenter.app";

/**
 * Get the current user ID.
 * When Google OAuth is configured, uses NextAuth session.
 * Otherwise, falls back to a demo user for development/preview.
 */
export async function getUserId(): Promise<string | null> {
  // Try NextAuth first (only if Google OAuth is configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    return session?.user?.id ?? null;
  }

  // Demo mode: ensure demo user exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, DEMO_USER_ID));

  if (!existing) {
    await db.insert(users).values({
      id: DEMO_USER_ID,
      name: DEMO_USER_NAME,
      email: DEMO_USER_EMAIL,
    });
  }

  return DEMO_USER_ID;
}

export function isDemoMode(): boolean {
  return !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET;
}
