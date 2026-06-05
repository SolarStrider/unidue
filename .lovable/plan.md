# Studiq — Final Build Plan (approved direction)

Confirmed: enable Lovable Cloud and use the managed Google provider. All previously "out of scope" items are in.

## Stack
- TanStack Start + React + Tailwind, Lucide icons, Sora (Google Fonts)
- Lovable Cloud (Postgres + Auth + server functions + pg_cron)
- `canvas-confetti`, `date-fns`, `web-push`
- Service worker at `public/sw.js` for push

## Routes
```
/auth                              login + signup (email/password + Google)
/reset-password                    password reset landing
/_authenticated/route.tsx          integration-managed gate (ssr: false)
/_authenticated/index.tsx          Dashboard
/_authenticated/assignments.tsx
/_authenticated/calendar.tsx
/_authenticated/grades.tsx
/_authenticated/pomodoro.tsx
/_authenticated/settings.tsx
/api/public/cron/daily-reminders   web-push sender (HMAC-protected)
```

## Database (one migration, RLS + grants on every table)
- `profiles` (id=auth user, name, theme, date_format, grading_system) — auto-created via `on_auth_user_created` trigger
- `assignments` (user_id, title, subject, type, due_date, priority, notes, status, completed_at)
- `daily_goals` (user_id, text, done, date)
- `grades` (user_id, subject, assignment, grade_value, grading_system)
- `streaks` (user_id PK, last_completion_date, count)
- `push_subscriptions` (user_id, endpoint UNIQUE, p256dh, auth)

RLS policies: `auth.uid() = user_id` on all rows. Grants to `authenticated` + `service_role`.

## Auth
- Email/password via Supabase Auth (with HIBP leaked-password check enabled).
- Google via Lovable broker: `lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin })`. I'll call `configure_social_auth` for Google in the same step.
- Reset password flow with `/reset-password` page.

## Server functions / routes
- Most reads/writes go through the browser Supabase client under RLS.
- `savePushSubscription` / `deletePushSubscription` as `createServerFn` with `requireSupabaseAuth`.
- `/api/public/cron/daily-reminders` (POST, HMAC-verified) queries assignments due in next 24h, sends web-push via VAPID, prunes 410/404 endpoints. Triggered by pg_cron daily at 08:00 UTC.

## Secrets needed
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`
- I'll generate the VAPID keypair and request these via the secrets prompt after Cloud is enabled.

## Features (per your spec, unchanged)
Dashboard (stats, streak, progress, upcoming, daily goals, workload banner), Assignments (CRUD, filters, countdown badge, confetti, Google Calendar link, priority left-border), Calendar (month grid), Grades (7 grading systems), Pomodoro (presets 25/5, 50/10, 90/15, browser notification on end, technique blurb), Settings (5 themes incl. Light, date format, grading system, account info, sign out, SolarStrider footer).

## Design tokens (`src/styles.css`)
- Sora font; default dark Midnight theme (`--background: #0f0f1a`, `--primary: #6c63ff`).
- Themes as `[data-theme="midnight|ocean|forest|sunset|light"]` overrides.
- Shadcn components for Buttons/Cards/Dialog/Select/Tabs/Progress/Sidebar/Sonner.

## Build order
1. Enable Lovable Cloud + configure Google provider + enable HIBP.
2. Migration: tables, RLS, grants, profile trigger, pg_cron job.
3. Request VAPID + CRON_SECRET secrets.
4. Theme system + Sora + global shell (sidebar/hamburger) + Sonner.
5. Auth pages (`/auth`, `/reset-password`) + `_authenticated` layout.
6. Assignments + Dashboard + Calendar.
7. Grades + Pomodoro + Settings.
8. Service worker + push subscribe toggle in Settings + cron endpoint.
9. Responsive QA + theme QA.

Approve this plan and I'll start with step 1.