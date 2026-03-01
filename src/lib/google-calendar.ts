import { google } from "googleapis";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { CalendarEvent } from "@/types";

export async function getGoogleCalendarEvents(
  userId: string,
  timeMin?: string,
  timeMax?: string
): Promise<CalendarEvent[]> {
  // 1. Fetch tokens from accounts table
  const [account] = await db
    .select({
      access_token: accounts.access_token,
      refresh_token: accounts.refresh_token,
      expires_at: accounts.expires_at,
    })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")));

  if (!account?.access_token) {
    return [];
  }

  // 2. Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  });

  // 3. Refresh token if expired
  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at && account.expires_at < now) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    // Persist refreshed token
    await db
      .update(accounts)
      .set({
        access_token: credentials.access_token ?? null,
        expires_at: credentials.expiry_date
          ? Math.floor(credentials.expiry_date / 1000)
          : null,
      })
      .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")));
  }

  // 4. Fetch events for the requested range (defaults to today)
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const rangeStart = timeMin
    ? new Date(timeMin)
    : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const rangeEnd = timeMax
    ? new Date(timeMax)
    : (() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; })();

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: rangeStart.toISOString(),
    timeMax: rangeEnd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  // 5. Map to CalendarEvent type
  return (response.data.items || []).map((event) => ({
    id: event.id || "",
    summary: event.summary || "(No title)",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    location: event.location || undefined,
    htmlLink: event.htmlLink || undefined,
    description: event.description || undefined,
  }));
}
