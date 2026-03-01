"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatDateLong } from "@/lib/utils/dates";
import {
  Clock,
  MapPin,
  ExternalLink,
  ChevronDown,
  X,
  CalendarOff,
} from "lucide-react";
import type { CalendarEvent } from "@/types";

interface DayDetailProps {
  dateKey: string;
  events: CalendarEvent[];
  onClose: () => void;
}

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

export function DayDetail({ dateKey, events, onClose }: DayDetailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Card className="p-0 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">{formatDateLong(dateKey)}</h3>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Events list */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted">
          <CalendarOff className="w-6 h-6" />
          <p className="text-sm">No events this day</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {events.map((event) => {
            const allDay = isAllDay(event);
            const expanded = expandedId === event.id;

            return (
              <div key={event.id}>
                <button
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors"
                  onClick={() =>
                    setExpandedId(expanded ? null : event.id)
                  }
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      allDay ? "bg-blue-400" : "bg-accent"
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
                  <div className="px-4 pb-4 pt-0 border-t border-border/30">
                    <div className="pt-3 space-y-3">
                      {event.location && (
                        <div className="flex items-start gap-2 text-xs text-muted">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{event.location}</span>
                        </div>
                      )}

                      {event.description && (
                        <div className="text-xs text-muted/80 bg-white/[0.02] rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                          {event.description}
                        </div>
                      )}

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
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
