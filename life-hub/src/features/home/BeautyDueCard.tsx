import { Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '@/components/Toast'
import { Card, EmptyState } from '@/components/ui'
import { todayISO } from '@/lib/dates'
import { useLogTreatment, useTreatments } from '../beauty/api'
import { dueInfo, sortByUrgency } from '../beauty/status'
import { TreatmentCard } from '../beauty/TreatmentCard'

/** Treatments due within the next couple of days (or done today). */
export function BeautyDueCard() {
  const { data } = useTreatments()
  const log = useLogTreatment()
  const toast = useToast()
  const navigate = useNavigate()
  const today = todayISO()
  const soon = sortByUrgency(data ?? [], today).filter((t) => {
    const i = dueInfo(t, today)
    return ['overdue', 'due', 'soon'].includes(i.kind) || (t.active && i.daysSince === 0)
  })

  return (
    <Card aria-labelledby="beauty-title">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <h2 id="beauty-title" className="flex-1 text-lg font-extrabold">
          Beauty care due soon
        </h2>
      </div>
      {soon.length === 0 ? (
        <EmptyState
          emoji="🌸"
          title={(data ?? []).length ? 'All caught up' : 'No treatments yet'}
          hint={(data ?? []).length ? 'Nothing due in the next two days.' : 'Add retinol, peelings, masks… in Beauty.'}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {soon.slice(0, 5).map((t) => (
            <TreatmentCard
              key={t.id}
              t={t}
              today={today}
              compact
              onOpen={() => navigate(`/beauty?treatment=${t.id}`)}
              onDone={() => log.mutate({ treatmentId: t.id }, { onSuccess: () => toast(`${t.emoji} ${t.name} done!`) })}
            />
          ))}
        </div>
      )}
      <Link to="/beauty" className="mt-3 inline-block text-sm font-bold text-pink-600 dark:text-pink-300">
        All treatments →
      </Link>
    </Card>
  )
}
