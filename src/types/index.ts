// === Work Blocks ===
export interface WorkBlock {
  id: number;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO timestamp
  endTime: string | null;
  durationMin: number | null;
  label: string | null;
  syncedToCal: boolean;
}

export interface WorkStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastBlockDate: string | null;
}

export interface WorkBlockStats {
  blocksToday: number;
  hoursToday: number;
  hoursThisWeek: number;
  currentStreak: number;
  longestStreak: number;
}

// === Contest Prep ===
export interface PrepEntry {
  id: number;
  userId: string;
  date: string;
  weight: number | null;
  nightWeight: number | null;
  steps: number | null;
  calories: number | null;
  activeEnergy: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  workout: string | null;
  cardio: number | null;
}

export interface PrepPhase {
  id: string;
  userId: string;
  name: string;
  type: "cut" | "maintain" | "peak" | "show" | "reverse";
  startDate: string;
  endDate: string;
  rate: number;
  cals: string | null;
  notes: string | null;
}

export interface PrepConfig {
  userId: string;
  showDate: string | null;
  showName: string | null;
  targetWeight: number | null;
  startWeight: number | null;
}

// === Household ===
export type TaskFrequency = "daily" | "weekly" | "weekday" | "laundry-special" | "one-time";
export type PreferredTime = "morning" | "evening" | "flexible";
export type WorkType = "regular-shift" | "ot" | "remote-ot" | "in-person-ot" | "off";

export interface HouseholdTask {
  id: string;
  userId: string;
  name: string;
  frequency: TaskFrequency;
  preferredTime: PreferredTime;
  specificDate: string | null;
}

export interface PartnerSchedule {
  userId: string;
  date: string;
  working: boolean;
  leaveTime: string | null;
  homeTime: string | null;
  ot: boolean;
  otType: string | null;
  workType: WorkType;
}

export interface YourSchedule {
  userId: string;
  date: string;
  working: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface DayNote {
  userId: string;
  date: string;
  note: string;
}

export interface Suggestion {
  type: "urgent" | "warning" | "tip";
  emoji: string;
  text: string;
}

// === App Config ===
export interface AppConfig {
  userId: string;
  key: string;
  value: string; // JSON string
}

// === Calendar ===
export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  htmlLink?: string;
  description?: string;
}

// === Navigation ===
export interface NavItem {
  label: string;
  href: string;
  icon: string;
}
