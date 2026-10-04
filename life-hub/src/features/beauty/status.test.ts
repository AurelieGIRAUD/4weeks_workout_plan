import { describe, expect, it } from 'vitest'
import { dueInfo, dueLabel, sortByUrgency } from './status'

const t = (p: Partial<{ active: boolean; last_done: string | null; interval_days: number; snoozed_until: string | null }>) => ({
  active: true,
  last_done: '2026-10-01',
  interval_days: 3,
  snoozed_until: null,
  ...p,
})
const TODAY = '2026-10-04'

describe('dueInfo', () => {
  it('is due on last_done + interval', () => {
    const i = dueInfo(t({}), TODAY)
    expect(i).toMatchObject({ kind: 'due', daysSince: 3, dueOn: '2026-10-04', dueIn: 0, progress: 1 })
    expect(dueLabel(i)).toBe('Due today')
  })
  it('is overdue after that', () => {
    const i = dueInfo(t({ last_done: '2026-09-28' }), TODAY)
    expect(i).toMatchObject({ kind: 'overdue', dueIn: -3 })
    expect(dueLabel(i)).toBe('Overdue by 3 days')
  })
  it('is soon within two days, ok after', () => {
    expect(dueInfo(t({ last_done: '2026-10-03' }), TODAY).kind).toBe('soon')
    expect(dueInfo(t({ last_done: '2026-10-03', interval_days: 7 }), TODAY).kind).toBe('ok')
  })
  it('respects snooze', () => {
    const i = dueInfo(t({ last_done: '2026-09-28', snoozed_until: '2026-10-05' }), TODAY)
    expect(i).toMatchObject({ kind: 'snoozed', dueOn: '2026-10-05', dueIn: 1 })
  })
  it('ignores a snooze that has passed', () => {
    expect(dueInfo(t({ last_done: '2026-09-28', snoozed_until: '2026-10-02' }), TODAY).kind).toBe('overdue')
  })
  it('handles new and paused', () => {
    expect(dueInfo(t({ last_done: null }), TODAY).kind).toBe('new')
    expect(dueInfo(t({ active: false }), TODAY).kind).toBe('paused')
  })
})

describe('sortByUrgency', () => {
  it('puts the most overdue first', () => {
    const items = [
      { ...t({ last_done: '2026-10-03', interval_days: 30 }), name: 'Haircut' },
      { ...t({ last_done: '2026-09-20' }), name: 'Retinol' },
      { ...t({ last_done: '2026-09-30' }), name: 'Peeling' },
      { ...t({ last_done: null }), name: 'Mask' },
    ]
    expect(sortByUrgency(items, TODAY).map((i) => i.name)).toEqual(['Retinol', 'Peeling', 'Haircut', 'Mask'])
  })
})
