import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const notConfigured = () =>
  NextResponse.json({ message: "Auth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." }, { status: 503 });

async function handler(req: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return notConfigured();
  }
  try {
    const { handlers } = await import("@/lib/auth");
    const method = req.method === "POST" ? handlers.POST : handlers.GET;
    return method(req);
  } catch (err) {
    console.error("NextAuth handler error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Auth error", detail: message }, { status: 500 });
  }
}

export { handler as GET, handler as POST };
