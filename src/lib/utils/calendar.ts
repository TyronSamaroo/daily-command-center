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

// ─── View mode ──────────────────────────────────────────────────

export type CalendarViewMode = "month" | "week";

// ─── Week grid ──────────────────────────────────────────────────

export interface WeekGrid {
  days: CalendarDay[]; // 7 items (Sun–Sat)
  label: string; // "Feb 23 – Mar 1, 2026"
  gridStart: string;
  gridEnd: string;
}

/** Build a 7-day grid for the week containing the given date (Sunday start). */
export function buildWeekGrid(year: number, month: number, day: number): WeekGrid {
  const todayKey = toDateKey(new Date());
  const ref = new Date(year, month, day);
  const sundayOffset = ref.getDay(); // 0 = Sunday
  const sunday = new Date(year, month, day - sundayOffset);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const dateKey = toDateKey(d);
    days.push({
      date: d,
      dateKey,
      dayOfMonth: d.getDate(),
      isCurrentMonth: d.getMonth() === month && d.getFullYear() === year,
      isToday: dateKey === todayKey,
    });
  }

  const start = days[0].date;
  const end = days[6].date;
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const label =
    start.getFullYear() !== end.getFullYear()
      ? `${fmt(start)}, ${start.getFullYear()} – ${fmt(end)}, ${end.getFullYear()}`
      : start.getMonth() !== end.getMonth()
        ? `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`
        : `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;

  return {
    days,
    label,
    gridStart: days[0].dateKey + "T00:00:00",
    gridEnd: days[6].dateKey + "T23:59:59",
  };
}

/** Navigate by ±1 week. */
export function navigateWeek(
  year: number,
  month: number,
  day: number,
  delta: number
): { year: number; month: number; day: number } {
  const d = new Date(year, month, day + delta * 7);
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

// ─── Event helpers ──────────────────────────────────────────────

/** Split events into all-day and timed, sorted by start time. */
export function sortEventsForCell(
  events: CalendarEvent[]
): { allDay: CalendarEvent[]; timed: CalendarEvent[] } {
  const allDay: CalendarEvent[] = [];
  const timed: CalendarEvent[] = [];
  for (const e of events) {
    if (e.start.includes("T")) {
      timed.push(e);
    } else {
      allDay.push(e);
    }
  }
  timed.sort((a, b) => a.start.localeCompare(b.start));
  return { allDay, timed };
}

/** Get top/height percentages for positioning an event in the week time grid. */
export function getEventTopAndHeight(
  event: CalendarEvent,
  startHour: number,
  endHour: number
): { topPercent: number; heightPercent: number } {
  const totalMinutes = (endHour - startHour) * 60;
  const s = new Date(event.start);
  const e = new Date(event.end);

  let startMin = s.getHours() * 60 + s.getMinutes() - startHour * 60;
  let endMin = e.getHours() * 60 + e.getMinutes() - startHour * 60;

  startMin = Math.max(0, Math.min(startMin, totalMinutes));
  endMin = Math.max(0, Math.min(endMin, totalMinutes));

  const duration = Math.max(endMin - startMin, 15); // minimum 15min visual height

  return {
    topPercent: (startMin / totalMinutes) * 100,
    heightPercent: (duration / totalMinutes) * 100,
  };
}

// ─── Internal ───────────────────────────────────────────────────

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
