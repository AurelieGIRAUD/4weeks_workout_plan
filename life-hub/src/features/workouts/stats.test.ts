import { describe, expect, it } from 'vitest'
import { fromISODate } from '@/lib/dates'
import type { Workout } from '@/lib/types'
import { bodyPartCounts, streaks, summarizeWeek, typeSplit, weeklyTrend } from './stats'

let n = 0
const w = (date: string, p: Partial<Workout> = {}): Workout => ({
  id: String(n++),
  user_id: 'u',
  date,
  training_type: 'strength',
  body_parts: [],
  duration_min: 30,
  notes: null,
  created_at: date,
  ...p,
})

// 2026-09-28 is a Monday.
const MON = fromISODate('2026-09-28')

describe('summarizeWeek', () => {
  it('sums minutes per day and counts sessions', () => {
    const s = summarizeWeek(
      [w('2026-09-28', { duration_min: 45 }), w('2026-09-28', { duration_min: 15 }), w('2026-10-04'), w('2026-10-05')],
      MON,
    )
    expect(s.days[0]).toBe('2026-09-28')
    expect(s.days[6]).toBe('2026-10-04')
    expect(s.minutesByDay).toEqual([60, 0, 0, 0, 0, 0, 30])
    expect(s.totalMinutes).toBe(90)
    expect(s.sessions).toBe(3)
    expect(s.activeDays).toBe(2)
  })
})

describe('weeklyTrend', () => {
  it('returns weeks oldest first, ending with the given week', () => {
    const t = weeklyTrend([w('2026-09-22'), w('2026-09-30'), w('2026-10-01')], MON, 3)
    expect(t.map((p) => p.weekStart)).toEqual(['2026-09-14', '2026-09-21', '2026-09-28'])
    expect(t.map((p) => p.sessions)).toEqual([0, 1, 2])
  })
})

describe('bodyPartCounts / typeSplit', () => {
  it('counts and sorts', () => {
    const ws = [
      w('2026-09-28', { body_parts: ['glutes', 'legs'], training_type: 'strength', duration_min: 40 }),
      w('2026-09-29', { body_parts: ['glutes'], training_type: 'yoga', duration_min: 60 }),
    ]
    expect(bodyPartCounts(ws)).toEqual([
      { key: 'glutes', count: 2 },
      { key: 'legs', count: 1 },
    ])
    expect(typeSplit(ws).map((r) => r.key)).toEqual(['yoga', 'strength'])
  })
})

describe('streaks', () => {
  it('counts a current streak that ended yesterday', () => {
    const s = streaks([w('2026-10-01'), w('2026-10-02'), w('2026-10-03')], '2026-10-04')
    expect(s.currentDays).toBe(3)
    expect(s.longestDays).toBe(3)
  })
  it('breaks on a gap and tracks the longest run', () => {
    const s = streaks([w('2026-09-20'), w('2026-09-21'), w('2026-09-22'), w('2026-09-23'), w('2026-10-04')], '2026-10-04')
    expect(s.currentDays).toBe(1)
    expect(s.longestDays).toBe(4)
  })
  it('counts week streaks', () => {
    const s = streaks([w('2026-09-15'), w('2026-09-22'), w('2026-09-29')], '2026-10-04')
    expect(s.currentWeeks).toBe(3)
    expect(streaks([w('2026-09-15'), w('2026-09-29')], '2026-10-04').currentWeeks).toBe(1)
  })
  it('ignores future-dated sessions', () => {
    expect(streaks([w('2026-10-05')], '2026-10-04')).toEqual({ currentDays: 0, longestDays: 0, currentWeeks: 0 })
  })
})
