import { format } from 'date-fns'
import { Dumbbell, Flame, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProgressRing } from '@/components/ProgressRing'
import { Card, cx } from '@/components/ui'
import { fromISODate, todayISO, weekStart } from '@/lib/dates'
import { TRAINING_META } from '@/lib/meta'
import { useRecentWorkouts } from '../workouts/api'
import { streaks, summarizeWeek, WEEKLY_GOAL_MIN } from '../workouts/stats'

export function WorkoutWeekCard() {
  const { data = [] } = useRecentWorkouts()
  const today = todayISO()
  const summary = summarizeWeek(data, weekStart(fromISODate(today)))
  const s = streaks(data, today)

  return (
    <Card aria-labelledby="week-title">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Dumbbell className="size-5" aria-hidden />
        </span>
        <h2 id="week-title" className="flex-1 text-lg font-extrabold">
          This week's workouts
        </h2>
        <Link
          to="/workouts?log=1"
          className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95"
        >
          <Plus className="size-4" aria-hidden /> Log today
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <ProgressRing value={summary.totalMinutes} max={WEEKLY_GOAL_MIN} size={84} label="Weekly minutes vs 150 minute goal">
          <span>
            <span className="block text-lg font-extrabold leading-none">{summary.totalMinutes}</span>
            <span className="text-[10px] font-semibold text-muted">/ {WEEKLY_GOAL_MIN} min</span>
          </span>
        </ProgressRing>
        <dl className="grid flex-1 grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted">Sessions</dt>
            <dd className="text-xl font-extrabold">{summary.sessions}</dd>
          </div>
          <div>
            <dt className="text-muted">Streak</dt>
            <dd className="flex items-center gap-1 text-xl font-extrabold">
              <Flame className={cx('size-5', s.currentDays ? 'text-orange-500' : 'text-muted')} aria-hidden />
              {s.currentDays}d
            </dd>
          </div>
        </dl>
      </div>

      <ol className="mt-4 grid grid-cols-7 gap-1" aria-label="Days this week">
        {summary.days.map((d, i) => {
          const w = data.find((x) => x.date === d)
          return (
            <li key={d} className="flex flex-col items-center gap-1">
              <span
                className={cx(
                  'grid size-9 place-items-center rounded-full text-base',
                  w ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-card-2',
                  d === today && 'ring-2 ring-emerald-400',
                )}
                title={w ? `${summary.minutesByDay[i]} min` : 'Rest'}
              >
                {w ? <span aria-label={TRAINING_META[w.training_type].label}>{TRAINING_META[w.training_type].emoji}</span> : ''}
              </span>
              <span className="text-[11px] font-bold text-muted">{format(fromISODate(d), 'EEEEE')}</span>
            </li>
          )
        })}
      </ol>
      <Link to="/workouts" className="mt-3 inline-block text-sm font-bold text-emerald-600 dark:text-emerald-300">
        Stats & history →
      </Link>
    </Card>
  )
}
