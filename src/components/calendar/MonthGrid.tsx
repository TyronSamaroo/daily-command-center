"use client";

import { Card } from "@/components/ui/Card";
import type { CalendarDay } from "@/lib/utils/calendar";
import type { CalendarEvent } from "@/types";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface MonthGridProps {
  days: CalendarDay[];
  eventsByDate: Map<string, CalendarEvent[]>;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
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

          return (
            <button
              key={day.dateKey}
              onClick={() => onSelectDate(day.dateKey)}
              className={`
                relative min-h-12 md:min-h-16 p-1 flex flex-col items-center gap-0.5
                border-b border-r border-border/30 transition-colors
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
                className={`text-sm leading-none mt-1 ${
                  day.isToday
                    ? "text-accent font-semibold"
                    : day.isCurrentMonth
                    ? "text-foreground"
                    : "text-muted"
                }`}
              >
                {day.dayOfMonth}
              </span>

              {/* Event indicators */}
              {eventCount > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5">
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
            </button>
          );
        })}
      </div>
    </Card>
  );
}
