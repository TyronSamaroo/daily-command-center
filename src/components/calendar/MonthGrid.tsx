"use client";

import { Card } from "@/components/ui/Card";
import { sortEventsForCell } from "@/lib/utils/calendar";
import { formatTimeShort } from "@/lib/utils/dates";
import type { CalendarDay } from "@/lib/utils/calendar";
import type { CalendarEvent } from "@/types";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE = 3;

interface MonthGridProps {
  days: CalendarDay[];
  eventsByDate: Map<string, CalendarEvent[]>;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
}

function EventChip({ event, isAllDay }: { event: CalendarEvent; isAllDay: boolean }) {
  const label = isAllDay
    ? event.summary
    : `${formatTimeShort(event.start)} ${event.summary}`;

  return (
    <div
      className={`
        text-[10px] leading-tight px-1 py-0.5 rounded truncate w-full
        ${isAllDay
          ? "bg-blue-400/20 text-blue-300"
          : "bg-accent/15 text-accent"
        }
      `}
      title={event.summary}
    >
      {label}
    </div>
  );
}

export function MonthGrid({
  days,
  eventsByDate,
  selectedDate,
  onSelectDate,
}: MonthGridProps) {
  return (
    <Card className="p-0 overflow-hidden">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[11px] font-medium text-muted uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const events = eventsByDate.get(day.dateKey) || [];
          const isSelected = selectedDate === day.dateKey;
          const eventCount = events.length;
          const { allDay, timed } = sortEventsForCell(events);
          const allEvents = [...allDay, ...timed];
          const visible = allEvents.slice(0, MAX_VISIBLE);
          const overflow = allEvents.length - MAX_VISIBLE;

          return (
            <button
              key={day.dateKey}
              onClick={() => onSelectDate(day.dateKey)}
              className={`
                relative min-h-14 md:min-h-24 p-1 flex flex-col items-start
                border-b border-r border-border/30 transition-colors text-left
                ${day.isCurrentMonth ? "" : "opacity-30"}
                ${day.isToday && isSelected
                  ? "bg-accent/20 ring-1 ring-inset ring-accent"
                  : day.isToday
                  ? "bg-accent/15"
                  : isSelected
                  ? "bg-surface-hover ring-1 ring-inset ring-accent/50"
                  : "hover:bg-white/[0.03]"
                }
              `}
            >
              <span
                className={`text-xs leading-none ${
                  day.isToday
                    ? "text-accent font-semibold"
                    : day.isCurrentMonth
                    ? "text-foreground"
                    : "text-muted"
                }`}
              >
                {day.dayOfMonth}
              </span>

              {/* Mobile: dots */}
              {eventCount > 0 && (
                <div className="flex items-center gap-0.5 mt-1 md:hidden">
                  {eventCount <= 3 ? (
                    Array.from({ length: eventCount }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-accent"
                      />
                    ))
                  ) : (
                    <span className="text-[9px] text-accent font-medium">
                      {eventCount}
                    </span>
                  )}
                </div>
              )}

              {/* Desktop: event chips */}
              {eventCount > 0 && (
                <div className="hidden md:flex flex-col gap-0.5 w-full mt-1 overflow-hidden flex-1">
                  {visible.map((event) => (
                    <EventChip
                      key={event.id}
                      event={event}
                      isAllDay={!event.start.includes("T")}
                    />
                  ))}
                  {overflow > 0 && (
                    <span className="text-[9px] text-muted px-1">
                      +{overflow} more
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
