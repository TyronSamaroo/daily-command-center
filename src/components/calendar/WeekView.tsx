"use client";

import { Card } from "@/components/ui/Card";
import { sortEventsForCell, getEventTopAndHeight } from "@/lib/utils/calendar";
import { formatTimeShort } from "@/lib/utils/dates";
import type { CalendarDay } from "@/lib/utils/calendar";
import type { CalendarEvent } from "@/types";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_HEIGHT = 60; // px per hour
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

interface WeekViewProps {
  days: CalendarDay[];
  eventsByDate: Map<string, CalendarEvent[]>;
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
}

function formatHourLabel(hour: number): string {
  const h12 = hour % 12 || 12;
  const period = hour < 12 ? "AM" : "PM";
  return `${h12} ${period}`;
}

export function WeekView({
  days,
  eventsByDate,
  selectedDate,
  onSelectDate,
}: WeekViewProps) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  const nowPercent = ((nowMinutes - START_HOUR * 60) / totalMinutes) * 100;

  return (
    <Card className="p-0 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-border">
        <div />
        {days.map((day) => (
          <button
            key={day.dateKey}
            onClick={() => onSelectDate(day.dateKey)}
            className={`
              py-2 text-center border-l border-border/30 transition-colors
              ${selectedDate === day.dateKey ? "bg-surface-hover" : "hover:bg-white/[0.03]"}
            `}
          >
            <div className="text-[10px] text-muted uppercase">
              {DAY_HEADERS[day.date.getDay()]}
            </div>
            <div
              className={`text-sm font-medium mt-0.5 ${
                day.isToday
                  ? "w-7 h-7 rounded-full bg-accent text-background flex items-center justify-center mx-auto"
                  : ""
              }`}
            >
              {day.dayOfMonth}
            </div>
          </button>
        ))}
      </div>

      {/* All-day events row */}
      <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b border-border">
        <div className="text-[9px] text-muted py-1 text-right pr-2 self-center">
          all-day
        </div>
        {days.map((day) => {
          const { allDay } = sortEventsForCell(
            eventsByDate.get(day.dateKey) || []
          );
          return (
            <div
              key={day.dateKey}
              className="border-l border-border/30 p-0.5 min-h-7 flex flex-col gap-0.5"
            >
              {allDay.map((e) => (
                <div
                  key={e.id}
                  className="text-[10px] bg-blue-400/20 text-blue-300 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-blue-400/30 transition-colors"
                  onClick={() => onSelectDate(day.dateKey)}
                  title={e.summary}
                >
                  {e.summary}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[calc(100vh-18rem)]">
        <div
          className="grid grid-cols-[3rem_repeat(7,1fr)] relative"
          style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
        >
          {/* Time gutter */}
          <div className="relative border-r border-border/30">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 text-[10px] text-muted -translate-y-1/2"
                style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const { timed } = sortEventsForCell(
              eventsByDate.get(day.dateKey) || []
            );
            const isSelected = selectedDate === day.dateKey;

            return (
              <div
                key={day.dateKey}
                className={`relative border-l border-border/30 ${
                  isSelected ? "bg-surface-hover/50" : ""
                }`}
                onClick={() => onSelectDate(day.dateKey)}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/15"
                    style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Half-hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={`half-${hour}`}
                    className="absolute left-0 right-0 border-t border-border/8"
                    style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                  />
                ))}

                {/* Current time indicator */}
                {day.isToday && nowPercent >= 0 && nowPercent <= 100 && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: `${nowPercent}%` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-danger -ml-1 shrink-0" />
                      <div className="flex-1 border-t-2 border-danger" />
                    </div>
                  </div>
                )}

                {/* Event blocks */}
                {timed.map((event) => {
                  const { topPercent, heightPercent } = getEventTopAndHeight(
                    event,
                    START_HOUR,
                    END_HOUR
                  );
                  return (
                    <div
                      key={event.id}
                      className="absolute left-0.5 right-0.5 bg-accent/20 border-l-2 border-accent rounded-sm px-1.5 py-0.5 overflow-hidden cursor-pointer hover:bg-accent/30 transition-colors z-[1]"
                      style={{
                        top: `${topPercent}%`,
                        height: `${Math.max(heightPercent, 2.5)}%`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDate(day.dateKey);
                      }}
                      title={event.summary}
                    >
                      <div className="text-[10px] font-medium text-accent truncate">
                        {event.summary}
                      </div>
                      {heightPercent > 4 && (
                        <div className="text-[9px] text-accent/70">
                          {formatTimeShort(event.start)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
