"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Timer } from "@/components/work-blocks/Timer";
import { BlockLog } from "@/components/work-blocks/BlockLog";
import { StreakTracker } from "@/components/work-blocks/StreakTracker";
import { StatCard } from "@/components/ui/Card";
import { formatDateKey } from "@/lib/utils/dates";
import { Timer as TimerIcon, Clock, Target } from "lucide-react";
import type { WorkBlock } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function WorkBlocksPage() {
  const { data: session, status } = useSession();
  const isGuest = status !== "loading" && !session?.user;
  const todayKey = formatDateKey(new Date());

  const { data: blocks = [], mutate: mutateBlocks } = useSWR<WorkBlock[]>(
    `/api/work-blocks?date=${todayKey}`,
    fetcher
  );

  const { data: allBlocks = [] } = useSWR<WorkBlock[]>(
    "/api/work-blocks",
    fetcher
  );

  const completedToday = blocks.filter((b) => b.endTime);
  const minutesToday = completedToday.reduce((sum, b) => sum + (b.durationMin || 0), 0);

  // Calculate this week's hours
  const weekStart = getWeekStart();
  const weekBlocks = allBlocks.filter(
    (b) => b.endTime && b.date >= weekStart
  );
  const minutesThisWeek = weekBlocks.reduce((sum, b) => sum + (b.durationMin || 0), 0);

  // Extract streak from most recent completed block response
  // We'll use the allBlocks SWR data to derive streak info
  // In a real app, we'd have a separate streak endpoint
  const currentStreak = 0; // Will be populated from streak API
  const longestStreak = 0;

  const handleBlockComplete = useCallback(() => {
    mutateBlocks();
  }, [mutateBlocks]);

  const handleDelete = useCallback(
    async (id: number) => {
      await fetch(`/api/work-blocks/${id}`, { method: "DELETE" });
      mutateBlocks();
    },
    [mutateBlocks]
  );

  return (
    <div>
      <ModuleHeader
        title="Work Blocks"
        subtitle="45-minute focus sprints"
      />

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        {/* Main: Timer */}
        <div className="flex flex-col items-center">
          <div className="bg-surface border border-border rounded-xl p-8 w-full flex justify-center">
            <Timer onBlockComplete={handleBlockComplete} readOnly={isGuest} />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 w-full mt-4">
            <StatCard
              label="Blocks Today"
              value={completedToday.length}
              icon={<Target className="w-4 h-4" />}
            />
            <StatCard
              label="Today"
              value={minutesToday >= 60 ? `${(minutesToday / 60).toFixed(1)}` : `${minutesToday}`}
              unit={minutesToday >= 60 ? "hrs" : "min"}
              icon={<TimerIcon className="w-4 h-4" />}
            />
            <StatCard
              label="This Week"
              value={minutesThisWeek >= 60 ? `${(minutesThisWeek / 60).toFixed(1)}` : `${minutesThisWeek}`}
              unit={minutesThisWeek >= 60 ? "hrs" : "min"}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Sidebar: Log + Streaks */}
        <div className="flex flex-col gap-4">
          <StreakTracker
            currentStreak={currentStreak}
            longestStreak={longestStreak}
          />
          <BlockLog blocks={blocks} onDelete={handleDelete} readOnly={isGuest} />
        </div>
      </div>
    </div>
  );
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return formatDateKey(d);
}
