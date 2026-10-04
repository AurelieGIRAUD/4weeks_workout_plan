import { Check } from 'lucide-react'
import { cx } from '@/components/ui'
import type { TreatmentStatus } from '@/lib/types'
import { dueInfo, dueLabel, sinceLabel, type DueKind } from './status'

const BADGE: Record<DueKind, string> = {
  overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  due: 'bg-pink-500 text-white',
  soon: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  snoozed: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  new: 'bg-card-2 text-muted',
  paused: 'bg-card-2 text-muted',
}

const BADGE_ICON: Record<DueKind, string> = {
  overdue: '⏰',
  due: '✨',
  soon: '⏳',
  snoozed: '💤',
  ok: '✓',
  new: '•',
  paused: '⏸',
}

export function TreatmentCard({
  t,
  today,
  onOpen,
  onDone,
  compact,
}: {
  t: TreatmentStatus
  today: string
  onOpen: () => void
  onDone: () => void
  compact?: boolean
}) {
  const info = dueInfo(t, today)
  const doneToday = info.daysSince === 0
  return (
    <div
      className={cx(
        'animate-rise flex items-center gap-3 rounded-3xl border border-line bg-card p-3 transition hover:shadow-md',
        (info.kind === 'due' || info.kind === 'overdue') && 'border-pink-300 dark:border-pink-500/40',
        !t.active && 'opacity-60',
      )}
    >
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-pink-100 text-2xl dark:bg-pink-500/15" aria-hidden>
          {t.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{t.name}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className={cx('rounded-full px-2 py-0.5 font-bold', BADGE[info.kind])}>
              <span aria-hidden>{BADGE_ICON[info.kind]}</span> {dueLabel(info)}
            </span>
            {!compact && <span className="text-muted">every {t.interval_days === 1 ? 'day' : `${t.interval_days} days`}</span>}
          </span>
          {!compact && (
            <span className="mt-1.5 flex items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-pink-100 dark:bg-pink-500/15">
                <span
                  className="block h-full rounded-full bg-pink-500 transition-all duration-500"
                  style={{ width: `${Math.round(info.progress * 100)}%` }}
                />
              </span>
              <span className="shrink-0 text-xs text-muted">{sinceLabel(info)}</span>
            </span>
          )}
        </span>
      </button>
      {t.active && (
        <button
          type="button"
          onClick={onDone}
          disabled={doneToday}
          aria-label={doneToday ? `${t.name} done today` : `Mark ${t.name} done today`}
          className={cx(
            'grid size-11 shrink-0 place-items-center rounded-2xl transition active:scale-90',
            doneToday ? 'bg-emerald-500 text-white' : 'bg-pink-100 text-pink-600 hover:bg-pink-500 hover:text-white dark:bg-pink-500/15 dark:text-pink-300',
          )}
        >
          <Check className={cx('size-5', doneToday && 'animate-pop')} strokeWidth={3} aria-hidden />
        </button>
      )}
    </div>
  )
}
