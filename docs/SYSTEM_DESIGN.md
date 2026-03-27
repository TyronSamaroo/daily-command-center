# Daily Command Center - System Design Document

## 1. System Overview

Daily Command Center is a single-user productivity dashboard that consolidates multiple daily tracking tools into one unified web application. It's deployed as a serverless application on Vercel with a hosted SQLite database on Turso.

### Design Goals
- **Single-user, self-hosted** - Built for one person (Tyron) with optional read-only guest access
- **Mobile-first** - Primary usage is from a phone; desktop is secondary
- **Fast and offline-tolerant** - SWR caching, JWT sessions, minimal round-trips
- **Modular** - Each life area (work, fitness, household) is an independent module
- **Portfolio-ready** - Clean code, real deployment, demonstrates full-stack capability

---

## 2. Architecture

```
                    +------------------+
                    |    Vercel CDN    |
                    |  (Edge Network)  |
                    +--------+---------+
                             |
                    +--------v---------+
                    |   Next.js 16     |
                    |   App Router     |
                    |                  |
                    |  +------------+  |
                    |  | React SSR  |  |     +------------------+
                    |  | + Client   |  |     |  Google OAuth    |
                    |  | Components |  +----->  (NextAuth v5)   |
                    |  +------------+  |     +------------------+
                    |                  |
                    |  +------------+  |     +------------------+
                    |  | API Routes |  +----->  Turso (libSQL)  |
                    |  | (Serverless|  |     |  AWS us-east-1   |
                    |  |  Functions)|  |     +------------------+
                    |  +------------+  |
                    +------------------+
                             |
                    +--------v---------+
                    | Google Calendar  |
                    | API (readonly)   |
                    +------------------+
```

### Layer Breakdown

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **CDN/Edge** | Vercel Edge Network | Static assets, global distribution |
| **Frontend** | React 19 + Next.js 16 | UI rendering, client-side state, SWR caching |
| **API** | Next.js Route Handlers | REST endpoints, auth checks, business logic |
| **Auth** | NextAuth v5 (JWT) | Google OAuth, session management |
| **ORM** | Drizzle ORM | Type-safe queries, schema management |
| **Database** | Turso (libSQL) | Persistent storage, hosted SQLite |
| **External** | Google Calendar API | Read-only calendar data |

---

## 3. Authentication & Authorization

### Auth Flow

```
User clicks "Sign in with Google"
    |
    v
NextAuth redirects to Google OAuth consent screen
    |
    v
Google returns auth code to /api/auth/callback/google
    |
    v
NextAuth exchanges code for tokens, creates/updates user in Turso
    |
    v
JWT cookie set in browser (encrypted, httpOnly)
    |
    v
Subsequent requests: JWT decoded server-side via auth()
```

### Access Levels

| Level | Condition | Permissions |
|-------|-----------|-------------|
| **Owner** | Valid JWT session with user ID | Full CRUD on all data |
| **Guest** | No session (unauthenticated visitor) | Read-only access to owner's data |
| **Demo** | OAuth not configured (local dev) | Full CRUD via auto-created demo user |

### Auth Decision Tree (API Routes)

```
Request arrives at API route
    |
    v
Is OAuth configured? (GOOGLE_CLIENT_ID exists?)
    |
    +-- No --> Demo mode: return demo user ID
    |
    +-- Yes --> Call auth() to check JWT session
                    |
                    +-- Session exists --> Owner: return user ID
                    |
                    +-- No session --> Is this a GET request?
                                        |
                                        +-- Yes --> Guest: use getOwnerUserId()
                                        |
                                        +-- No --> Return 401 Unauthorized
```

### Key Design Decisions

1. **JWT over Database Sessions**: Serverless functions on Vercel are stateless. JWT eliminates a database round-trip on every request. Tradeoff: can't revoke sessions server-side, acceptable for single-user.

2. **Dynamic Auth Import**: `auth()` is imported dynamically in `getUserId()` to prevent crashes when OAuth credentials aren't configured:
   ```typescript
   const { auth } = await import("@/lib/auth");
   ```

3. **DrizzleAdapter with Compound Primary Key**: The `accounts` table uses `(provider, providerAccountId)` as its primary key because the DrizzleAdapter doesn't generate an `id` value.

---

## 4. Database Design

### Engine: Turso (libSQL)

