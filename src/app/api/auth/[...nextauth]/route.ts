import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const notConfigured = () =>
  NextResponse.json({ message: "Auth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." }, { status: 503 });

async function handler(req: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return notConfigured();
  }
  const { handlers } = await import("@/lib/auth");
  const method = req.method === "POST" ? handlers.POST : handlers.GET;
  return method(req);
}

export { handler as GET, handler as POST };
