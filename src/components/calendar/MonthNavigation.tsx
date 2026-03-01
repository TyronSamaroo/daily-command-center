"use client";

import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarViewMode } from "@/lib/utils/calendar";

interface MonthNavigationProps {
  label: string;
  isCurrentPeriod: boolean;
  viewMode: CalendarViewMode;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (mode: CalendarViewMode) => void;
}

export function MonthNavigation({
  label,
  isCurrentPeriod,
  viewMode,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}: MonthNavigationProps) {
  return (
    <div className="flex items-center justify-between mb-4 gap-2">
      <div className="flex items-center gap-1 min-w-0">
        <Button variant="ghost" size="sm" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <h2 className="text-base md:text-lg font-semibold ml-2 truncate">{label}</h2>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isCurrentPeriod && (
          <Button variant="secondary" size="sm" onClick={onToday}>
            Today
          </Button>
        )}

        {/* View toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => onViewChange("month")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "month"
                ? "bg-accent text-background"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => onViewChange("week")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
              viewMode === "week"
                ? "bg-accent text-background"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            Week
          </button>
        </div>
      </div>
    </div>
  );
}
