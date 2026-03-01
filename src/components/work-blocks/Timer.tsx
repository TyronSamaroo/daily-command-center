"use client";

import { useState, useCallback } from "react";
import { useTimer } from "@/hooks/useTimer";
import { Button } from "@/components/ui/Button";
import { Play, Square, RotateCcw, Zap } from "lucide-react";

interface TimerProps {
  onBlockComplete: (block: {
    startTime: string;
    endTime: string;
    durationMin: number;
    label?: string;
  }) => void;
  readOnly?: boolean;
}

export function Timer({ onBlockComplete, readOnly }: TimerProps) {
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [label, setLabel] = useState("");

  const handleComplete = useCallback(() => {
    // Timer naturally finished
  }, []);

  const timer = useTimer(handleComplete);

  async function handleStart() {
    timer.start();

    try {
      const res = await fetch("/api/work-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime: new Date().toISOString(), label: label || null }),
      });
      const block = await res.json();
      setActiveBlockId(block.id);
    } catch {
      // Continue with timer even if API fails
    }
  }

  async function handleStop() {
    const result = timer.stop();
    if (!result.startedAt) return;

    const endTime = new Date().toISOString();
    const durationMin = result.durationMin;

    if (activeBlockId) {
      try {
        await fetch("/api/work-blocks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeBlockId,
            endTime,
            durationMin,
          }),
        });
      } catch {
        // Block is still saved, just not completed server-side
      }
    }

    onBlockComplete({
      startTime: result.startedAt!,
      endTime,
      durationMin,
      label: label || undefined,
    });
    setActiveBlockId(null);
  }

  function handleReset() {
    timer.reset();
    setActiveBlockId(null);
    setLabel("");
  }

  // Ring progress circle
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (timer.progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Circular timer display */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="6"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke={timer.isRunning ? "#4ecdc4" : "rgba(255,255,255,0.1)"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="text-center z-10">
          <div className="text-5xl font-mono font-bold tracking-wider">
            {timer.formattedRemaining}
          </div>
          <div className="text-sm text-muted mt-1">
            {timer.isRunning ? (label || "focusing...") : timer.elapsed > 0 ? "paused" : "ready"}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3">
        {readOnly ? (
          <div className="text-sm text-muted">Sign in to track work blocks</div>
        ) : (
          <>
            {/* Label input - shown when idle */}
            {!timer.isRunning && timer.elapsed === 0 && (
              <input
                type="text"
                placeholder="What are you working on? (optional)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleStart(); }}
                className="w-full max-w-xs px-3 py-2 rounded-lg bg-white/[0.03] border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors text-center"
              />
            )}
            <div className="flex items-center gap-3">
              {!timer.isRunning && timer.elapsed === 0 && (
                <Button onClick={handleStart} size="lg" className="gap-2">
                  <Play className="w-5 h-5" />
                  Start Block
                </Button>
              )}
              {timer.isRunning && (
                <Button onClick={handleStop} variant="danger" size="lg" className="gap-2">
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              )}
              {!timer.isRunning && timer.elapsed > 0 && (
                <>
                  <Button onClick={handleStart} size="lg" className="gap-2">
                    <Zap className="w-5 h-5" />
                    New Block
                  </Button>
                  <Button onClick={handleReset} variant="ghost" size="lg">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
