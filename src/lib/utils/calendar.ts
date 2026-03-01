import type { CalendarEvent } from "@/types";

export interface CalendarDay {
  date: Date;
  dateKey: string; // YYYY-MM-DD
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface MonthGrid {
  year: number;
  month: number; // 0-indexed
  label: string; // "February 2026"
  days: CalendarDay[]; // 42 items (6 weeks x 7 days)
  gridStart: string; // ISO datetime of first cell
  gridEnd: string; // ISO datetime of last cell
}

/** Build a 42-day grid for the given month (Sunday start). */
export function buildMonthGrid(year: number, month: number): MonthGrid {
  const todayKey = toDateKey(new Date());
  const firstOfMonth = new Date(year, month, 1);
  const dayOfWeek = firstOfMonth.getDay(); // 0 = Sunday

  // Walk back to the preceding Sunday
  const gridStartDate = new Date(year, month, 1 - dayOfWeek);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStartDate);
    d.setDate(gridStartDate.getDate() + i);
    const dateKey = toDateKey(d);
    days.push({
      date: d,
      dateKey,
      dayOfMonth: d.getDate(),
      isCurrentMonth: d.getMonth() === month && d.getFullYear() === year,
      isToday: dateKey === todayKey,
    });
  }

  const label = firstOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const gridStart = days[0].dateKey + "T00:00:00";
  const gridEnd = days[41].dateKey + "T23:59:59";

  return { year, month, label, days, gridStart, gridEnd };
}

/** Group events by their start date key (YYYY-MM-DD). */
export function groupEventsByDate(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    // All-day events: start is "YYYY-MM-DD", timed: "YYYY-MM-DDTHH:MM:SS..."
    const key = event.start.includes("T")
      ? event.start.split("T")[0]
      : event.start;
    const existing = map.get(key);
    if (existing) {
      existing.push(event);
    } else {
      map.set(key, [event]);
    }
  }
  return map;
}

/** Navigate to a different month, handling year rollover. */
export function navigateMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
