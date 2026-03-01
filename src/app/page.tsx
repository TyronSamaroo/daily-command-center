"use client";

import Link from "next/link";
import useSWR from "swr";
import { useSession, signIn } from "next-auth/react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card, StatCard } from "@/components/ui/Card";
import { UpcomingEvents } from "@/components/calendar/UpcomingEvents";
import {
  Timer,
  Dumbbell,
  Home,
  BarChart3,
  Flame,
  Calendar,
  ArrowRight,
  LogIn,
} from "lucide-react";
import type { CalendarEvent } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const modules = [
  {
    label: "Work Blocks",
    href: "/work-blocks",
    icon: Timer,
    description: "Start a 45-min focus sprint",
    color: "text-accent",
  },
  {
    label: "Contest Prep",
    href: "/contest-prep",
    icon: Dumbbell,
    description: "Track weight, macros & phases",
    color: "text-warning",
  },
  {
    label: "Household",
    href: "/household",
    icon: Home,
    description: "Schedules, chores & coordination",
    color: "text-danger",
  },
  {
    label: "Weekly Retro",
    href: "/weekly-retro",
    icon: BarChart3,
    description: "Review your week's progress",
    color: "text-[#dda0dd]",
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const now = new Date();
  const greeting = getGreeting(now.getHours());

  const userName = session?.user?.name?.split(" ")[0] || "there";
  const isGuest = status !== "loading" && !session?.user;

  const { data: calendarEvents = [] } = useSWR<CalendarEvent[]>(
    session?.user ? "/api/calendar" : null,
    fetcher
  );

  const nextEvent = calendarEvents[0];

  return (
    <div>
      <ModuleHeader
        title={`${greeting}, ${userName}`}
        subtitle={now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      />

      {/* Guest sign-in prompt */}
      {isGuest && (
        <button
          onClick={() => signIn("google")}
          className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-accent/30 bg-accent/5 text-accent text-sm hover:bg-accent/10 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign in with Google to track your work
        </button>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Streak"
          value={0}
          unit="days"
          icon={<Flame className="w-4 h-4 text-warning" />}
          color="text-warning"
        />
        <StatCard
          label="Blocks Today"
          value={0}
          icon={<Timer className="w-4 h-4" />}
        />
        <StatCard
          label="Calendar"
          value={session?.user ? calendarEvents.length : "—"}
          unit={session?.user ? "events" : ""}
          icon={<Calendar className="w-4 h-4" />}
          subtext={nextEvent ? `Next: ${nextEvent.summary}` : (session?.user ? "No events today" : "Sign in to connect")}
        />
        <StatCard
          label="Week Progress"
          value="—"
          icon={<BarChart3 className="w-4 h-4" />}
          subtext="Complete a week to see"
        />
      </div>

      {/* Calendar Events (authenticated only) */}
      {session?.user && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Calendar</h2>
          <UpcomingEvents />
        </div>
      )}

      {/* Module Quick Links */}
      <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link key={mod.href} href={mod.href}>
              <Card className="flex items-center gap-4 hover:border-border-hover transition-colors cursor-pointer group">
                <div className={`w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center ${mod.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{mod.label}</div>
                  <div className="text-xs text-muted">{mod.description}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
