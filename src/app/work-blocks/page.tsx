"use client";

import { useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import useSWR from "swr";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Timer } from "@/components/work-blocks/Timer";
import { BlockLog } from "@/components/work-blocks/BlockLog";
import { StreakTracker } from "@/components/work-blocks/StreakTracker";
import { Card, StatCard } from "@/components/ui/Card";
import { formatDateKey } from "@/lib/utils/dates";
import { Timer as TimerIcon, Clock, Target, LogIn } from "lucide-react";
import type { WorkBlock } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function WorkBlocksPage() {
  const { data: session, status } = useSession();
  const isGuest = status !== "loading" && !session?.user;
  const todayKey = formatDateKey(new Date());

  const { data: blocks = [], mutate: mutateBlocks } = useSWR<WorkBlock[]>(
    session?.user ? `/api/work-blocks?date=${todayKey}` : null,
    fetcher
  );

  const { data: allBlocks = [] } = useSWR<WorkBlock[]>(
    session?.user ? "/api/work-blocks" : null,
    fetcher
  );

  const completedToday = blocks.filter((b) => b.endTime);
  const minutesToday = completedToday.reduce((sum, b) => sum + (b.durationMin || 0), 0);

  const weekStart = getWeekStart();
  const weekBlocks = allBlocks.filter(
    (b) => b.endTime && b.date >= weekStart
  );
  const minutesThisWeek = weekBlocks.reduce((sum, b) => sum + (b.durationMin || 0), 0);

  const currentStreak = 0;
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

  const handleUpdateLabel = useCallback(
    async (id: number, label: string) => {
      await fetch(`/api/work-blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
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

      {isGuest ? (
        <Card className="text-center py-12">
          <TimerIcon className="w-10 h-10 text-muted mx-auto mb-3" />
          <h2 className="text-lg font-medium mb-1">Sign In to Track Work Blocks</h2>
          <p className="text-sm text-muted mb-4">
            Connect your Google account to start focus sprints.
          </p>
          <button
            onClick={() => signIn("google")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-background text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          {/* Main: Timer */}
          <div className="flex flex-col items-center">
            <div className="bg-surface border border-border rounded-xl p-8 w-full flex justify-center">
              <Timer onBlockComplete={handleBlockComplete} readOnly={false} />
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
            <BlockLog blocks={blocks} onDelete={handleDelete} onUpdateLabel={handleUpdateLabel} readOnly={false} />
          </div>
        </div>
      )}
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
