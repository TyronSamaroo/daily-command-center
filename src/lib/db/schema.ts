import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

// === Auth (NextAuth) ===
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  access_token: text("access_token"),
  refresh_token: text("refresh_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// === Work Blocks ===
export const workBlocks = sqliteTable("work_blocks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  durationMin: integer("duration_min"),
  label: text("label"),
  syncedToCal: integer("synced_to_cal", { mode: "boolean" }).default(false),
});

export const workStreaks = sqliteTable("work_streaks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").unique().notNull().references(() => users.id),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastBlockDate: text("last_block_date"),
});

// === Contest Prep ===
export const prepEntries = sqliteTable("prep_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  weight: real("weight"),
  nightWeight: real("night_weight"),
  steps: integer("steps"),
  calories: integer("calories"),
  activeEnergy: integer("active_energy"),
  protein: integer("protein"),
  fat: integer("fat"),
  carbs: integer("carbs"),
  workout: text("workout"),
  cardio: integer("cardio"),
}, (table) => [
  uniqueIndex("prep_entries_user_date").on(table.userId, table.date),
]);

export const prepPhases = sqliteTable("prep_phases", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // cut | maintain | peak | show | reverse
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  rate: real("rate").default(0),
  cals: text("cals"),
  notes: text("notes"),
});

export const prepConfig = sqliteTable("prep_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").unique().notNull().references(() => users.id),
  showDate: text("show_date"),
  showName: text("show_name"),
  targetWeight: real("target_weight"),
  startWeight: real("start_weight"),
});

// === Household ===
export const householdTasks = sqliteTable("household_tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  frequency: text("frequency").notNull(), // daily | weekly | weekday | laundry-special | one-time
  preferredTime: text("preferred_time").default("flexible"),
  specificDate: text("specific_date"),
  createdAt: text("created_at").default("datetime('now')"),
});

export const partnerSchedules = sqliteTable("partner_schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  working: integer("working", { mode: "boolean" }).notNull(),
  leaveTime: text("leave_time"),
  homeTime: text("home_time"),
  ot: integer("ot", { mode: "boolean" }).default(false),
  otType: text("ot_type"),
  workType: text("work_type").default("regular-shift"),
}, (table) => [
  uniqueIndex("partner_schedules_user_date").on(table.userId, table.date),
]);

export const yourSchedules = sqliteTable("your_schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  working: integer("working", { mode: "boolean" }).notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
}, (table) => [
  uniqueIndex("your_schedules_user_date").on(table.userId, table.date),
]);

export const dayNotes = sqliteTable("day_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  note: text("note").notNull(),
}, (table) => [
  uniqueIndex("day_notes_user_date").on(table.userId, table.date),
]);

export const completedTasks = sqliteTable("completed_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  taskId: text("task_id").notNull().references(() => householdTasks.id),
  completed: integer("completed", { mode: "boolean" }).default(true),
}, (table) => [
  uniqueIndex("completed_tasks_user_date_task").on(table.userId, table.date, table.taskId),
]);

export const laundryLog = sqliteTable("laundry_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
}, (table) => [
  uniqueIndex("laundry_log_user_date").on(table.userId, table.date),
]);

// === App Config (key-value) ===
export const appConfig = sqliteTable("app_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  key: text("key").notNull(),
  value: text("value").notNull(),
}, (table) => [
  uniqueIndex("app_config_user_key").on(table.userId, table.key),
]);
