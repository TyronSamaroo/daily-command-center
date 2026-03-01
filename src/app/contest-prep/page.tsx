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
  Plus,
  Trash2,
} from "lucide-react";
import type { PrepEntry, PrepConfig } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const workoutColors: Record<string, string> = {
  Push: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  Pull: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  Legs: "bg-green-500/15 text-green-400 border border-green-500/30",
  Rest: "bg-neutral-500/15 text-neutral-400 border border-neutral-500/30",
};

const workoutTypes = ["Push", "Pull", "Legs", "Rest"] as const;

const workoutBadgeColors: Record<string, string> = {
  Push: "bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30",
  Pull: "bg-purple-500/20 text-purple-400 border-purple-500/40 hover:bg-purple-500/30",
  Legs: "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30",
  Rest: "bg-neutral-500/20 text-neutral-400 border-neutral-500/40 hover:bg-neutral-500/30",
};

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ContestPrepPage() {
  const { data: session } = useSession();
  const [configOpen, setConfigOpen] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PrepEntry | null>(null);

  const { data: entries = [], mutate: mutateEntries } = useSWR<PrepEntry[]>(
    "/api/prep/entries",
    fetcher
  );

  const { data: config, mutate: mutateConfig } = useSWR<PrepConfig | null>(
    "/api/prep/config",
    fetcher
  );

  const isOwner = !!session?.user;

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

  const handleAddEntry = () => {
    setEditingEntry(null);
    setEntryModalOpen(true);
  };

  const handleEditEntry = (entry: PrepEntry) => {
    if (!isOwner) return;
    setEditingEntry(entry);
    setEntryModalOpen(true);
  };

  const handleSaveEntry = async (data: Partial<PrepEntry>) => {
    if (editingEntry) {
      await fetch(`/api/prep/entries/${editingEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/prep/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    mutateEntries();
    setEntryModalOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = async (id: number) => {
    await fetch(`/api/prep/entries/${id}`, { method: "DELETE" });
    mutateEntries();
    setEntryModalOpen(false);
    setEditingEntry(null);
  };

  return (
    <div>
      <ModuleHeader
        title="Contest Prep"
        subtitle="Weight tracking, macros & phase management"
        action={
          isOwner && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfigOpen(true)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          )
        }
      />

      {entries.length === 0 ? (
        <Card className="text-center py-12">
          <Dumbbell className="w-10 h-10 text-muted mx-auto mb-3" />
          <h2 className="text-lg font-medium mb-1">No Data Yet</h2>
          <p className="text-sm text-muted max-w-sm mx-auto mb-4">
            Start logging your daily data or import from a file.
          </p>
          {isOwner && (
            <Button size="sm" onClick={handleAddEntry}>
              <Plus className="w-4 h-4" />
              Add First Entry
            </Button>
          )}
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
          <Card className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h3 className="text-sm font-medium">Daily Log</h3>
              {isOwner && (
                <Button variant="ghost" size="sm" onClick={handleAddEntry}>
                  <Plus className="w-4 h-4" />
                  Add Entry
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="text-left py-2 px-3 font-medium">Date</th>
                    <th className="text-left py-2 px-3 font-medium">Type</th>
                    <th className="text-right py-2 px-3 font-medium">Weight</th>
                    <th className="text-right py-2 px-3 font-medium">Cal</th>
                    <th className="text-right py-2 px-3 font-medium">P</th>
                    <th className="text-right py-2 px-3 font-medium">F</th>
                    <th className="text-right py-2 px-3 font-medium">C</th>
                    <th className="text-right py-2 px-3 font-medium">Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-border/50 hover:bg-white/[0.03] ${
                        isOwner ? "cursor-pointer" : ""
                      }`}
                      onClick={() => handleEditEntry(entry)}
                    >
                      <td className="py-2 px-3 text-muted">
                        {formatDateShort(entry.date)}
                      </td>
                      <td className="py-2 px-3">
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
                      <td className="py-2 px-3 text-right font-medium">
                        {entry.weight ?? "—"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {entry.calories?.toLocaleString() ?? "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-blue-400">
                        {entry.protein ?? "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-yellow-400">
                        {entry.fat ?? "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-orange-400">
                        {entry.carbs ?? "—"}
                      </td>
                      <td className="py-2 px-3 text-right text-muted">
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

      {/* Entry Modal (Add / Edit) */}
      <EntryModal
        open={entryModalOpen}
        onClose={() => {
          setEntryModalOpen(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
        onSave={handleSaveEntry}
        onDelete={editingEntry ? () => handleDeleteEntry(editingEntry.id) : undefined}
      />

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

// ─── Entry Modal ─────────────────────────────────────────────────

function EntryModal({
  open,
  onClose,
  entry,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  entry: PrepEntry | null;
  onSave: (data: Partial<PrepEntry>) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const isEdit = !!entry;

  const [date, setDate] = useState(todayStr());
  const [workout, setWorkout] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [steps, setSteps] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset form when entry changes
  useEffect(() => {
    if (entry) {
      setDate(entry.date);
      setWorkout(entry.workout);
      setWeight(entry.weight?.toString() || "");
      setCalories(entry.calories?.toString() || "");
      setProtein(entry.protein?.toString() || "");
      setFat(entry.fat?.toString() || "");
      setCarbs(entry.carbs?.toString() || "");
      setSteps(entry.steps?.toString() || "");
    } else {
      setDate(todayStr());
      setWorkout(null);
      setWeight("");
      setCalories("");
      setProtein("");
      setFat("");
      setCarbs("");
      setSteps("");
    }
    setConfirmDelete(false);
  }, [entry, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    await onSave({
      date,
      workout: workout || null,
      weight: weight ? parseFloat(weight) : null,
      calories: calories ? parseInt(calories, 10) : null,
      protein: protein ? parseInt(protein, 10) : null,
      fat: fat ? parseInt(fat, 10) : null,
      carbs: carbs ? parseInt(carbs, 10) : null,
      steps: steps ? parseInt(steps, 10) : null,
    });
    setSaving(false);
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent tabular-nums";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Entry" : "Add Entry"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <label className="block text-xs text-muted mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        {/* Workout Type */}
        <div>
          <label className="block text-xs text-muted mb-1.5">
            Workout Type
          </label>
          <div className="flex gap-2">
            {workoutTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setWorkout(workout === type ? null : type)
                }
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  workout === type
                    ? workoutBadgeColors[type]
                    : "bg-white/[0.02] border-border/50 text-muted hover:border-border"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-xs text-muted mb-1">Weight (lbs)</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 155.2"
            className={inputClass}
          />
        </div>

        {/* Calories */}
        <div>
          <label className="block text-xs text-muted mb-1">Calories</label>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="e.g. 1800"
            className={inputClass}
          />
        </div>

        {/* Macros Row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-blue-400 mb-1">Protein</label>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="g"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-yellow-400 mb-1">Fat</label>
            <input
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="g"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-orange-400 mb-1">Carbs</label>
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="g"
              className={inputClass}
            />
          </div>
        </div>

        {/* Steps */}
        <div>
          <label className="block text-xs text-muted mb-1">Steps</label>
          <input
            type="number"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="e.g. 10000"
            className={inputClass}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {isEdit && onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-danger">Delete this entry?</span>
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={onDelete}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-danger hover:text-danger"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              )
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving || !date}>
              {saving ? "Saving..." : isEdit ? "Update" : "Add Entry"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ─── Config Modal ────────────────────────────────────────────────

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

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent";

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
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Show Date</label>
          <input
            type="date"
            value={showDate}
            onChange={(e) => setShowDate(e.target.value)}
            className={inputClass}
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
              className={inputClass}
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
              className={inputClass}
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
