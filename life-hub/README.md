# 🌈 Life Hub

A playful personal management PWA for iPhone, iPad and desktop: **lists**, a **workout tracker** and **beauty care reminders**, in one installable app.

- **Home**: one quick-add box (`buy: shoes #sport @clothes`), today's chores, beauty care due soon, and this week's workouts.
- **Lists**: Need to Buy, Want to Buy, Chores, To-Do and Ideas. Items have categories, tags and notes, with filter, search and archive. You can share a list with someone by email, and changes sync live.
- **Workouts**: log date, type, body parts, duration and notes. Weekly stats, a 12-week trend, body-part and type charts, and streaks.
- **Beauty care**: treatments with a repeat interval, a log of each use, days since and next due. Push reminders with **Done** and **Snooze** buttons on the notification.
- **Private by default**, with Row Level Security on every table, plus JSON/CSV export, light and dark mode, and offline read.

See [`PLAN.md`](./PLAN.md) for the architecture and data model.

## Stack

| Layer | Tool |
|---|---|
| UI | React 19, TypeScript, Vite 8, Tailwind CSS v4, Recharts, lucide icons |
| Data | Supabase: Postgres + RLS, Auth (magic link and code), Realtime, Edge Functions |
| State / offline | TanStack Query, cache persisted to `localStorage` |
| PWA | `vite-plugin-pwa` (injectManifest) with a custom service worker for Web Push |

## Project layout

```
life-hub/
├── PLAN.md                      architecture & milestones
├── src/
│   ├── auth/                    magic link + code login, session
│   ├── components/              UI kit (cards, sheets, chips, toast…)
│   ├── features/
│   │   ├── home/                quick-add + dashboard cards
│   │   ├── lists/               lists, items, sharing
│   │   ├── workouts/            log, stats (pure + tested), charts
│   │   ├── beauty/              treatments, due logic (pure + tested)
│   │   └── settings/            profile, reminders, theme, export, install
│   ├── lib/                     supabase client, query cache, push, realtime, quick-add parser
│   └── sw.ts                    service worker (precache, push, notification actions)
├── supabase/
│   ├── migrations/              schema + RLS (one file)
│   ├── functions/               send-reminders, reminder-action, push-test (Deno)
│   ├── setup/schedule_reminders.sql   pg_cron job (run once)
│   └── tests/                   RLS tests that run against plain Postgres
└── scripts/make-icons.sh        regenerates PNG icons from public/favicon.svg
```

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com). Life Hub's tables don't clash with the old workout app's tables, so the same project works.
2. **Apply the schema.** Pick one:
   - CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`
   - Dashboard: paste `supabase/migrations/20261004000000_init.sql` into **SQL Editor** and run it.
3. **Auth → Providers → Email**: make sure it's enabled.
4. **Auth → URL Configuration**: set **Site URL** to your production URL. Under **Redirect URLs**, add `http://localhost:5173` and your production URL.
5. **Auth → Email Templates**: add the code to both the **Magic Link** and **Confirm signup** templates, so people can sign in from an installed iPhone app:
   ```html
   <h2>Sign in to Life Hub</h2>
   <p><a href="{{ .ConfirmationURL }}">Sign in</a></p>
   <p>Or type this code in the app: <strong>{{ .Token }}</strong></p>
   ```
   > Why: on iOS, an app added to the home screen does not share storage with Safari. A magic link opened from Mail would sign in Safari, not the installed app. The code works everywhere.

## 2. Run locally

```bash
cd life-hub
npm install
cp .env.example .env      # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:5173
```

Use the **anon / publishable** key only. The service-role key never goes in the frontend.

## 3. Push reminders (optional, but that's the fun part)

```bash
# 1. VAPID keys for Web Push
npx web-push generate-vapid-keys

# 2. Secrets for the Edge Functions
npx supabase secrets set \
  VAPID_PUBLIC_KEY=<public key> \
  VAPID_PRIVATE_KEY=<private key> \
  VAPID_SUBJECT=mailto:you@example.com \
  REMINDER_TOKEN_SECRET=$(openssl rand -hex 32) \
  CRON_SECRET=$(openssl rand -hex 32)      # note this one, you need it in step 4

# 3. Deploy the functions (supabase/config.toml sets verify_jwt per function)
npx supabase functions deploy send-reminders reminder-action push-test
```

