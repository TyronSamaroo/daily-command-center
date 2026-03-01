"use client";

import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigationProps {
  label: string; // "February 2026"
  isCurrentMonth: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function MonthNavigation({
  label,
  isCurrentMonth,
  onPrev,
  onNext,
  onToday,
}: MonthNavigationProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold ml-2">{label}</h2>
      </div>
      {!isCurrentMonth && (
        <Button variant="secondary" size="sm" onClick={onToday}>
          Today
        </Button>
      )}
    </div>
  );
}
