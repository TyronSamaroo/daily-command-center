import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DEMO_USER_ID = "demo-user";
const DEMO_USER_NAME = "Tyron";
const DEMO_USER_EMAIL = "demo@commandcenter.app";

export type AccessLevel = "owner" | "guest";

/**
 * Get the current authenticated user ID.
 * Returns the session user ID if signed in, or null if not.
 * In demo mode (no OAuth configured), returns a demo user ID.
 */
export async function getUserId(): Promise<string | null> {
  if (isDemoMode()) {
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

  // OAuth mode: check session
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    // Auth not initialized yet or no session — treat as guest
    return null;
  }
}

/**
 * Get the owner's user ID for read-only access.
 * In demo mode, returns the demo user. In OAuth mode, returns the first user
 * (since this is a single-user app).
 */
export async function getOwnerUserId(): Promise<string | null> {
  if (isDemoMode()) {
    return DEMO_USER_ID;
  }

  // Single-user app: get the first user in the DB (the owner)
  const [owner] = await db.select().from(users).limit(1);
  return owner?.id ?? null;
}

/**
 * Determine access level for the current request.
 * - "owner": authenticated user (or demo mode)
 * - "guest": unauthenticated visitor viewing read-only
 */
export async function getAccessLevel(): Promise<AccessLevel> {
  const userId = await getUserId();
  return userId ? "owner" : "guest";
}

export function isDemoMode(): boolean {
  return !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET;
}
