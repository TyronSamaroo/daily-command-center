import { useState, useCallback } from "react";

/**
 * Boolean state with stable on/off/toggle callbacks. Saves the
 * sprinkle of `useCallback(() => setX(v => !v), [])` boilerplate
 * we keep writing for modals, drawers, and disclosure widgets.
 *
 * @example
 * const [isOpen, { toggle, off }] = useToggle(false);
 */
export function useToggle(initial: boolean = false): [
  boolean,
  { toggle: () => void; on: () => void; off: () => void; set: (v: boolean) => void }
] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const on = useCallback(() => setValue(true), []);
  const off = useCallback(() => setValue(false), []);
  return [value, { toggle, on, off, set: setValue }];
}