4. Open `supabase/setup/schedule_reminders.sql`, put in your project URL and the `CRON_SECRET`, and run it in the SQL Editor. It schedules `send-reminders` every hour at :05.
5. Add `VITE_VAPID_PUBLIC_KEY=<public key>` to `.env` and to your hosting environment variables.
6. In the app, go to **Settings → Reminders → Turn on notifications**, then **Send test**.

How it works: each hour the function finds treatments that are due in each user's local time zone, once the user's reminder hour has passed. Each one is sent once per day. Tapping **Done** or **Snooze** on the notification calls `reminder-action` with a short-lived signed token, so no login is needed inside the service worker.

> **iPhone and iPad**: Web Push needs iOS/iPadOS 16.4+ and the app installed to the Home Screen. iOS doesn't show action buttons on web notifications, so tapping the notification opens the treatment in the app, where Done and Snooze are one tap away.

## 4. Deploy

Life Hub lives in the `life-hub/` subfolder of this repo, so tell your host to build from there.

### Vercel
1. **Add New → Project**, import the repo.
2. **Root Directory**: `life-hub`. The framework preset (Vite) is detected automatically.
3. **Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`.
4. Deploy. `vercel.json` handles SPA routing and service-worker caching headers.

### Netlify
1. **Add new site → Import an existing project**, pick the repo.
2. **Base directory**: `life-hub`. Build command and publish dir come from `netlify.toml` (`npm run build` → `dist`).
3. Add the same three environment variables, then deploy. `public/_redirects` handles SPA routing.

Afterwards, add the production URL to Supabase **Auth → URL Configuration** (Site URL and Redirect URLs).

## Install on your devices

- **iPhone / iPad**: open the site in Safari → Share → **Add to Home Screen** → open it from the home screen and sign in with the **code** from the email.
- **Android / Chrome / Edge desktop**: use the install icon in the address bar, or **Settings → Install app** in Life Hub.

## Tests & checks

```bash
npm test            # unit tests: quick-add parser, list filters, workout stats, beauty due logic, CSV
npm run typecheck   # app, service worker and config
npm run lint        # oxlint
npm run build

# RLS + schema tests against a throwaway local Postgres (no Docker or Supabase needed)
PGURL=postgres://postgres@localhost/postgres npm run test:db

# Edge Function token tests (Deno; the env var stops Deno picking up the app's package.json)
DENO_NO_PACKAGE_JSON=1 deno test --allow-env supabase/functions/_shared/token.test.ts
```

The SQL tests cover: signup creates a profile and 5 default lists; users only see their own data; sharing by email (existing account → member, unknown email → invite that converts on signup); members can edit items but can't rename, delete or re-share a list; leaving a list; workouts and beauty data stay private; anon sees nothing; reminder functions are service-role only; snooze and done logic.

## Security model (short version)

- RLS is on for **every** table. Private tables (`workouts`, `treatments`, `treatment_logs`, `push_subscriptions`, `ai_insights`) use `user_id = auth.uid()`.
- Lists: the owner and members can read; only the owner can rename, delete or share. Items are editable by anyone on the list. The access checks are `SECURITY DEFINER` helpers (`has_list_access`, `is_list_owner`), so policies don't recurse.
- Sharing goes through `share_list()`, which checks ownership and never exposes other users' emails. Profiles are visible only to people you share a list with.
- Column grants stop users changing their own email, or flipping a list's `owner_id` or `type`.
- Reminder functions (`due_reminders`, `mark_reminded`, `apply_reminder_action`) are executable by `service_role` only.
- Realtime respects RLS, so you only receive changes for lists you can see.

## Ready for AI later (no AI in v1)

- `list_items.ai_suggested_category` and `ai_meta` → smart categorization.
- `workouts.ai_meta` and the `ai_insights` table (`kind`, `period_start/end`, `content jsonb`, `model`) → weekly workout summaries. A future Edge Function can write these with the service role, and users can already read and delete their own.
- `profiles.ai_prefs` → opt-ins and preferences.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Magic link signs in Safari but not the installed app | Use the 6-digit code (and add `{{ .Token }}` to the email templates). |
| "Push notifications aren't available" | iOS: install to the Home Screen first. Elsewhere: check `VITE_VAPID_PUBLIC_KEY` is set at build time. |
| Test push works but no reminders | Check `select * from cron.job_run_details order by start_time desc limit 5;` and the `send-reminders` logs. Make sure the treatment has a "last done" date and **Push reminder** is on. |
| Shared list doesn't update live | Make sure the migration ran fully. It adds `lists`, `list_items` and `list_members` to the `supabase_realtime` publication. |
