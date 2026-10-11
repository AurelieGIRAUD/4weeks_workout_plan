import { addDays, addWeeks } from 'date-fns'
import { daysBetween, fromISODate, toISODate, weekDays, weekStart } from '@/lib/dates'
import { BODY_PARTS, TRAINING_TYPES, type BodyPart, type TrainingType, type Workout } from '@/lib/types'

/** WHO guideline for adults: at least 150 minutes of moderate activity per week. */
export const WEEKLY_GOAL_MIN = 150

export interface WeekSummary {
  days: string[]
  minutesByDay: number[]
  totalMinutes: number
  sessions: number
  activeDays: number
}

export function summarizeWeek(workouts: Workout[], start: Date): WeekSummary {
  const days = weekDays(start)
  const minutesByDay = days.map((d) => workouts.filter((w) => w.date === d).reduce((s, w) => s + w.duration_min, 0))
  const inWeek = workouts.filter((w) => w.date >= days[0] && w.date <= days[6])
  return {
    days,
    minutesByDay,
    totalMinutes: minutesByDay.reduce((a, b) => a + b, 0),
    sessions: inWeek.length,
    activeDays: minutesByDay.filter((m) => m > 0).length,
  }
}

export interface WeekTrendPoint {
  weekStart: string
  minutes: number
  sessions: number
}

/** `count` weeks ending with the week that starts on `lastWeekStart`. */
export function weeklyTrend(workouts: Workout[], lastWeekStart: Date, count: number): WeekTrendPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const start = addWeeks(lastWeekStart, i - count + 1)
    const s = summarizeWeek(workouts, start)
    return { weekStart: toISODate(start), minutes: s.totalMinutes, sessions: s.sessions }
  })
}

export function bodyPartCounts(workouts: Workout[]): { key: BodyPart; count: number }[] {
  return BODY_PARTS.map((key) => ({ key, count: workouts.filter((w) => w.body_parts.includes(key)).length }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
}

export function typeSplit(workouts: Workout[]): { key: TrainingType; minutes: number; sessions: number }[] {
  return TRAINING_TYPES.map((key) => {
    const of = workouts.filter((w) => w.training_type === key)
    return { key, minutes: of.reduce((s, w) => s + w.duration_min, 0), sessions: of.length }
  })
    .filter((r) => r.sessions > 0)
    .sort((a, b) => b.minutes - a.minutes)
}

export interface Streaks {
  /** Consecutive active days ending today (or yesterday, so today isn't "lost" before you train). */
  currentDays: number
  longestDays: number
  /** Consecutive weeks with at least one session, counting this week only once it has one. */
  currentWeeks: number
}

export function streaks(workouts: Workout[], today: string): Streaks {
  const dates = [...new Set(workouts.map((w) => w.date))].filter((d) => d <= today).sort()
  const set = new Set(dates)

  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const d of dates) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = d
  }

  let current = 0
  let cursor = set.has(today) ? fromISODate(today) : addDays(fromISODate(today), -1)
  while (set.has(toISODate(cursor))) {
    current++
    cursor = addDays(cursor, -1)
  }

  const weeks = new Set(dates.map((d) => toISODate(weekStart(fromISODate(d)))))
  let currentWeeks = 0
  let wk = weekStart(fromISODate(today))
  if (!weeks.has(toISODate(wk))) wk = addWeeks(wk, -1)
  while (weeks.has(toISODate(wk))) {
    currentWeeks++
    wk = addWeeks(wk, -1)
  }

  return { currentDays: current, longestDays: longest, currentWeeks }
}
