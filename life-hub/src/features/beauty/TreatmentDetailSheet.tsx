import { format } from 'date-fns'
import { AlarmClock, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { Button, ErrorNote, IconButton, inputClass, Sheet, Spinner } from '@/components/ui'
import { fromISODate, todayISO } from '@/lib/dates'
import type { TreatmentStatus } from '@/lib/types'
import { useDeleteLog, useDeleteTreatment, useLogTreatment, useSnoozeTreatment, useTreatmentLogs } from './api'
import { dueInfo, dueLabel, sinceLabel } from './status'

export function TreatmentDetailSheet({
  treatment,
  onClose,
  onEdit,
}: {
  treatment: TreatmentStatus | null
  onClose: () => void
  onEdit: () => void
}) {
  const [doneOn, setDoneOn] = useState(todayISO())
  const [note, setNote] = useState('')
  const logs = useTreatmentLogs(treatment?.id ?? null)
  const log = useLogTreatment()
  const delLog = useDeleteLog()
  const snooze = useSnoozeTreatment()
  const del = useDeleteTreatment()
  const toast = useToast()

  if (!treatment) return null
  const today = todayISO()
  const info = dueInfo(treatment, today)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await log.mutateAsync({ treatmentId: treatment.id, doneOn, note: note.trim() || null })
    setNote('')
    setDoneOn(todayISO())
    toast(`${treatment.emoji} Logged!`)
  }

  const doSnooze = async (days: number) => {
    await snooze.mutateAsync({ id: treatment.id, days })
    toast(`💤 Snoozed ${days} day${days > 1 ? 's' : ''}`)
    onClose()
  }

  const remove = async () => {
    if (!confirm(`Delete "${treatment.name}" and its history?`)) return
    await del.mutateAsync(treatment.id)
    onClose()
  }

  return (
    <Sheet open onClose={onClose} title={`${treatment.emoji} ${treatment.name}`}>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-card-2 p-3">
            <p className="text-xs text-muted">Last done</p>
            <p className="font-bold">{treatment.last_done ? format(fromISODate(treatment.last_done), 'd MMM') : 'n/a'}</p>
          </div>
          <div className="rounded-2xl bg-card-2 p-3">
            <p className="text-xs text-muted">Next due</p>
            <p className="font-bold">{info.dueOn ? format(fromISODate(info.dueOn), 'd MMM') : 'n/a'}</p>
          </div>
          <div className="rounded-2xl bg-card-2 p-3">
            <p className="text-xs text-muted">Every</p>
            <p className="font-bold">{treatment.interval_days}d</p>
          </div>
        </div>
        <p className="-mt-2 text-center text-sm text-muted">
          {sinceLabel(info)} · {dueLabel(info)}
        </p>
        {treatment.notes && <p className="rounded-2xl bg-pink-50 p-3 text-sm dark:bg-pink-500/10">{treatment.notes}</p>}

        <form onSubmit={submit} className="flex flex-col gap-2 rounded-3xl border border-line p-3">
          <p className="font-bold">Log it</p>
          <div className="flex gap-2">
            <input
              type="date"
              aria-label="Done on"
              className={inputClass + ' w-auto'}
              value={doneOn}
              max={today}
              onChange={(e) => setDoneOn(e.target.value)}
              required
            />
            <input
              className={inputClass}
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              aria-label="Note"
            />
          </div>
          <Button type="submit" accent="beauty" loading={log.isPending}>
            Mark done
          </Button>
          <ErrorNote error={log.error} />
        </form>

        <div className="flex flex-wrap gap-2">
          <Button variant="soft" accent="beauty" size="sm" onClick={() => doSnooze(1)} loading={snooze.isPending}>
            <AlarmClock className="size-4" aria-hidden /> Snooze 1 day
          </Button>
          <Button variant="soft" accent="beauty" size="sm" onClick={() => doSnooze(3)}>
            Snooze 3 days
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="size-4" aria-hidden /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={remove}>
            <Trash2 className="size-4" aria-hidden /> Delete
          </Button>
        </div>

        <section>
          <h3 className="mb-2 font-bold">History</h3>
          {logs.isLoading ? (
            <Spinner />
          ) : (logs.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">No logs yet.</p>
          ) : (
            <ul className="flex flex-col">
              {logs.data!.map((l) => (
                <li key={l.id} className="flex items-center gap-2 border-t border-line py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{format(fromISODate(l.done_on), 'EEE d MMM yyyy')}</span>
                    {l.note && <span className="block text-sm text-muted">{l.note}</span>}
                  </span>
                  <IconButton label={`Delete log from ${l.done_on}`} onClick={() => delLog.mutate(l.id)}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Sheet>
  )
}
