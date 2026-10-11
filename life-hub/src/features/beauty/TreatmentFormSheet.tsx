import { useEffect, useState } from 'react'
import { Button, Chip, ErrorNote, Field, inputClass, Sheet } from '@/components/ui'
import { todayISO } from '@/lib/dates'
import { TREATMENT_EMOJIS } from '@/lib/meta'
import type { TreatmentStatus } from '@/lib/types'
import { useSaveTreatment } from './api'

const INTERVALS = [1, 2, 3, 7, 14, 28, 42]
const PINK = 'bg-pink-500 text-white'

export function TreatmentFormSheet({
  open,
  onClose,
  treatment,
}: {
  open: boolean
  onClose: () => void
  treatment?: TreatmentStatus | null
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('✨')
  const [intervalDays, setIntervalDays] = useState('3')
  const [notes, setNotes] = useState('')
  const [remind, setRemind] = useState(true)
  const [active, setActive] = useState(true)
  const [lastDone, setLastDone] = useState<string | null>(todayISO())
  const save = useSaveTreatment()

  useEffect(() => {
    if (!open) return
    setName(treatment?.name ?? '')
    setEmoji(treatment?.emoji ?? '✨')
    setIntervalDays(String(treatment?.interval_days ?? 3))
    setNotes(treatment?.notes ?? '')
    setRemind(treatment?.remind ?? true)
    setActive(treatment?.active ?? true)
    setLastDone(todayISO())
    save.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, treatment])

  const days = Number(intervalDays)
  const valid = name.trim() && Number.isInteger(days) && days >= 1 && days <= 365

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    await save.mutateAsync({
      id: treatment?.id,
      input: { name: name.trim(), emoji, interval_days: days, notes: notes.trim() || null, remind, active },
      lastDone: treatment ? undefined : lastDone,
    })
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={treatment ? 'Edit treatment' : 'New treatment'}
      footer={
        <Button type="submit" form="treatment-form" accent="beauty" className="w-full" loading={save.isPending} disabled={!valid}>
          {treatment ? 'Save' : 'Add treatment'}
        </Button>
      }
    >
      <form id="treatment-form" onSubmit={submit} className="flex flex-col gap-5">
        <Field label="Name">
          {(id) => (
            <input
              id={id}
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Retinol, peeling, hair mask…"
              maxLength={60}
              required
            />
          )}
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-muted">Icon</legend>
          <div className="flex flex-wrap gap-1.5">
            {TREATMENT_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={emoji === e}
                aria-label={`Icon ${e}`}
                onClick={() => setEmoji(e)}
                className={`grid size-10 place-items-center rounded-xl text-xl transition active:scale-90 ${
                  emoji === e ? 'bg-pink-500 shadow' : 'bg-card-2 hover:bg-pink-100 dark:hover:bg-pink-500/15'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Repeat every (days)">
          {(id) => (
            <div className="flex flex-col gap-2">
              <input
                id={id}
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                className={inputClass}
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                required
              />
              <div className="flex flex-wrap gap-1.5">
                {INTERVALS.map((d) => (
                  <Chip key={d} selected={days === d} selectedClass={PINK} onClick={() => setIntervalDays(String(d))}>
                    {d === 1 ? 'Daily' : d === 7 ? 'Weekly' : d === 14 ? '2 weeks' : d === 28 ? '4 weeks' : d === 42 ? '6 weeks' : `${d} days`}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </Field>

        {!treatment && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-muted">Last done</legend>
            <div className="flex flex-wrap items-center gap-2">
              <Chip selected={lastDone === todayISO()} selectedClass={PINK} onClick={() => setLastDone(todayISO())}>
                Today
              </Chip>
              <Chip selected={lastDone === null} selectedClass={PINK} onClick={() => setLastDone(null)}>
                Not yet
              </Chip>
              <input
                type="date"
                aria-label="Last done on"
                className={inputClass + ' w-auto py-1.5'}
                value={lastDone ?? ''}
                max={todayISO()}
                onChange={(e) => setLastDone(e.target.value || null)}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted">Reminders start counting from the last time you did it.</p>
          </fieldset>
        )}

        <Field label="Notes (optional)">
          {(id) => (
            <textarea
              id={id}
              className={inputClass + ' min-h-20'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              placeholder="Product, strength, evening only…"
            />
          )}
        </Field>

        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-card-2 px-4 py-3">
            <span>
              <span className="block font-semibold">Push reminder when due</span>
              <span className="text-xs text-muted">Turn on notifications in Settings first.</span>
            </span>
            <input type="checkbox" className="size-5 accent-pink-500" checked={remind} onChange={(e) => setRemind(e.target.checked)} />
          </label>
          {treatment && (
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-card-2 px-4 py-3">
              <span className="font-semibold">Active</span>
              <input type="checkbox" className="size-5 accent-pink-500" checked={active} onChange={(e) => setActive(e.target.checked)} />
            </label>
          )}
        </div>
        <ErrorNote error={save.error} />
      </form>
    </Sheet>
  )
}
