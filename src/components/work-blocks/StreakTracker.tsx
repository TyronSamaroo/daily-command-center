import { Flame, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakTracker({ currentStreak, longestStreak }: StreakTrackerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-warning" />
          <div>
            <p className="text-xs text-muted">Current Streak</p>
            <p className="text-xl font-bold text-warning">
              {currentStreak} <span className="text-xs font-normal text-muted">days</span>
            </p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <div>
            <p className="text-xs text-muted">Longest Streak</p>
            <p className="text-xl font-bold text-accent">
              {longestStreak} <span className="text-xs font-normal text-muted">days</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
