/**
 * Group an array of records by a key derived from each item.
 * Result preserves insertion order of the first key occurrence.
 *
 * @example
 * groupBy(blocks, (b) => b.date)
 * // { "2026-05-15": [...], "2026-05-14": [...] }
 */
export function groupBy<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const key = getKey(item);
    if (!out[key]) out[key] = [];
    out[key].push(item);
  }
  return out;
}

/**
 * Sort an array of YYYY-MM-DD keys descending (most recent first) without
 * mutating the input. Convenience around the obvious string sort + reverse
 * because every consumer keeps reinventing it.
 */
export function sortDateKeysDesc(keys: string[]): string[] {
  return [...keys].sort((a, b) => b.localeCompare(a));
}
