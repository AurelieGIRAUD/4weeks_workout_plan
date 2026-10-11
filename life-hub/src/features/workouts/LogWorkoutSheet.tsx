import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import { Button, Chip, ErrorNote, Field, inputClass, Sheet } from '@/components/ui'
import { fromISODate, todayISO } from '@/lib/dates'
import { BODY_PART_LABEL, TRAINING_META } from '@/lib/meta'
import { BODY_PARTS, TRAINING_TYPES, type BodyPart, type TrainingType, type Workout } from '@/lib/types'
import { useDeleteWorkout, useSaveWorkout } from './api'

const QUICK_DURATIONS = [15, 20, 30, 45, 60, 90]
const SELECTED = 'bg-emerald-500 text-white'

export function LogWorkoutSheet({
  open,
  onClose,
  workout,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  workout?: Workout | null
  defaultDate?: string
}) {
  const [date, setDate] = useState(todayISO())
  const [type, setType] = useState<TrainingType>('strength')
  const [parts, setParts] = useState<BodyPart[]>([])
  const [duration, setDuration] = useState('45')
  const [notes, setNotes] = useState('')
  const save = useSaveWorkout()
  const del = useDeleteWorkout()
  const toast = useToast()

  useEffect(() => {
    if (!open) return
    setDate(workout?.date ?? defaultDate ?? todayISO())
    setType(workout?.training_type ?? 'strength')
    setParts(workout?.body_parts ?? [])
    setDuration(String(workout?.duration_min ?? 45))
    setNotes(workout?.notes ?? '')
    save.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workout, defaultDate])

  const minutes = Number(duration)
  const valid = Number.isInteger(minutes) && minutes > 0 && minutes <= 1440

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    await save.mutateAsync({
      id: workout?.id,
      input: { date, training_type: type, body_parts: parts, duration_min: minutes, notes: notes.trim() || null },
    })
    toast(workout ? 'Workout updated' : `${TRAINING_META[type].emoji} Nice! ${minutes} min logged`)
    onClose()
  }

  const remove = async () => {
    if (!workout || !confirm('Delete this workout?')) return
    await del.mutateAsync(workout.id)
    toast('Workout deleted')
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={workout ? 'Edit workout' : 'Log a workout'}
      footer={
        <div className="flex gap-2">
          {workout && (
            <Button type="button" variant="ghost" onClick={remove} loading={del.isPending} aria-label="Delete workout">
              <Trash2 className="size-4" aria-hidden />
            </Button>
          )}
          <Button type="submit" form="workout-form" accent="workouts" className="flex-1" loading={save.isPending} disabled={!valid}>
            {workout ? 'Save' : 'Log it 💪'}
          </Button>
        </div>
      }
    >
      <form id="workout-form" onSubmit={submit} className="flex flex-col gap-5">
        <Field label="Date" hint={format(fromISODate(date), 'EEEE d MMMM')}>
          {(id) => (
            <input id={id} type="date" className={inputClass} value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} required />
          )}
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold text-muted">Training type</legend>
          <div className="flex flex-wrap gap-2">
            {TRAINING_TYPES.map((t) => (
              <Chip key={t} selected={type === t} selectedClass={SELECTED} onClick={() => setType(t)}>
                <span aria-hidden>{TRAINING_META[t].emoji}</span> {TRAINING_META[t].label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-semibold text-muted">Body parts</legend>
          <div className="flex flex-wrap gap-2">
            {BODY_PARTS.map((p) => (
              <Chip
                key={p}
                selected={parts.includes(p)}
                selectedClass={SELECTED}
                onClick={() => setParts((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))}
              >
                {BODY_PART_LABEL[p]}
              </Chip>
            ))}
          </div>
        </fieldset>

        <Field label="Duration (minutes)">
          {(id) => (
            <div className="flex flex-col gap-2">
              <input
                id={id}
                type="number"
                inputMode="numeric"
                min={1}
                max={1440}
                className={inputClass}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_DURATIONS.map((m) => (
                  <Chip key={m} selected={minutes === m} selectedClass={SELECTED} onClick={() => setDuration(String(m))}>
                    {m}′
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </Field>

        <Field label="Notes (optional)">
          {(id) => (
            <textarea
              id={id}
              className={inputClass + ' min-h-20'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              placeholder="How did it feel? PRs, weights, route…"
            />
          )}
        </Field>
        <ErrorNote error={save.error ?? del.error} />
      </form>
    </Sheet>
  )
}
