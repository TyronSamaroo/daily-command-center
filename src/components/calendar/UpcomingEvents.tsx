"use client";

import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { Calendar, ExternalLink, MapPin, Clock } from "lucide-react";
import type { CalendarEvent } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatEventTime(isoString: string): string {
  if (!isoString.includes("T")) return "All day";
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function UpcomingEvents() {
  const { data: events = [], isLoading } = useSWR<CalendarEvent[]>(
    "/api/calendar",
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-medium">Today&apos;s Events</h3>
        </div>
        <div className="text-sm text-muted animate-pulse">Loading calendar...</div>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-medium">Today&apos;s Events</h3>
        </div>
        <p className="text-sm text-muted">No events today</p>
      </Card>
    );
  }

  // Prioritize upcoming (not yet ended) events
  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.end) > now);
  const displayEvents = upcoming.length > 0 ? upcoming : events;

  return (
    <Card className="p-0">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Calendar className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-medium">Today&apos;s Events</h3>
        <span className="text-xs text-muted ml-auto">{events.length} total</span>
      </div>
      <div className="divide-y divide-border">
        {displayEvents.slice(0, 5).map((event) => (
          <div key={event.id} className="px-5 py-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{event.summary}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Clock className="w-3 h-3" />
                    {formatEventTime(event.start)} – {formatEventTime(event.end)}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1 text-xs text-muted truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
              {event.htmlLink && (
                <a
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-accent transition-colors p-1 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
