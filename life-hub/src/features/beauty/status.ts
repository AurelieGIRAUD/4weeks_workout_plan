import { addDays } from 'date-fns'
import { daysBetween, fromISODate, toISODate } from '@/lib/dates'
import type { TreatmentStatus } from '@/lib/types'

export type DueKind = 'paused' | 'new' | 'overdue' | 'due' | 'soon' | 'snoozed' | 'ok'

export interface DueInfo {
  kind: DueKind
  /** Days since the last log, or null if never done. */
  daysSince: number | null
  /** The date it is due (interval + snooze applied), or null if never done. */
  dueOn: string | null
  /** Days until due; negative when overdue. */
  dueIn: number | null
  /** 0..1 progress through the interval (1 = due). */
  progress: number
}

export const SOON_DAYS = 2

export function dueInfo(t: Pick<TreatmentStatus, 'active' | 'last_done' | 'interval_days' | 'snoozed_until'>, today: string): DueInfo {
  if (!t.last_done) return { kind: t.active ? 'new' : 'paused', daysSince: null, dueOn: null, dueIn: null, progress: 0 }

  const daysSince = daysBetween(t.last_done, today)
  const nextDue = toISODate(addDays(fromISODate(t.last_done), t.interval_days))
  const dueOn = t.snoozed_until && t.snoozed_until > nextDue ? t.snoozed_until : nextDue
  const dueIn = daysBetween(today, dueOn)
  const progress = Math.max(0, Math.min(1, daysSince / t.interval_days))

  let kind: DueKind
  if (!t.active) kind = 'paused'
  else if (t.snoozed_until && t.snoozed_until > today && nextDue <= today) kind = 'snoozed'
  else if (dueIn < 0) kind = 'overdue'
  else if (dueIn === 0) kind = 'due'
  else if (dueIn <= SOON_DAYS) kind = 'soon'
  else kind = 'ok'

  return { kind, daysSince, dueOn, dueIn, progress }
}

export function dueLabel(info: DueInfo): string {
  switch (info.kind) {
    case 'new':
      return 'Not started yet'
    case 'paused':
      return 'Paused'
    case 'overdue':
      return `Overdue by ${-info.dueIn!} day${info.dueIn === -1 ? '' : 's'}`
    case 'due':
      return 'Due today'
    case 'snoozed':
      return `Snoozed, due in ${info.dueIn} day${info.dueIn === 1 ? '' : 's'}`
    default:
      return info.dueIn === 1 ? 'Due tomorrow' : `Due in ${info.dueIn} days`
  }
}

export function sinceLabel(info: DueInfo): string {
  if (info.daysSince === null) return 'Never done'
  if (info.daysSince === 0) return 'Done today'
  if (info.daysSince === 1) return 'Done yesterday'
  return `${info.daysSince} days since last`
}

const ORDER: Record<DueKind, number> = { overdue: 0, due: 1, soon: 2, snoozed: 3, ok: 4, new: 5, paused: 6 }

export function sortByUrgency<T extends Parameters<typeof dueInfo>[0] & { name: string }>(items: T[], today: string): T[] {
  return [...items].sort((a, b) => {
    const da = dueInfo(a, today)
    const db = dueInfo(b, today)
    return ORDER[da.kind] - ORDER[db.kind] || (da.dueIn ?? 0) - (db.dueIn ?? 0) || a.name.localeCompare(b.name)
  })
}
