import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Lightweight health-check endpoint. Returns 200 when the server is up.
 * Useful for uptime monitoring (UptimeRobot, etc.) and deployment verification.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "unknown",
    },
    { status: 200 }
  );
}