- **Why Turso**: Hosted SQLite with HTTP API, free tier, low-latency from Vercel serverless functions, no connection pooling needed (unlike Postgres).
- **Region**: AWS us-east-1 (matches Vercel's default)
- **Connection**: HTTP via `@libsql/client`, with auth token

### Schema Overview (15 Tables)

```
┌─────────────────────────────────────────────┐
│                   AUTH                        │
│  ┌────────┐  ┌──────────┐  ┌──────────┐     │
│  │ users  │──│ accounts │  │ sessions │     │
│  └───┬────┘  └──────────┘  └──────────┘     │
│      │                                       │
├──────┼───────────────────────────────────────┤
│      │         WORK BLOCKS                   │
│      ├──┌─────────────┐                      │
│      │  │ work_blocks │                      │
│      ├──┌──────────────┐                     │
│      │  │ work_streaks │                     │
│      │                                       │
├──────┼───────────────────────────────────────┤
│      │         CONTEST PREP                  │
│      ├──┌──────────────┐                     │
│      │  │ prep_entries │                     │
│      ├──┌─────────────┐                      │
│      │  │ prep_phases │                      │
│      ├──┌─────────────┐                      │
│      │  │ prep_config │                      │
│      │                                       │
├──────┼───────────────────────────────────────┤
│      │         HOUSEHOLD                     │
│      ├──┌──────────────────┐                 │
│      │  │ household_tasks  │                 │
│      ├──┌───────────────────┐                │
│      │  │ partner_schedules │                │
│      ├──┌────────────────┐                   │
│      │  │ your_schedules │                   │
│      ├──┌───────────┐                        │
│      │  │ day_notes │                        │
│      ├──┌──────────────────┐                 │
│      │  │ completed_tasks  │                 │
│      ├──┌──────────────┐                     │
│      │  │ laundry_log  │                     │
│      │                                       │
├──────┼───────────────────────────────────────┤
│      │         CONFIG                        │
│      └──┌────────────┐                       │
│         │ app_config │                       │
└─────────────────────────────────────────────┘
```

### Table Details

#### Auth Tables

**users**
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| name | TEXT | |
| email | TEXT | UNIQUE |
| emailVerified | INTEGER | timestamp mode |
| image | TEXT | |

**accounts**
| Column | Type | Constraints |
|--------|------|-------------|
| userId | TEXT | NOT NULL, FK -> users.id (CASCADE) |
| type | TEXT | NOT NULL |
| provider | TEXT | NOT NULL |
| providerAccountId | TEXT | NOT NULL |
| access_token | TEXT | |
| refresh_token | TEXT | |
| expires_at | INTEGER | |
| token_type | TEXT | |
| scope | TEXT | |
| id_token | TEXT | |
| session_state | TEXT | |
| | | PK: (provider, providerAccountId) |

**sessions**
| Column | Type | Constraints |
|--------|------|-------------|
| sessionToken | TEXT | PRIMARY KEY |
| userId | TEXT | NOT NULL, FK -> users.id (CASCADE) |
| expires | INTEGER | NOT NULL, timestamp mode |

#### Work Block Tables

**work_blocks**
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| user_id | TEXT | NOT NULL, FK -> users.id |
| date | TEXT | NOT NULL (YYYY-MM-DD) |
| start_time | TEXT | NOT NULL (ISO 8601) |
| end_time | TEXT | |
| duration_min | INTEGER | |
| label | TEXT | |
| synced_to_cal | INTEGER | BOOLEAN, DEFAULT false |

**work_streaks**
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| user_id | TEXT | UNIQUE, NOT NULL, FK -> users.id |
| current_streak | INTEGER | DEFAULT 0 |
| longest_streak | INTEGER | DEFAULT 0 |
| last_block_date | TEXT | |

#### Contest Prep Tables

**prep_entries** - Daily tracking (one row per user per day)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | PK AUTOINCREMENT |
| user_id | TEXT | FK -> users.id |
| date | TEXT | UNIQUE with user_id |
| weight | REAL | Morning weight |
| night_weight | REAL | Evening weight |
| steps | INTEGER | Daily step count |
| calories | INTEGER | Total calories |
| active_energy | INTEGER | Active calories burned |
| protein | INTEGER | Grams |
| fat | INTEGER | Grams |
| carbs | INTEGER | Grams |
| workout | TEXT | Workout description |
| cardio | INTEGER | Minutes of cardio |

**prep_phases** - Contest prep phases (cut, maintain, peak, show, reverse)
**prep_config** - Show date, target weight, start weight

#### Household Tables

**household_tasks** - Recurring task definitions (daily, weekly, weekday, laundry-special, one-time)
**partner_schedules** - Partner's work schedule per day (working, leave/home times, OT)
**your_schedules** - User's own schedule per day
**day_notes** - Free-text notes per day
**completed_tasks** - Task completion tracking per day
**laundry_log** - Laundry completion dates

#### Config Table

**app_config** - Generic key-value store per user for settings

### Indexing Strategy

Unique composite indexes on frequently queried combinations:
- `prep_entries_user_date` on (userId, date)
- `partner_schedules_user_date` on (userId, date)
- `your_schedules_user_date` on (userId, date)
- `day_notes_user_date` on (userId, date)
- `completed_tasks_user_date_task` on (userId, date, taskId)
- `laundry_log_user_date` on (userId, date)
- `app_config_user_key` on (userId, key)

---

## 5. API Design

### REST Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/work-blocks` | Guest OK | List blocks (optional `?date=YYYY-MM-DD`) |
| POST | `/api/work-blocks` | Owner | Create a new block |
| PUT | `/api/work-blocks` | Owner | Update block (end time, duration) + streak |
| DELETE | `/api/work-blocks/[id]` | Owner | Delete a block |

### Request/Response Pattern

All API routes follow this pattern:
```typescript
export async function POST(req: NextRequest) {
  // 1. Auth check
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  const body = await req.json();

  // 3. Database operation
  const result = await db.insert(table).values({ userId, ...body });

  // 4. Return response
  return NextResponse.json(result);
}
```

### Guest Access Pattern (GET endpoints)

```typescript
export async function GET(req: NextRequest) {
  try {
    // Try authenticated user first, fall back to owner's data for guests
    const userId = (await getUserId()) || (await getOwnerUserId());
    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }
    // ... fetch and return data
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## 6. Frontend Architecture

### Rendering Strategy

| Route | Strategy | Reason |
|-------|----------|--------|
| `/` (Dashboard) | Client-side | Uses `useSession`, dynamic greeting |
| `/work-blocks` | Client-side | Real-time timer, SWR data fetching |
| `/contest-prep` | Client-side (planned) | Interactive forms, charts |
| `/household` | Client-side (planned) | Interactive schedule editing |
| `/weekly-retro` | Client-side (planned) | Data aggregation, charts |

### Data Fetching with SWR

```typescript
const { data: blocks, mutate } = useSWR<WorkBlock[]>(
  `/api/work-blocks?date=${dateKey}`,
  fetcher,
  { refreshInterval: 0 }
);
```

- **Cache-first**: SWR returns cached data instantly, revalidates in background
- **Optimistic updates**: `mutate()` called after mutations for instant UI feedback
- **No polling**: `refreshInterval: 0` since data only changes via user action

### Component Hierarchy

```
layout.tsx
├── AuthProvider (SessionProvider)
├── Sidebar (desktop: sign-in/out, navigation)
├── BottomNav (mobile: tab navigation)
└── {children}
    ├── page.tsx (Dashboard)
    │   ├── ModuleHeader
    │   ├── StatCard x4
    │   └── Module links x4
    └── work-blocks/page.tsx
        ├── ModuleHeader
        ├── Timer (readOnly for guests)
        │   └── useTimer hook
        └── BlockLog (readOnly for guests)
```

### Styling System

- **Tailwind CSS v4** with CSS-based config (`@theme inline`)
- **Custom theme tokens** defined in `globals.css`:
  - `--color-bg`, `--color-surface`, `--color-foreground`
  - `--color-accent` (blue), `--color-warning` (amber), `--color-danger` (red)
  - `--color-border`, `--color-muted`
- **Dark theme only** (no light mode toggle)
- **Responsive breakpoints**: Mobile-first, `md:` for tablet/desktop

---

## 7. Deployment Architecture

### Vercel Configuration

- **Framework**: Next.js (auto-detected)
- **Build**: `next build` (default)
- **Region**: Default (US East)
- **Environment Variables**: 8 variables configured (see Build Log)

### CI/CD Flow

```
git push to main
    |
    v
Vercel auto-deploys
    |
    v
Build: next build (serverless functions bundled)
    |
    v
Deploy: static assets to CDN, functions to Lambda
    |
    v
Live at https://daily-command-center-rho.vercel.app
```

### Infrastructure

| Service | Tier | Purpose |
|---------|------|---------|
| Vercel | Free/Hobby | Hosting, CDN, serverless |
| Turso | Free | Database (500 databases, 9GB storage) |
| Google Cloud | Free | OAuth credentials, Calendar API |
| GitHub | Free | Source control |

---

## 8. Security Considerations

1. **JWT Sessions**: Encrypted, httpOnly cookies. Can't be read by client-side JavaScript.
2. **CSRF Protection**: NextAuth handles CSRF tokens automatically.
3. **SQL Injection**: Drizzle ORM uses parameterized queries exclusively.
4. **Environment Variables**: Secrets stored in Vercel env vars, never in code.
5. **Guest Access**: Read-only. All write operations require authenticated session.
6. **OAuth Scopes**: Minimal scopes requested (`openid email profile calendar.readonly`).
7. **Cascade Deletes**: Accounts and sessions cascade on user deletion.

---

## 9. Future Architecture (Planned Modules)

### Phase 2: Contest Prep Module
- Daily entry form (weight, macros, steps, workout, cardio)
- Weight trend chart (Recharts line graph with 7-day moving average)
- Phase timeline visualization
- Show countdown

### Phase 3: Household Module
- Partner schedule calendar view
- Task management with recurring patterns
- Laundry cycle tracking
- Day notes

### Phase 4: Google Calendar Integration
- Read events via Google Calendar API (scope already authorized)
- Display today's events on dashboard
- Sync work blocks to calendar (optional)

### Phase 5: Weekly Retro
- Aggregate data from all modules
- Work block completion rate
- Weight trend vs. targets
- Household task completion rate
- Insights and suggestions
