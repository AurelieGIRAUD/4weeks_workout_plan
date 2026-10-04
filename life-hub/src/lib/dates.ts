import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns'

/** All dates in the app are local calendar dates as yyyy-MM-dd strings. */
export const toISODate = (d: Date) => format(d, 'yyyy-MM-dd')
export const todayISO = () => toISODate(new Date())
export const fromISODate = (s: string) => parseISO(s)

export const WEEK_OPTS = { weekStartsOn: 1 as const }
export const weekStart = (d: Date) => startOfWeek(d, WEEK_OPTS)

export function weekDays(start: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(start, i)))
}

/** Calendar days from a to b (b - a). */
export const daysBetween = (a: string, b: string) => differenceInCalendarDays(fromISODate(b), fromISODate(a))

export function relativeDay(iso: string, today = todayISO()): string {
  const diff = daysBetween(today, iso)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  if (diff > 1 && diff < 7) return `in ${diff} days`
  if (diff < -1 && diff > -7) return `${-diff} days ago`
  return format(fromISODate(iso), 'EEE d MMM')
}

export const userTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
