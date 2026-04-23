/**
 * Formatting utilities for display values throughout the app.
 */

/** Format a weight value with 1 decimal place, e.g. "155.2 lbs" */
export function formatWeight(lbs: number | null | undefined, unit = "lbs"): string {
  if (lbs == null) return "—";
  return `${lbs.toFixed(1)} ${unit}`;
}

/** Format a weight delta with sign, e.g. "+2.4 lbs" or "-1.8 lbs" */
export function formatWeightDelta(delta: number | null | undefined, unit = "lbs"): string {
  if (delta == null) return "—";
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)} ${unit}`;
}

/** Format macro grams, e.g. "182g" */
export function formatMacro(grams: number | null | undefined): string {
  if (grams == null) return "—";
  return `${Math.round(grams)}g`;
}

/** Format calories with comma separator, e.g. "1,850 cal" */
export function formatCalories(cal: number | null | undefined): string {
  if (cal == null) return "—";
  return `${cal.toLocaleString()} cal`;
}

/** Format steps with comma separator, e.g. "10,423 steps" */
export function formatSteps(steps: number | null | undefined): string {
  if (steps == null) return "—";
  return steps.toLocaleString();
}

/** Format a percentage as "72%" */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Clamp a number to [min, max].
 * Useful for progress bars that shouldn't exceed 100%.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert lbs to kg, rounded to 1 decimal.
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10;
}

/**
 * Convert kg to lbs, rounded to 1 decimal.
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

/** Pluralize a word: pluralize("block", 1) → "block", pluralize("block", 3) → "blocks" */
export function pluralize(word: string, count: number, plural?: string): string {
  return count === 1 ? word : (plural ?? `${word}s`);
}

/** Truncate a string to maxLength with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}
