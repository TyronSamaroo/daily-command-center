import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-helpers";
import { getGoogleCalendarEvents } from "@/lib/google-calendar";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    const events = await getGoogleCalendarEvents(userId);
    return NextResponse.json(events);
  } catch (err) {
    console.error("GET /api/calendar error:", err);
    // Return empty array so dashboard degrades gracefully
    return NextResponse.json([], { status: 200 });
  }
}
