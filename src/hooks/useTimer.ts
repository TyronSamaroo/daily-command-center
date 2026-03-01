"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const BLOCK_DURATION = 45 * 60; // 45 minutes in seconds

interface TimerState {
  isRunning: boolean;
  elapsed: number; // seconds elapsed
  remaining: number; // seconds remaining
  startedAt: string | null; // ISO timestamp
}

export function useTimer(onComplete?: () => void) {
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    elapsed: 0,
    remaining: BLOCK_DURATION,
    startedAt: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = now;
    setState({
      isRunning: true,
      elapsed: 0,
      remaining: BLOCK_DURATION,
      startedAt: new Date(now).toISOString(),
    });

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - now) / 1000);
      const remaining = Math.max(0, BLOCK_DURATION - elapsed);

      setState((prev) => ({
        ...prev,
        elapsed,
        remaining,
      }));

      if (remaining <= 0) {
        clearTimer();
        setState((prev) => ({ ...prev, isRunning: false }));
        onComplete?.();
      }
    }, 1000);
  }, [clearTimer, onComplete]);

  const stop = useCallback(() => {
    clearTimer();
    setState((prev) => ({ ...prev, isRunning: false }));
    return {
      startedAt: state.startedAt,
      endedAt: new Date().toISOString(),
      durationMin: Math.round(state.elapsed / 60),
    };
  }, [clearTimer, state.startedAt, state.elapsed]);

  const reset = useCallback(() => {
    clearTimer();
    setState({
      isRunning: false,
      elapsed: 0,
      remaining: BLOCK_DURATION,
      startedAt: null,
    });
  }, [clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    ...state,
    start,
    stop,
    reset,
    formattedRemaining: formatSeconds(state.remaining),
    formattedElapsed: formatSeconds(state.elapsed),
    progress: (state.elapsed / BLOCK_DURATION) * 100,
  };
}

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
