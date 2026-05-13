import { useRef, useEffect } from "react";

/**
 * Returns the previous value of `value` across renders. First render
 * returns undefined. Handy for diff-aware effects: "fire when the
 * selected date *changes*, not on mount".
 *
 * @example
 * const prevDate = usePrevious(selectedDate);
 * useEffect(() => {
 *   if (prevDate && prevDate !== selectedDate) refetch();
 * }, [selectedDate, prevDate]);
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
