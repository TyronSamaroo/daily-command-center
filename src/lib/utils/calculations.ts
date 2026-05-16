/** Calculate N-day moving average for a numeric array */
export function movingAverage(data: (number | null)[], window: number = 7): (number | null)[] {
  return data.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1).filter((v): v is number => v !== null);
    if (slice.length === 0) return null;
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

/** Calculate streak from a lastBlockDate compared to today */
export function calculateStreak(
  currentStreak: number,
  longestStreak: number,
  lastBlockDate: string | null,
  todayDate: string
): { currentStreak: number; longestStreak: number } {
  if (!lastBlockDate) {
    return { currentStreak: 1, longestStreak: Math.max(longestStreak, 1) };
  }

  const last = new Date(lastBlockDate + "T00:00:00");
  const today = new Date(todayDate + "T00:00:00");
  const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day — streak stays
    return { currentStreak, longestStreak };
  } else if (diffDays === 1) {
    // Consecutive day — increment
    const newStreak = currentStreak + 1;
    return { currentStreak: newStreak, longestStreak: Math.max(longestStreak, newStreak) };
  } else {
    // Gap — reset
    return { currentStreak: 1, longestStreak: Math.max(longestStreak, 1) };
  }
}

/** Percentage with bounds */
export function pct(consumed: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((consumed / target) * 100));
}

/** Remaining with floor at 0 */
export function remaining(target: number, consumed: number): number {
  return Math.max(0, target - consumed);
}

/**
 * Percent change between two values, e.g. ((current - previous) / previous) * 100.
 * Returns null when previous is 0 or nullish, since the answer is undefined.
 */
export function percentChange(
  current: number,
  previous: number | null | undefined
): number | null {
  if (previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Sum a numeric array, treating null/undefined as zero. */
export function sum(values: (number | null | undefined)[]): number {
  return values.reduce<number>((total, v) => total + (v ?? 0), 0);
}

/** Average of a numeric array, ignoring null/undefined. Returns null when empty. */
export function average(values: (number | null | undefined)[]): number | null {
  const present = values.filter((v): v is number => v != null);
  if (present.length === 0) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}
