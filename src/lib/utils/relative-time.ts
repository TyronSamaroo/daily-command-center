/**
 * Format a Date or ISO timestamp as a human-friendly relative time:
 * "just now", "2m ago", "3h ago", "yesterday", "Mar 12".
 *
 * Anything older than 7 days falls back to a short date so the UI doesn't
 * end up saying "47d ago" for an event from two months back.
 */
export function formatRelativeTime(input: Date | string, now: Date = new Date()): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 45) return "just now";

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
