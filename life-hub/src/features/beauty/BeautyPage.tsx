import { BellRing, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useToast } from '@/components/Toast'
import { Button, EmptyState, PageHeader, Spinner } from '@/components/ui'
import { todayISO } from '@/lib/dates'
import { usePushStatus } from '@/lib/push'
import type { TreatmentStatus } from '@/lib/types'
import { useLogTreatment, useTreatments } from './api'
import { dueInfo, sortByUrgency } from './status'
import { TreatmentCard } from './TreatmentCard'
import { TreatmentDetailSheet } from './TreatmentDetailSheet'
import { TreatmentFormSheet } from './TreatmentFormSheet'

export default function BeautyPage() {
  const { data, isLoading } = useTreatments()
  const [params, setParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TreatmentStatus | null>(null)
  const log = useLogTreatment()
  const toast = useToast()
  const push = usePushStatus()
  const today = todayISO()

  const openId = params.get('treatment')
  const open = data?.find((t) => t.id === openId) ?? null
  const setOpen = (id: string | null) =>
    setParams(
      (p) => {
        if (id) p.set('treatment', id)
        else p.delete('treatment')
        return p
      },
      { replace: !id },
    )

  const sorted = sortByUrgency(data ?? [], today)
  const groups = [
    { title: 'Due now', items: sorted.filter((t) => ['overdue', 'due'].includes(dueInfo(t, today).kind)) },
    { title: 'Coming up', items: sorted.filter((t) => ['soon', 'snoozed', 'ok'].includes(dueInfo(t, today).kind)) },
    { title: 'Not started', items: sorted.filter((t) => dueInfo(t, today).kind === 'new') },
    { title: 'Paused', items: sorted.filter((t) => dueInfo(t, today).kind === 'paused') },
  ]

  const markDone = (t: TreatmentStatus) =>
    log.mutate(
      { treatmentId: t.id },
      {
        onSuccess: () => toast(`${t.emoji} ${t.name} done. Glowing!`),
        onError: (e) => toast(e.message, { tone: 'error' }),
      },
    )

  return (
    <>
      <PageHeader
        module="beauty"
        title="Beauty care"
        subtitle="Little rituals, right on time"
        action={
          <Button
            accent="beauty"
            size="sm"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" aria-hidden /> New
          </Button>
        }
      />

      {push.supported && push.permission !== 'granted' && (data?.length ?? 0) > 0 && (
        <Link
          to="/settings#notifications"
          className="animate-rise mb-4 flex items-center gap-3 rounded-3xl bg-gradient-to-r from-pink-500 to-rose-500 p-4 text-white shadow-md"
        >
          <BellRing className="size-6 shrink-0 animate-[lh-wiggle_1s_ease-in-out_2]" aria-hidden />
          <span className="text-sm font-semibold">Turn on reminders so you never miss a treatment →</span>
        </Link>
      )}

      {isLoading ? (
        <Spinner className="mx-auto mt-10" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          emoji="🧴"
          title="No treatments yet"
          hint="Add things like retinol every 3 days or a peeling every 2 weeks, and we'll tell you when they're due."
          action={
            <Button accent="beauty" onClick={() => setFormOpen(true)}>
              Add your first
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(
            (g) =>
              g.items.length > 0 && (
                <section key={g.title}>
                  <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-muted">
                    {g.title} <span className="font-semibold">({g.items.length})</span>
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {g.items.map((t) => (
                      <TreatmentCard key={t.id} t={t} today={today} onOpen={() => setOpen(t.id)} onDone={() => markDone(t)} />
                    ))}
                  </div>
                </section>
              ),
          )}
        </div>
      )}

      <TreatmentDetailSheet
        treatment={open}
        onClose={() => setOpen(null)}
        onEdit={() => {
          setEditing(open)
          setOpen(null)
          setFormOpen(true)
        }}
      />
      <TreatmentFormSheet open={formOpen} onClose={() => setFormOpen(false)} treatment={editing} />
    </>
  )
}
