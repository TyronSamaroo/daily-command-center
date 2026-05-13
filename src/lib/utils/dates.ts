/** Format a Date to YYYY-MM-DD */
export function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Get today's date key */
export function today(): string {
  return formatDateKey(new Date());
}

/** Days between two YYYY-MM-DD strings */
export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/** Get the start of the current week (Monday) as YYYY-MM-DD */
export function weekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return formatDateKey(d);
}

/** Format minutes as "Xh Ym" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Format ISO timestamp to "h:mm AM/PM" */
export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format YYYY-MM-DD as "Mon, Feb 28" */
export function formatDateShort(dateKey: string): string {
  const date = new Date(dateKey + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Format ISO timestamp to compact time: "9 AM" or "9:30 AM" */
export function formatTimeShort(isoString: string): string {
  if (!isoString.includes("T")) return "All day";
  const d = new Date(isoString);
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Format YYYY-MM-DD as "Saturday, February 28, 2026" */
export function formatDateLong(dateKey: string): string {
  const date = new Date(dateKey + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** True when the YYYY-MM-DD key matches today (local time). */
export function isToday(dateKey: string): boolean {
  return dateKey === today();
}

/** True when the YYYY-MM-DD key is exactly one day before today. */
export function isYesterday(dateKey: string): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return dateKey === formatDateKey(y);
}

/**
 * Render a date key with the friendly relative label where it helps:
 * "Today", "Yesterday", "Mon, Feb 28".
 */
export function formatDateFriendly(dateKey: string): string {
  if (isToday(dateKey)) return "Today";
  if (isYesterday(dateKey)) return "Yesterday";
  return formatDateShort(dateKey);
}
