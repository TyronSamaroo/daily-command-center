# Daily Command Center - Build Log

## Overview

**Project**: Daily Command Center
**Author**: Tyron Samaroo
**Start Date**: February 2026
**Deployment**: https://daily-command-center-rho.vercel.app
**Repository**: https://github.com/TyronSamaroo/daily-command-center

A unified productivity dashboard replacing 6+ disconnected tools (Google Keep, spreadsheets, phone timers, etc.) into one cohesive application. Built as both a personal tool and a portfolio piece.

---

## Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Foundation + Work Block Tracker | Complete |
| 2 | Contest Prep Snapshot (port from `ocb-debut-dashboard`) | Not started |
| 3 | Household Coordination (port from `smart-chore-scheduler`) | Not started |
| 4 | Google Calendar integration + Morning Dashboard | Not started |
| 5 | Weekly Retro + Polish | Not started |

Plan reference: `~/.claude/plans/shimmying-hugging-cosmos.md`

---

## Phase 1: Foundation + Work Block Tracker

### Commit History

| # | Hash | Description |
|---|------|-------------|
| 1 | `6a71565` | Initial commit from Create Next App |
| 2 | `9850263` | feat: Phase 1 - Daily Command Center foundation + Work Block Tracker |
| 3 | `6fd76bb` | fix: use getUserId in [id]/route.ts to fix 500 error on Vercel |
| 4 | `22a89d3` | feat: add Google OAuth sign-in and owner/guest mode |
| 5 | `e63ef39` | fix: wrap auth() in try-catch for graceful guest handling on Vercel |
| 6 | `d0ff4cd` | fix: add error handling to work-blocks GET for Vercel debugging |
| 7 | `27ae734` | debug: return actual error message in work-blocks API |
| 8 | `22a124d` | fix: hide internal error details from API response |
| 9 | `0cb4c65` | fix: add trustHost and error handling for NextAuth on Vercel |
| 10 | `b167948` | fix: switch to JWT session strategy for reliable serverless auth |
| 11 | `3326f6d` | fix: use compound primary key for accounts table |

---

## What Was Built

### Core Infrastructure
- **Next.js 16** app with App Router, TypeScript, Tailwind CSS v4
- **Turso** (libSQL) hosted database on AWS us-east-1
- **Drizzle ORM** with 15 database tables covering all planned modules
- **NextAuth v5** (beta.30) with Google OAuth and JWT sessions
- **Vercel** deployment with environment variable management
- Dark theme UI with mobile-first responsive design

### Work Block Tracker Module
- **45-minute focus timer** with circular SVG progress ring
- **Start/Stop/Cancel** controls with time remaining display
- **Block logging** - saves completed blocks to Turso with date, start/end time, duration
- **Block history** with per-day grouping and delete capability
- **Work streak tracking** - consecutive days with completed blocks

### Auth & Access System
- **Google OAuth sign-in** via NextAuth v5
- **Owner mode** - authenticated user has full CRUD access
- **Guest mode** - unauthenticated visitors see read-only dashboard
- **Demo mode** - auto-creates demo user when OAuth not configured (local dev)
- **Sign-in/Sign-out UI** in sidebar with user info display

### Dashboard
- Personalized greeting with user's first name
- Quick stat cards (Streak, Blocks Today, Calendar, Week Progress)
- Module navigation cards linking to each section
- Guest sign-in prompt banner

### Database Schema (15 Tables)
- `users`, `accounts`, `sessions` - NextAuth authentication
- `work_blocks`, `work_streaks` - Work Block Tracker
- `prep_entries`, `prep_phases`, `prep_config` - Contest Prep (schema ready)
- `household_tasks`, `partner_schedules`, `your_schedules` - Household (schema ready)
- `day_notes`, `completed_tasks`, `laundry_log` - Household support
- `app_config` - Key-value store for user settings

---

## Problems Encountered & Solutions

### Problem 1: API 500 Error on Vercel (Critical)

**Symptom**: After deploying Phase 1, the Work Blocks page showed no data. The `/api/work-blocks` endpoint returned 500 errors on Vercel even though it worked locally.

**Root Cause**: `src/app/api/work-blocks/[id]/route.ts` imported `auth` directly from `@/lib/auth`:
```typescript
// BROKEN - crashes when OAuth isn't configured
import { auth } from "@/lib/auth";
```

Since `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` weren't set on Vercel yet, NextAuth tried to initialize without credentials and crashed.

**Fix**: Switched to the `getUserId()` helper which gracefully handles missing OAuth:
```typescript
// FIXED - falls back to demo mode when OAuth isn't configured
import { getUserId } from "@/lib/auth-helpers";
```

**Lesson**: Always use the auth-helpers abstraction layer instead of importing `auth` directly. The helpers handle demo mode, missing credentials, and error cases.

---

### Problem 2: TURSO_AUTH_TOKEN Trailing Newline

**Symptom**: After fixing Problem 1, the API *still* returned 500. The error was: `Failed query: select ... from "users" limit ?` - Turso authentication was failing.

