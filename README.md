# 🏋️‍♀️ My 4-Week Badass Workout Plan

A personal fitness Progressive Web App (PWA) built to track a 4-week strength and cardio programme. Installable on iPhone, syncs across devices via Supabase.

## What it does

- **7-day weekly plan** — runs, glutes, arms/shoulders, Pilates/core, full body, hot yoga, rest
- **Session detail view** — exercises with sets, reps, and YouTube deep links
- **Session completion tracking** — tick sessions done, saved to Supabase
- **Duration logging** — logs actual minutes trained per session
- **Active minutes bar** — tracks weekly progress toward the 150-min WHO recommendation
- **Weight recording** — prompted on your first session of each week, shown with delta vs previous week
- **Week progress rings** — visual completion per week
- **4-week progressive structure** — Weeks 1–3 build intensity, Week 4 is a mandatory deload

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | React + Vite |
| Styling | Inline styles (dark theme) |
| Database | Supabase (PostgreSQL) |
| Hosting | Netlify |
| PWA | Vite PWA plugin |

## Supabase tables

```sql
-- Session completions
CREATE TABLE workout_completions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  day             text NOT NULL,
  week_index      int NOT NULL,
  duration_minutes int,
  completed_at    timestamptz DEFAULT now()
);

-- Weekly weight log
CREATE TABLE weekly_weights (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week_index  int NOT NULL,
  weight_kg   numeric(5,2) NOT NULL,
  logged_at   timestamptz DEFAULT now()
);

-- Uploaded training plans (future feature)
CREATE TABLE plan_data (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_json   jsonb NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);
```

## Run locally

```bash
# Install dependencies
npm install

# Create a .env file with your Supabase credentials
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start dev server
npm run dev
```

App runs at `http://localhost:5174`

## Deploy to Netlify

```bash
# Build and deploy to production
netlify deploy --build --prod
```

Netlify environment variables needed:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Install on iPhone

1. Open the Netlify URL in **Safari**
2. Tap the **Share** icon → **Add to Home Screen**
3. The app opens full screen with no browser bar

## Project structure

```
lily-workout/
├── src/
│   └── workout_tracker_v4.jsx   # Main app (all-in-one component)
├── public/
│   └── icons/                   # PWA icons
├── index.html
├── vite.config.js
└── .env                         # Supabase credentials (not committed)
```
