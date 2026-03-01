"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession, signIn } from "next-auth/react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card } from "@/components/ui/Card";
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ChevronDown,
  LogIn,
} from "lucide-react";
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

function isAllDay(event: CalendarEvent): boolean {
  return !event.start.includes("T");
}

function isPast(event: CalendarEvent): boolean {
  if (isAllDay(event)) return false;
  return new Date(event.end) < new Date();
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useSWR<CalendarEvent[]>(
    session?.user ? "/api/calendar" : null,
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  );

  const isGuest = status !== "loading" && !session?.user;

  return (
    <div>
      <ModuleHeader
        title="Today's Calendar"
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      />

      {isGuest ? (
        <Card className="text-center py-12">
          <Calendar className="w-10 h-10 text-muted mx-auto mb-3" />
          <h2 className="text-lg font-medium mb-1">Sign In to View Calendar</h2>
          <p className="text-sm text-muted mb-4">
            Connect your Google account to see today&apos;s events.
          </p>
          <button
            onClick={() => signIn("google")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </button>
        </Card>
      ) : isLoading ? (
        <Card>
          <div className="text-sm text-muted animate-pulse py-8 text-center">
            Loading calendar events...
          </div>
        </Card>
      ) : events.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar className="w-10 h-10 text-muted mx-auto mb-3" />
          <h2 className="text-lg font-medium mb-1">No Events Today</h2>
          <p className="text-sm text-muted">Your calendar is clear!</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const past = isPast(event);
            const allDay = isAllDay(event);
            const expanded = expandedId === event.id;

            return (
              <Card
                key={event.id}
                className={`p-0 transition-all cursor-pointer ${
                  past ? "opacity-60" : ""
                } ${expanded ? "ring-1 ring-accent/30" : ""}`}
              >
                <button
                  className="w-full text-left px-4 py-3 flex items-center gap-3"
                  onClick={() =>
                    setExpandedId(expanded ? null : event.id)
                  }
                >
                  {/* Status dot */}
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      past
                        ? "bg-neutral-500"
                        : allDay
                        ? "bg-blue-400"
                        : "bg-green-400"
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {event.summary}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Clock className="w-3 h-3" />
                        {allDay
                          ? "All day"
                          : `${formatEventTime(event.start)} – ${formatEventTime(event.end)}`}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1 text-xs text-muted truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-muted shrink-0 transition-transform ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/50">
                    <div className="pt-3 space-y-3">
                      {/* Time details */}
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Clock className="w-3.5 h-3.5" />
                        {allDay ? (
                          <span>All-day event</span>
                        ) : (
                          <span>
                            {new Date(event.start).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}{" "}
                            –{" "}
                            {new Date(event.end).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        )}
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-start gap-2 text-xs text-muted">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{event.location}</span>
                        </div>
                      )}

                      {/* Description */}
                      {event.description && (
                        <div className="text-xs text-muted/80 bg-white/[0.02] rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                          {event.description}
                        </div>
                      )}

                      {/* Open in Google Calendar */}
                      {event.htmlLink && (
                        <a
                          href={event.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open in Google Calendar
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