**Root Cause**: When adding `TURSO_AUTH_TOKEN` to Vercel via `echo`, a trailing `\n` (newline character) was appended to the token value. Turso's auth rejected the token with the invisible trailing whitespace.

**Fix**: Removed and re-added the env var using `printf` which doesn't append a newline:
```bash
vercel env rm TURSO_AUTH_TOKEN production
printf 'eyJhbGci...' | vercel env add TURSO_AUTH_TOKEN production
```

**Lesson**: Always use `printf` instead of `echo` when piping secrets into environment variables. `echo` adds `\n` which can silently break auth tokens.

---

### Problem 3: NextAuth "To confirm your identity" Error

**Symptom**: After configuring Google OAuth credentials, clicking "Sign in with Google" showed a page saying "To confirm your identity, sign in with the same account you used originally."

**Root Cause**: Stale session cookies from demo mode (before OAuth was configured) caused a CSRF/session mismatch. NextAuth thought there was an existing session but the session data didn't match the new OAuth configuration.

**Fix**: Clear all cookies for the site domain in the browser, then try signing in again.

**Lesson**: When switching auth strategies (demo mode -> OAuth, database sessions -> JWT), stale cookies can cause confusing errors. Clear cookies after auth config changes.

---

### Problem 4: NextAuth `Configuration` Error

**Symptom**: Sign-in redirected to `/api/auth/error?error=Configuration` instead of completing the OAuth flow.

**Root Cause**: Multiple missing configuration items for NextAuth v5 on Vercel:
1. Missing `trustHost: true` in NextAuth config (required for reverse proxies like Vercel)
2. Missing `AUTH_SECRET` env var (NextAuth v5 prefers `AUTH_SECRET` over `NEXTAUTH_SECRET`)
3. `AUTH_URL` was set to `http://localhost:3000` instead of the Vercel URL

**Fix**:
1. Added `trustHost: true` to NextAuth config:
   ```typescript
   export const { handlers, auth, signIn, signOut } = NextAuth({
     trustHost: true,
     // ...
   });
   ```
2. Added Vercel env vars:
   - `AUTH_SECRET` = same value as `NEXTAUTH_SECRET`
   - `AUTH_URL` = `https://daily-command-center-rho.vercel.app`
   - `AUTH_TRUST_HOST` = `true`

**Lesson**: NextAuth v5 has specific environment variable requirements for serverless deployments. It prefers `AUTH_SECRET` over `NEXTAUTH_SECRET` and needs `trustHost: true` on Vercel/Cloudflare/etc.

---

### Problem 5: `OAuthAccountNotLinked` Error

**Symptom**: Sign-in redirected to `/api/auth/signin?error=OAuthAccountNotLinked`.

**Root Cause**: A previous failed sign-in attempt created a user record in Turso (with email `tyronsamaroo828@gmail.com`) but didn't create the corresponding `accounts` table entry. When the next sign-in attempt succeeded at Google's end, NextAuth found the existing user by email but had no linked account, and refused to auto-link for security reasons.

**Fix**: Deleted the orphaned user record from Turso:
```sql
DELETE FROM users WHERE email = 'tyronsamaroo828@gmail.com';
```

**Lesson**: Failed OAuth flows can leave orphaned records in the database. When debugging `OAuthAccountNotLinked`, check for user records that don't have matching account records. In a single-user app, it's safe to delete the orphan and retry.

---

### Problem 6: `SQLITE_CONSTRAINT` on Accounts Insert (Most Complex)

**Symptom**: Sign-in failed with `AdapterError: Write error` in Vercel logs. Full error:
```
SQLITE_CONSTRAINT: Failed query: insert into "accounts"
("id", "userId", "type", "provider", ...) values (null, ?, ?, ?, ...)
```

**Root Cause**: The `accounts` table schema had:
```typescript
// BROKEN - DrizzleAdapter doesn't provide an id value
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),  // <-- DrizzleAdapter inserts NULL here
  userId: text("userId").notNull(),
  // ...
});
```

The DrizzleAdapter for NextAuth doesn't use a separate `id` column for the accounts table. It expects a compound primary key of `(provider, providerAccountId)`. When it tried to insert with `id = null`, SQLite's NOT NULL constraint on the primary key rejected it.

**Fix**:
1. Updated the schema to use a compound primary key:
   ```typescript
   export const accounts = sqliteTable("accounts", {
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
   }, (table) => [
     primaryKey({ columns: [table.provider, table.providerAccountId] }),
   ]);
   ```

2. Dropped and recreated the table in Turso:
   ```sql
   DROP TABLE accounts;
   CREATE TABLE accounts (
     userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     type TEXT NOT NULL,
     provider TEXT NOT NULL,
     providerAccountId TEXT NOT NULL,
     access_token TEXT,
     refresh_token TEXT,
     expires_at INTEGER,
     token_type TEXT,
     scope TEXT,
     id_token TEXT,
     session_state TEXT,
     PRIMARY KEY (provider, providerAccountId)
   );
   ```

3. Cleaned up orphaned user from previous failed attempts.

**Lesson**: NextAuth's DrizzleAdapter has specific schema requirements that differ from typical auto-generated schemas. The accounts table MUST use `(provider, providerAccountId)` as its primary key, not a separate `id` column. Always reference the DrizzleAdapter documentation for the exact expected schema.

