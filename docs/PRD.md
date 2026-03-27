# Daily Command Center - Product Requirements Document

## 1. Product Overview

### Vision
Replace 6+ disconnected productivity tools with a single, unified dashboard that tracks work sessions, contest prep, household coordination, and weekly reflection — all in one place.

### Problem Statement
Currently, daily productivity tracking is spread across:
- **Google Keep** for notes and checklists
- **Spreadsheets** for contest prep macros and weight tracking
- **Phone timer** for work focus sessions
- **Text messages** for partner schedule coordination
- **Mental tracking** for household chores and laundry cycles
- **No system** for weekly reflection and progress review

This fragmentation leads to missed data, inconsistent tracking, and no way to see the big picture of daily productivity.

### Solution
A mobile-first web app that consolidates all daily tracking into themed modules, with a morning dashboard providing an at-a-glance summary of the day ahead.

### Target User
- **Primary**: Tyron (single-user app, self-hosted)
- **Secondary**: Portfolio reviewers and interviewers (read-only guest mode)

### Success Metrics
- Timer used daily for work blocks (tracked via streak)
- Contest prep data entered consistently (no gaps in weight/macro tracking)
- Household tasks checked off daily
- Weekly retro completed each Sunday

---

## 2. Modules

### Module 1: Morning Dashboard (Home Page)

**Purpose**: At-a-glance summary of the day.

**Requirements**:
- [x] Personalized greeting with user's first name and current date
- [x] Quick stat cards: streak, blocks today, calendar, week progress
- [x] Module navigation cards with icons and descriptions
- [x] Guest sign-in prompt for unauthenticated visitors
- [ ] Live data in stat cards (currently hardcoded to 0)
- [ ] Google Calendar event preview for today
- [ ] Today's household tasks summary

---

### Module 2: Work Block Tracker

**Purpose**: 45-minute Pomodoro-style focus sprints with history and streaks.

**Requirements**:
- [x] Circular SVG progress ring timer (45 minutes)
- [x] Start, Stop, Cancel controls
- [x] Save completed blocks to database (date, start/end time, duration)
- [x] Block history list grouped by date
- [x] Delete blocks from history
- [x] Streak tracking (consecutive days with at least one block)
- [x] Read-only mode for guests
- [ ] Custom timer duration (configurable)
- [ ] Block labels/tags (e.g., "coding", "writing", "studying")
- [ ] Daily block count on dashboard stat card
- [ ] Sync completed blocks to Google Calendar (optional)
- [ ] Sound/notification when timer completes

---

### Module 3: Contest Prep Snapshot

**Purpose**: Track bodybuilding competition prep data — weight, macros, training, and phases.

**Requirements**:
- [ ] Daily entry form:
  - Morning weight, Night weight
  - Steps, Calories, Active energy
  - Protein, Fat, Carbs (grams)
  - Workout description (free text)
  - Cardio (minutes)
- [ ] Weight trend chart (line graph with 7-day moving average)
- [ ] Phase timeline:
  - Phase types: cut, maintain, peak, show, reverse
  - Phase name, start/end dates, rate, calorie targets, notes
- [ ] Show countdown (days until show date)
- [ ] Show configuration (show name, target weight, start weight)
- [ ] Week-over-week comparison (this week avg vs last week avg)
- [ ] Database schema: **READY** (prep_entries, prep_phases, prep_config tables exist)

---

### Module 4: Household Coordination

**Purpose**: Track household tasks, partner schedules, and daily coordination.

**Requirements**:
- [ ] Task management:
  - Create recurring tasks (daily, weekly, weekday, laundry-special, one-time)
  - Check off completed tasks per day
  - Task preferred time (morning, afternoon, evening, flexible)
- [ ] Partner schedule:
  - Working yes/no per day
  - Leave time, Home time
  - OT flag with type (early/late)
  - Work type (regular-shift, etc.)
- [ ] Your schedule:
  - Working yes/no per day
  - Start/end times
- [ ] Calendar view (week or month)
- [ ] Day notes (free text per day)
- [ ] Laundry cycle tracker (log dates, show days since last)
- [ ] Database schema: **READY** (all household tables exist)

---

### Module 5: Weekly Retro

**Purpose**: End-of-week reflection aggregating data from all modules.

**Requirements**:
- [ ] Work block summary:
  - Total blocks this week
  - Average blocks per day
  - Completion rate vs. goal
  - Streak status
- [ ] Contest prep summary:
  - Weight change this week
  - Average daily calories/macros
  - Training consistency
- [ ] Household summary:
  - Task completion rate
  - Most skipped tasks
- [ ] Free-text reflection area
- [ ] Week-over-week trend charts
- [ ] Historical retro archive

---

## 3. Cross-Cutting Features

### Authentication & Access

| Feature | Status |
|---------|--------|
| Google OAuth sign-in | [x] Implemented |
| JWT session management | [x] Implemented |
| Owner mode (full CRUD) | [x] Implemented |
| Guest mode (read-only) | [x] Implemented |
| Demo mode (local dev) | [x] Implemented |
| Sign-in/Sign-out UI | [x] Implemented |

### Google Calendar Integration

| Feature | Status |
|---------|--------|
| OAuth scope for calendar.readonly | [x] Authorized |
| Fetch today's events | [ ] Not started |
| Display on dashboard | [ ] Not started |
| Sync work blocks to calendar | [ ] Not started |

### UI/UX

| Feature | Status |
|---------|--------|
| Dark theme | [x] Implemented |
| Mobile-first responsive design | [x] Implemented |
| Desktop sidebar navigation | [x] Implemented |
| Mobile bottom tab navigation | [x] Implemented |
| Module header component | [x] Implemented |
| Card/StatCard components | [x] Implemented |

---

## 4. Technical Constraints

- **Single-user**: No multi-tenancy. All data belongs to one user. Guest mode is read-only view of owner's data.
- **Serverless**: Deployed on Vercel. No persistent server process. Each API call is a cold/warm function invocation.
- **SQLite**: Turso (hosted libSQL). No stored procedures, limited concurrent writes (acceptable for single-user).
- **Free tier**: Vercel free, Turso free, Google Cloud free. Zero hosting cost.
- **NextAuth v5 beta**: Using pre-release version of NextAuth. May have breaking changes before stable release.

---

## 5. Implementation Phases

### Phase 1: Foundation + Work Blocks **[COMPLETE]**
- Next.js 16 scaffold with Tailwind CSS v4
- Turso database with full schema (15 tables)
- NextAuth v5 with Google OAuth
- Work Block Tracker (timer, history, streaks)
- Owner/Guest access model
- Vercel deployment

### Phase 2: Contest Prep
- Daily entry form with all tracking fields
- Weight trend chart (Recharts)
- Phase management (create, edit, view timeline)
- Show countdown and config

### Phase 3: Household
- Task CRUD with frequency patterns
- Partner and personal schedule management
- Calendar view
- Task completion tracking
- Laundry cycle tracking

### Phase 4: Calendar Integration
- Google Calendar API integration
- Today's events on dashboard
- Optional work block -> calendar sync

### Phase 5: Weekly Retro
- Data aggregation from all modules
- Summary charts and stats
- Free-text reflection
- Historical archive

---

## 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load time | < 2 seconds |
| API response time | < 500ms |
| Mobile usability | Fully functional on 375px width |
| Uptime | Best-effort (Vercel free tier) |
| Data durability | Turso with automated backups |
| Browser support | Modern browsers (Chrome, Safari, Firefox) |
| Accessibility | Semantic HTML, keyboard navigable |
