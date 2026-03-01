"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { movingAverage } from "@/lib/utils/calculations";
import { daysBetween, formatDateShort } from "@/lib/utils/dates";
import {
  Dumbbell,
  Scale,
  Footprints,
  Flame,
  Calendar,
  Settings,
  TrendingDown,
} from "lucide-react";
import type { PrepEntry, PrepConfig } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const workoutColors: Record<string, string> = {
  Push: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  Pull: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  Legs: "bg-green-500/15 text-green-400 border border-green-500/30",
  Rest: "bg-neutral-500/15 text-neutral-400 border border-neutral-500/30",
};

export default function ContestPrepPage() {
  const { data: session } = useSession();
  const [configOpen, setConfigOpen] = useState(false);

  const { data: entries = [] } = useSWR<PrepEntry[]>(
    "/api/prep/entries",
    fetcher
  );

  const { data: config, mutate: mutateConfig } = useSWR<PrepConfig | null>(
    "/api/prep/config",
    fetcher
  );

  // Sort entries chronologically for charts (API returns desc)
  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );

  const latest = sorted[sorted.length - 1];
  const earliest = sorted[0];

  // Weight chart data with 7-day moving average
  const chartData = useMemo(() => {
    const weights = sorted.map((e) => e.weight);
    const ma = movingAverage(weights, 7);
    return sorted.map((e, i) => ({
      date: e.date.slice(5), // "MM-DD"
      weight: e.weight,
      trend: ma[i] !== null ? Math.round(ma[i]! * 10) / 10 : null,
    }));
  }, [sorted]);

  // Stats
  const daysOut = config?.showDate
    ? daysBetween(new Date().toISOString().split("T")[0], config.showDate)
    : null;

  const weightChange =
    earliest?.weight && latest?.weight
      ? Math.round((latest.weight - earliest.weight) * 10) / 10
      : null;

  return (
    <div>
      <ModuleHeader
        title="Contest Prep"
        subtitle="Weight tracking, macros & phase management"
        action={
          session?.user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfigOpen(true)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          )
        }
      />

      {entries.length === 0 ? (
        <Card className="text-center py-12">
          <Dumbbell className="w-10 h-10 text-muted mx-auto mb-3" />
          <h2 className="text-lg font-medium mb-1">No Data Yet</h2>
          <p className="text-sm text-muted max-w-sm mx-auto">
            Import your prep data using the import script:
          </p>
          <code className="block text-xs text-accent mt-3 bg-white/[0.03] rounded-lg p-3 max-w-md mx-auto">
            npx tsx scripts/import-prep-data.ts path/to/ytd_2026.html
          </code>
        </Card>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Current Weight"
              value={latest?.weight ?? "—"}
              unit="lbs"
              icon={<Scale className="w-4 h-4 text-accent" />}
              color="text-accent"
              subtext={
                weightChange !== null
                  ? `${weightChange > 0 ? "+" : ""}${weightChange} lbs total`
                  : undefined
              }
            />
            {daysOut !== null && daysOut > 0 ? (
              <StatCard
                label="Days Out"
                value={daysOut}
                unit="days"
                icon={<Calendar className="w-4 h-4 text-warning" />}
                color="text-warning"
                subtext={config?.showName || undefined}
              />
            ) : (
              <StatCard
                label="Days Tracked"
                value={sorted.length}
                unit="days"
                icon={<Calendar className="w-4 h-4 text-warning" />}
                color="text-warning"
              />
            )}
            <StatCard
              label="Latest Steps"
              value={latest?.steps?.toLocaleString() ?? "—"}
              icon={<Footprints className="w-4 h-4 text-green-400" />}
              color="text-green-400"
            />
            <StatCard
              label="Latest Calories"
              value={latest?.calories?.toLocaleString() ?? "—"}
              unit="cal"
              icon={<Flame className="w-4 h-4 text-orange-400" />}
              color="text-orange-400"
            />
          </div>

          {/* Weight Trend Chart */}
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-medium">Weight Trend</h3>
              <span className="text-xs text-muted ml-auto">
                7-day moving average
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#888", fontSize: 11 }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tick={{ fill: "#888", fontSize: 11 }}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#555"
                    strokeWidth={1}
                    dot={{ r: 2, fill: "#555" }}
                    name="Scale"
                  />
                  <Line
                    type="monotone"
                    dataKey="trend"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={false}
                    name="Trend"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Entries Table */}
          <Card>
            <h3 className="text-sm font-medium mb-4">Daily Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="text-left py-2 px-2 font-medium">Date</th>
                    <th className="text-left py-2 px-2 font-medium">Type</th>
                    <th className="text-right py-2 px-2 font-medium">Weight</th>
                    <th className="text-right py-2 px-2 font-medium">Cal</th>
                    <th className="text-right py-2 px-2 font-medium">P</th>
                    <th className="text-right py-2 px-2 font-medium">F</th>
                    <th className="text-right py-2 px-2 font-medium">C</th>
                    <th className="text-right py-2 px-2 font-medium">Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-border/50 hover:bg-white/[0.02]"
                    >
                      <td className="py-2 px-2 text-muted">
                        {formatDateShort(entry.date)}
                      </td>
                      <td className="py-2 px-2">
                        {entry.workout ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              workoutColors[entry.workout] || workoutColors.Rest
                            }`}
                          >
                            {entry.workout}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        {entry.weight ?? "—"}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {entry.calories?.toLocaleString() ?? "—"}
                      </td>
                      <td className="py-2 px-2 text-right text-blue-400">
                        {entry.protein ?? "—"}
                      </td>
                      <td className="py-2 px-2 text-right text-yellow-400">
                        {entry.fat ?? "—"}
                      </td>
                      <td className="py-2 px-2 text-right text-orange-400">
                        {entry.carbs ?? "—"}
                      </td>
                      <td className="py-2 px-2 text-right text-muted">
                        {entry.steps?.toLocaleString() ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Config Modal */}
      <ConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        config={config}
        onSave={async (data) => {
          await fetch("/api/prep/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          mutateConfig();
          setConfigOpen(false);
        }}
      />
    </div>
  );
}

function ConfigModal({
  open,
  onClose,
  config,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  config: PrepConfig | null | undefined;
  onSave: (data: Partial<PrepConfig>) => Promise<void>;
}) {
  const [showName, setShowName] = useState(config?.showName || "");
  const [showDate, setShowDate] = useState(config?.showDate || "");
  const [targetWeight, setTargetWeight] = useState(
    config?.targetWeight?.toString() || ""
  );
  const [startWeight, setStartWeight] = useState(
    config?.startWeight?.toString() || ""
  );
  const [saving, setSaving] = useState(false);

  // Sync state when config loads
  useEffect(() => {
    if (config) {
      setShowName(config.showName || "");
      setShowDate(config.showDate || "");
      setTargetWeight(config.targetWeight?.toString() || "");
      setStartWeight(config.startWeight?.toString() || "");
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      showName: showName || null,
      showDate: showDate || null,
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
      startWeight: startWeight ? parseFloat(startWeight) : null,
    });
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Prep Settings">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-muted mb-1">Show Name</label>
          <input
            type="text"
            value={showName}
            onChange={(e) => setShowName(e.target.value)}
            placeholder="e.g. OCB Natural Bodybuilding"
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Show Date</label>
          <input
            type="date"
            value={showDate}
            onChange={(e) => setShowDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-border text-sm text-foreground focus:outline-none focus:border-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">
              Start Weight (lbs)
            </label>
            <input
              type="number"
              step="0.1"
              value={startWeight}
              onChange={(e) => setStartWeight(e.target.value)}
              placeholder="e.g. 160"
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              Target Weight (lbs)
            </label>
            <input
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="e.g. 145"
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