---

### Problem 7: Database Sessions Failing on Serverless

**Symptom**: Auth callbacks were inconsistent. Sessions weren't persisting correctly between requests on Vercel.

**Root Cause**: Database session strategy requires a round-trip to Turso on every authenticated request. On Vercel's serverless functions, this added latency and occasional timeouts. The session callback signature also differed between strategies: database sessions pass `{ session, user }` while JWT sessions pass `{ session, token }`.

**Fix**: Switched to JWT session strategy:
```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = user.id; }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

JWT stores the session in an encrypted cookie, eliminating the database round-trip on every request.

**Lesson**: For serverless deployments with external databases (Turso, PlanetScale, etc.), JWT sessions are more reliable than database sessions. The tradeoff is that JWTs can't be revoked server-side, but for a single-user app this is acceptable.

---

### Problem 8: `auth()` Crashing for Unauthenticated Requests

**Symptom**: API GET requests from unauthenticated visitors (guests) returned 500 instead of guest data.

**Root Cause**: `getUserId()` called `auth()` which could throw when NextAuth initialization had issues or when the request had no session at all.

**Fix**: Wrapped the `auth()` call in a try-catch:
```typescript
export async function getUserId(): Promise<string | null> {
  if (isDemoMode()) { /* demo mode logic */ }
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    return null; // Treat as guest
  }
}
```

**Lesson**: In a guest-accessible app, auth failures should degrade gracefully to guest mode, not crash the request. Always wrap auth calls in try-catch when unauthenticated access is a valid state.

---

## Vercel Environment Variables

| Variable | Purpose |
|----------|---------|
| `TURSO_DATABASE_URL` | Turso database connection URL |
| `TURSO_AUTH_TOKEN` | Turso auth token (set with `printf`, not `echo`) |
| `NEXTAUTH_SECRET` | Session encryption secret |
| `AUTH_SECRET` | Same as NEXTAUTH_SECRET (NextAuth v5 prefers this name) |
| `AUTH_URL` | `https://daily-command-center-rho.vercel.app` |
| `AUTH_TRUST_HOST` | `true` (for Vercel reverse proxy) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js | 16.1.6 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Database | Turso (libSQL) | - |
| ORM | Drizzle ORM | 0.45.1 |
| Auth | NextAuth.js | 5.0.0-beta.30 |
| Auth Adapter | @auth/drizzle-adapter | 1.11.1 |
| Data Fetching | SWR | 2.4.1 |
| Charts | Recharts | 3.7.0 |
| Icons | Lucide React | 0.575.0 |
| Hosting | Vercel | - |

---

## File Structure (27 source files)

```
src/
  app/
    layout.tsx              # Root layout with AuthProvider, Sidebar, BottomNav
    page.tsx                # Dashboard with greeting, stats, module links
    providers.tsx           # SessionProvider wrapper
    globals.css             # Tailwind v4 + custom theme tokens
    work-blocks/
      page.tsx              # Work Block Tracker page
    contest-prep/
      page.tsx              # Contest Prep placeholder
    household/
      page.tsx              # Household placeholder
    weekly-retro/
      page.tsx              # Weekly Retro placeholder
    api/
      auth/[...nextauth]/
        route.ts            # NextAuth route handler with error handling
      work-blocks/
        route.ts            # GET/POST/PUT work blocks
        [id]/route.ts       # DELETE work block by ID
  components/
    layout/
      Sidebar.tsx           # Desktop sidebar with auth UI
      BottomNav.tsx         # Mobile bottom navigation
      ModuleHeader.tsx      # Page header component
    ui/
      Card.tsx              # Card + StatCard components
    work-blocks/
      Timer.tsx             # 45-min circular timer with readOnly mode
      BlockLog.tsx          # Block history list with readOnly mode
  hooks/
    useTimer.ts             # Timer state management hook
  lib/
    auth.ts                 # NextAuth v5 config (JWT, Google, DrizzleAdapter)
    auth-helpers.ts         # getUserId, getOwnerUserId, getAccessLevel, isDemoMode
    db/
      index.ts              # Drizzle + Turso client init
      schema.ts             # 15 table definitions
    utils/
      dates.ts              # Date formatting utilities
      calculations.ts       # Streak calculation logic
  types/
    work-blocks.ts          # TypeScript types for work block data
```

---

## Weekly Highlights

### Week of March 23, 2026

- Added project planning and architecture docs in [PR #7](https://github.com/TyronSamaroo/daily-command-center/pull/7), including the build log, PRD, and system design documents.
- Refreshed the repository overview in [`README.md`](https://github.com/TyronSamaroo/daily-command-center/blob/main/README.md) and added the demo GIF used in the project docs.

### Key Links

- [PR #7: chore/add-docs](https://github.com/TyronSamaroo/daily-command-center/pull/7)
- [Commit `98e4b74`: add demo GIF and rewrite README with project overview](https://github.com/TyronSamaroo/daily-command-center/commit/98e4b74868f3416d3cb8f7fc56ef741618329792)
