import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-helpers";
import { getGoogleCalendarEvents } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    const timeMin = req.nextUrl.searchParams.get("timeMin") ?? undefined;
    const timeMax = req.nextUrl.searchParams.get("timeMax") ?? undefined;

    const events = await getGoogleCalendarEvents(userId, timeMin, timeMax);
    return NextResponse.json(events);
  } catch (err) {
    console.error("GET /api/calendar error:", err);
    // Return empty array so dashboard degrades gracefully
    return NextResponse.json([], { status: 200 });
  }
}
