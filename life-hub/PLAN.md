# Life Hub — Plan

A personal management PWA (iPhone, iPad, desktop) for lists, workouts and beauty care.

## 1. Architecture

```
┌──────────────────────────── Browser / installed PWA ────────────────────────────┐
│ React 19 + TS + Vite + Tailwind v4 + Recharts                                  │
│  ├─ React Router (Home, Lists, Workouts, Beauty, Settings)                      │
│  ├─ TanStack Query  ── persisted to localStorage  → offline read               │
│  ├─ Supabase JS     ── auth (magic link + 6-digit code), REST, Realtime        │
│  └─ Service worker (Workbox, injectManifest)                                    │
│       precache app shell · push handler · notification actions                 │
└────────────────────────────────────────────────────────────────────────────────┘
                 │ HTTPS (RLS-scoped JWT)                ▲ Web Push (VAPID)
                 ▼                                       │
┌─────────────────────────────────── Supabase ───────────────────────────────────┐
│ Postgres + RLS on every table · Realtime publication for shared lists          │
│ RPCs: share_list · register_push_subscription (security definer)               │
│ Edge Functions:                                                                 │
│   send-reminders  (pg_cron, hourly) → finds due treatments → web-push          │
│   reminder-action (called by the SW) → "done" / "snooze" with signed token     │
│   push-test       (signed-in user)   → test notification to all devices        │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Why these choices**

| Decision | Reason |
|---|---|
| Vite SPA (not Next.js) | Static hosting on Vercel/Netlify, simplest PWA story, no SSR needed behind auth. |
| TanStack Query + persister | Caching, optimistic updates, and offline read in one place. Mutations pause while offline and resume when back online. |
| `injectManifest` service worker | Lets us write our own `push` and `notificationclick` handlers, which the generated SW can't do. |
| Signed action tokens for notifications | The SW has no user session. A short-lived HMAC token in the push payload lets "Done" and "Snooze" work straight from the notification. |
| Magic link **and** 6-digit code | On iOS an installed PWA does not share storage with Safari, so a magic link opened from Mail logs in *Safari*, not the PWA. Typing the code inside the PWA avoids that. |

## 2. Data model (summary — full SQL in `supabase/migrations`)

| Table | Purpose | Access |
|---|---|---|
| `profiles` | email, display name, timezone, reminder hour, plus `ai_prefs` for later | own row; co-members of a shared list can read name/email |
| `lists` | a list of a given `type` (want_to_buy, need_to_buy, chores, todo, ideas) | owner + members (read); owner (write) |
| `list_members` | who a list is shared with | owner manages; a member can leave |
| `list_invites` | pending shares for emails that have no account yet | owner; converted to membership on signup |
| `list_items` | title, done, category, tags[], note, archived_at, `ai_*` | owner + members |
| `workouts` | date, body_parts[], training_type, duration_min, notes, `ai_*` | private |
| `treatments` | name, emoji, interval_days, snoozed_until, last_notified_on | private |
| `treatment_logs` | done_on, note | private |
| `treatment_status` (view) | last_done, next_due, days_since, is_due (`security_invoker`) | private |
| `push_subscriptions` | Web Push endpoints per device | private |
| `ai_insights` | future: weekly summaries, suggestions (`kind`, `period`, `content jsonb`, `model`) | private |

Every user gets one default list per type when they sign up. Quick-add routes there.

**AI-ready, no AI in v1:** `list_items.ai_suggested_category`, `ai_meta jsonb`; `workouts.ai_meta jsonb`; an `ai_insights` table; `profiles.ai_prefs jsonb`. A later Edge Function can fill these without changing the schema.

## 3. Quick-add grammar

```
buy: running shoes #sport @clothes
└┬─┘ └─────┬─────┘ └─┬──┘ └──┬───┘
prefix    title     tag   category
```

| Prefix | List |
|---|---|
| `buy:` `need:` `shop:` | Need to Buy |
| `want:` `wish:` | Want to Buy |
| `chore:` `clean:` `home:` | Chores |
| `todo:` `do:` | To-Do |
| `idea:` `trip:` `travel:` | Ideas (`trip:` and `travel:` also add the tag `travel`) |

With no prefix, the selected chip decides (default: To-Do). The parser is a pure function with unit tests.

## 4. Push reminders flow

1. In Settings, the user enables notifications. The browser subscribes with the VAPID public key and we upsert into `push_subscriptions`.
2. `pg_cron` calls `send-reminders` every hour. For each user whose *local* hour equals `reminder_hour`, it finds treatments where `next_due <= today`, `snoozed_until` is null or past, and `last_notified_on <> today`.
3. The payload carries `{title, body, treatment_id, token}`. The token is `HMAC(user_id|treatment_id|exp)`.
4. The SW shows the notification with **Done** and **Snooze 1 day** actions. Tapping an action makes the SW POST to `reminder-action`, which verifies the token and writes the log or the snooze.
5. iOS does not show notification action buttons. Tapping the notification opens `/beauty?treatment=<id>`, where a sheet offers Done and Snooze.
6. Expired endpoints (404/410) are deleted.

## 5. Milestones

| # | Milestone | Contents |
|---|---|---|
| 0 | Plan + schema | This doc, SQL migration with RLS, SQL tests for RLS against local Postgres |
| 1 | Auth + Lists | App shell, theming, magic link and OTP, Lists module, quick-add, Home cards |
| 2 | Workouts | Log sheet, week navigation, stats and charts, streaks |
| 3 | Beauty + Push | Treatments, logs, due logic, SW push, Edge Functions, cron SQL |
| 4 | Sharing | Share dialog, invites, realtime subscriptions, member avatars |
| 5 | PWA polish | Manifest and icons, offline banner, persisted cache, export JSON/CSV, README |

## 6. Out of scope for v1 / later

- AI summaries and categorization (schema is ready)
- Drag-to-reorder (a `position` column exists)
- Sharing workouts or beauty care (deliberately private)
