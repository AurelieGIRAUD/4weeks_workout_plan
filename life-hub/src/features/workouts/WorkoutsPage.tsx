import { addDays, addWeeks, format } from 'date-fns'
import { ChevronLeft, ChevronRight, Flame, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProgressRing } from '@/components/ProgressRing'
import { Button, Card, Chip, cx, EmptyState, IconButton, PageHeader } from '@/components/ui'
import { fromISODate, todayISO, toISODate, weekStart } from '@/lib/dates'
import { BODY_PART_LABEL, TRAINING_META } from '@/lib/meta'
import type { Workout } from '@/lib/types'
import { useRecentWorkouts, useWorkouts } from './api'
import { ColumnChart, HBarChart } from './Charts'
import { LogWorkoutSheet } from './LogWorkoutSheet'
import { bodyPartCounts, streaks, summarizeWeek, typeSplit, WEEKLY_GOAL_MIN, weeklyTrend } from './stats'

const TREND_WEEKS = 12
type Range = 'week' | 'trend'

export default function WorkoutsPage() {
  const [params, setParams] = useSearchParams()
  const today = todayISO()
  const thisWeek = toISODate(weekStart(fromISODate(today)))
  const viewed = params.get('week') ?? thisWeek
  const viewedStart = fromISODate(viewed)
  const viewedEnd = toISODate(addDays(viewedStart, 6))
  const trendFrom = toISODate(addWeeks(viewedStart, -(TREND_WEEKS - 1)))

  const windowQ = useWorkouts(trendFrom, viewedEnd)
  const recentQ = useRecentWorkouts()
  const [range, setRange] = useState<Range>('week')
  const [trendMetric, setTrendMetric] = useState<'minutes' | 'sessions'>('minutes')
  const [editing, setEditing] = useState<Workout | null>(null)
  const [logDate, setLogDate] = useState<string | undefined>()

  const logOpen = params.get('log') === '1' || editing !== null
  const openLog = (date?: string) => {
    setLogDate(date)
    setParams((p) => {
      p.set('log', '1')
      return p
    })
  }
  const closeLog = () => {
    setEditing(null)
    setParams(
      (p) => {
        p.delete('log')
        return p
      },
      { replace: true },
    )
  }
  const goWeek = (delta: number, reset = false) =>
    setParams((p) => {
      const next = reset ? thisWeek : toISODate(addWeeks(viewedStart, delta))
      if (next === thisWeek) p.delete('week')
      else p.set('week', next)
      return p
    })

  const all = windowQ.data ?? []
  const week = useMemo(() => all.filter((w) => w.date >= viewed && w.date <= viewedEnd), [all, viewed, viewedEnd])
  const summary = summarizeWeek(week, viewedStart)
  const trend = weeklyTrend(all, viewedStart, TREND_WEEKS)
  const s = streaks(recentQ.data ?? [], today)
  const scope = range === 'week' ? week : all
  const parts = bodyPartCounts(scope)
  const types = typeSplit(scope)
  const isThisWeek = viewed === thisWeek

  return (
    <>
      <PageHeader
        module="workouts"
        title="Workouts"
        subtitle="Move a little, every day"
        action={
          <Button accent="workouts" size="sm" onClick={() => openLog(today)}>
            <Plus className="size-4" aria-hidden /> Log today
          </Button>
        }
      />

      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between gap-2 rounded-3xl border border-line bg-card p-1.5">
        <IconButton label="Previous week" onClick={() => goWeek(-1)}>
          <ChevronLeft className="size-5" />
        </IconButton>
        <div className="text-center">
          <p className="font-extrabold">{isThisWeek ? 'This week' : `Week of ${format(viewedStart, 'd MMM')}`}</p>
          <p className="text-xs text-muted">
            {format(viewedStart, 'd MMM')} – {format(fromISODate(viewedEnd), 'd MMM yyyy')}
          </p>
        </div>
        <div className="flex items-center">
          {!isThisWeek && (
            <Button variant="ghost" size="sm" onClick={() => goWeek(0, true)}>
              Today
            </Button>
          )}
          <IconButton label="Next week" onClick={() => goWeek(1)} disabled={isThisWeek} className="disabled:opacity-30">
            <ChevronRight className="size-5" />
          </IconButton>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="col-span-2 flex items-center gap-4 sm:col-span-1">
          <ProgressRing value={summary.totalMinutes} max={WEEKLY_GOAL_MIN} label="Weekly minutes vs 150 minute goal">
            <span className="text-xs font-bold">{Math.round((summary.totalMinutes / WEEKLY_GOAL_MIN) * 100)}%</span>
          </ProgressRing>
          <div>
            <p className="text-sm text-muted">Minutes</p>
            <p className="text-2xl font-extrabold">{summary.totalMinutes}</p>
            <p className="text-xs text-muted">goal {WEEKLY_GOAL_MIN}</p>
          </div>
        </Card>
        <StatTile label="Sessions" value={summary.sessions} />
        <StatTile label="Active days" value={`${summary.activeDays}/7`} />
        <StatTile
          className="col-span-2 sm:col-span-1"
          label="Streak"
          value={
            <span className="inline-flex items-center gap-1">
              <Flame className={cx('size-6', s.currentDays > 0 ? 'text-orange-500' : 'text-muted')} aria-hidden />
              {s.currentDays}d
            </span>
          }
          hint={`best ${s.longestDays}d · ${s.currentWeeks} wk in a row`}
        />
      </div>

      {/* Day strip */}
      <Card className="mb-4">
        <ol className="grid grid-cols-7 gap-1.5">
          {summary.days.map((d, i) => {
            const dayWorkouts = week.filter((w) => w.date === d)
            const future = d > today
            return (
              <li key={d}>
                <button
                  type="button"
                  disabled={future}
                  onClick={() => openLog(d)}
                  className={cx(
                    'flex w-full flex-col items-center gap-1 rounded-2xl py-2 transition active:scale-95 disabled:opacity-40',
                    dayWorkouts.length ? 'bg-emerald-100 dark:bg-emerald-500/15' : 'hover:bg-card-2',
                    d === today && 'ring-2 ring-emerald-400',
                  )}
                  aria-label={`${format(fromISODate(d), 'EEEE d MMMM')}: ${
                    dayWorkouts.length ? `${summary.minutesByDay[i]} minutes, tap to log another` : 'no workout, tap to log'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase text-muted">{format(fromISODate(d), 'EEEEE')}</span>
                  <span className="text-lg leading-none" aria-hidden>
                    {dayWorkouts.length ? TRAINING_META[dayWorkouts[0].training_type].emoji : '·'}
                  </span>
                  <span className="text-[11px] font-semibold tabular-nums">
                    {summary.minutesByDay[i] ? `${summary.minutesByDay[i]}′` : ' '}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sessions list */}
        <Card>
          <h2 className="mb-2 text-lg font-extrabold">Sessions</h2>
          {week.length === 0 ? (
            <EmptyState
              emoji="🌤️"
              title="No workouts this week"
              hint="Even a 15-minute walk counts."
              action={
                <Button accent="workouts" size="sm" onClick={() => openLog(isThisWeek ? today : viewed)}>
                  Log one
                </Button>
              }
            />
          ) : (
            <ul className="-mx-2 flex flex-col">
              {week.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => setEditing(w)}
                    className="flex w-full items-start gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-card-2"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-xl dark:bg-emerald-500/15" aria-hidden>
                      {TRAINING_META[w.training_type].emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-bold">{TRAINING_META[w.training_type].label}</span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                          {w.duration_min} min
                        </span>
                      </span>
                      <span className="block text-xs text-muted">{format(fromISODate(w.date), 'EEEE d MMM')}</span>
                      {w.body_parts.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {w.body_parts.map((p) => (
                            <span key={p} className="rounded-full bg-card-2 px-2 py-0.5 text-xs font-semibold text-muted">
                              {BODY_PART_LABEL[p]}
                            </span>
                          ))}
                        </span>
                      )}
                      {w.notes && <span className="mt-1 block truncate text-sm text-muted">{w.notes}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Charts */}
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold">Stats</h2>
            <div className="flex gap-1.5" role="group" aria-label="Stats range">
              <Chip selected={range === 'week'} selectedClass="bg-emerald-500 text-white" onClick={() => setRange('week')}>
                Week
              </Chip>
              <Chip selected={range === 'trend'} selectedClass="bg-emerald-500 text-white" onClick={() => setRange('trend')}>
                {TREND_WEEKS} weeks
              </Chip>
            </div>
          </div>

          {range === 'week' ? (
            <>
              <h3 className="text-sm font-bold text-muted">Minutes per day</h3>
              <ColumnChart
                ariaLabel="Minutes trained per day this week"
                labelHeader="Day"
                unit="min"
                data={summary.days.map((d, i) => ({ label: format(fromISODate(d), 'EEE'), value: summary.minutesByDay[i] }))}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-muted">{trendMetric === 'minutes' ? 'Minutes per week' : 'Sessions per week'}</h3>
                <div className="flex gap-1" role="group" aria-label="Trend metric">
                  <Chip className="px-2.5 py-1 text-xs" selected={trendMetric === 'minutes'} selectedClass="bg-emerald-500 text-white" onClick={() => setTrendMetric('minutes')}>
                    Minutes
                  </Chip>
                  <Chip className="px-2.5 py-1 text-xs" selected={trendMetric === 'sessions'} selectedClass="bg-emerald-500 text-white" onClick={() => setTrendMetric('sessions')}>
                    Sessions
                  </Chip>
                </div>
              </div>
              <ColumnChart
                ariaLabel={`${trendMetric === 'minutes' ? 'Minutes' : 'Sessions'} per week over the last ${TREND_WEEKS} weeks`}
                labelHeader="Week of"
                unit={trendMetric === 'minutes' ? 'min' : 'sessions'}
                goal={trendMetric === 'minutes' ? { value: WEEKLY_GOAL_MIN, label: `goal ${WEEKLY_GOAL_MIN}` } : undefined}
                data={trend.map((t) => ({
                  label: format(fromISODate(t.weekStart), 'd MMM'),
                  value: trendMetric === 'minutes' ? t.minutes : t.sessions,
                  detail: trendMetric === 'minutes' ? `${t.sessions} sessions` : `${t.minutes} min`,
                }))}
              />
            </>
          )}

          <h3 className="mt-5 text-sm font-bold text-muted">Body parts trained</h3>
          {parts.length === 0 ? (
            <p className="py-3 text-sm text-muted">No body parts logged yet.</p>
          ) : (
            <HBarChart
              ariaLabel="Sessions per body part"
              labelHeader="Body part"
              unit="sessions"
              data={parts.map((p) => ({ label: BODY_PART_LABEL[p.key], value: p.count }))}
            />
          )}

          <h3 className="mt-5 text-sm font-bold text-muted">Training type split</h3>
          {types.length === 0 ? (
            <p className="py-3 text-sm text-muted">Nothing logged yet.</p>
          ) : (
            <HBarChart
              ariaLabel="Minutes per training type"
              labelHeader="Type"
              unit="min"
              data={types.map((t) => ({
                label: `${TRAINING_META[t.key].emoji} ${TRAINING_META[t.key].label}`,
                value: t.minutes,
                detail: `${t.sessions} session${t.sessions === 1 ? '' : 's'}`,
              }))}
            />
          )}
        </Card>
      </div>

      <LogWorkoutSheet open={logOpen} onClose={closeLog} workout={editing} defaultDate={logDate} />
    </>
  )
}

function StatTile({ label, value, hint, className }: { label: string; value: React.ReactNode; hint?: string; className?: string }) {
  return (
    <Card className={cx('flex flex-col justify-center', className)}>
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </Card>
  )
}
