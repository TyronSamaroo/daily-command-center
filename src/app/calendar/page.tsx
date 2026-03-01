"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { useSession, signIn } from "next-auth/react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card } from "@/components/ui/Card";
import { MonthNavigation } from "@/components/calendar/MonthNavigation";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { WeekView } from "@/components/calendar/WeekView";
import { DayDetail } from "@/components/calendar/DayDetail";
import {
  buildMonthGrid,
  buildWeekGrid,
  groupEventsByDate,
  navigateMonth,
  navigateWeek,
} from "@/lib/utils/calendar";
import type { CalendarViewMode } from "@/lib/utils/calendar";
import { Calendar, LogIn } from "lucide-react";
import type { CalendarEvent } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const now = new Date();

  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentDay, setCurrentDay] = useState(now.getDate());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthGrid = useMemo(
    () => buildMonthGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const weekGrid = useMemo(
    () => buildWeekGrid(currentYear, currentMonth, currentDay),
    [currentYear, currentMonth, currentDay]
  );

  const activeGrid = viewMode === "month" ? monthGrid : weekGrid;

  const { data: events = [], isLoading } = useSWR<CalendarEvent[]>(
    session?.user
      ? `/api/calendar?timeMin=${encodeURIComponent(activeGrid.gridStart)}&timeMax=${encodeURIComponent(activeGrid.gridEnd)}`
      : null,
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  );

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const isGuest = status !== "loading" && !session?.user;

  const isCurrentPeriod =
    viewMode === "month"
      ? currentYear === now.getFullYear() && currentMonth === now.getMonth()
      : weekGrid.days.some((d) => d.isToday);

  const label = viewMode === "month" ? monthGrid.label : weekGrid.label;

  const handleNavigate = (delta: number) => {
    if (viewMode === "month") {
      const next = navigateMonth(currentYear, currentMonth, delta);
      setCurrentYear(next.year);
      setCurrentMonth(next.month);
    } else {
      const next = navigateWeek(currentYear, currentMonth, currentDay, delta);
      setCurrentYear(next.year);
      setCurrentMonth(next.month);
      setCurrentDay(next.day);
    }
    setSelectedDate(null);
  };

  const handleToday = () => {
    const n = new Date();
    setCurrentYear(n.getFullYear());
    setCurrentMonth(n.getMonth());
    setCurrentDay(n.getDate());
    setSelectedDate(null);
  };

  const handleViewChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
    setSelectedDate(null);
  };

  return (
    <div>
      <ModuleHeader title="Calendar" />

      {isGuest ? (
        <Card className="text-center py-12">
          <Calendar className="w-10 h-10 text-muted mx-auto mb-3" />
          <h2 className="text-lg font-medium mb-1">Sign In to View Calendar</h2>
          <p className="text-sm text-muted mb-4">
            Connect your Google account to see your events.
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
        <>
          <MonthNavigation
            label={label}
            isCurrentPeriod={isCurrentPeriod}
            viewMode={viewMode}
            onPrev={() => handleNavigate(-1)}
            onNext={() => handleNavigate(1)}
            onToday={handleToday}
            onViewChange={handleViewChange}
          />

          {isLoading && events.length === 0 ? (
            <Card>
              <div className="text-sm text-muted animate-pulse py-8 text-center">
                Loading events...
              </div>
            </Card>
          ) : viewMode === "month" ? (
            <MonthGrid
              days={monthGrid.days}
              eventsByDate={eventsByDate}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          ) : (
            <WeekView
              days={weekGrid.days}
              eventsByDate={eventsByDate}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}

          {selectedDate && (
            <DayDetail
              dateKey={selectedDate}
              events={eventsByDate.get(selectedDate) || []}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
