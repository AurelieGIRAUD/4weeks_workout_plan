import { House } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, EmptyState } from '@/components/ui'
import { todayISO, toISODate } from '@/lib/dates'
import { LIST_TYPES } from '@/lib/meta'
import { useLists, useOpenItems, useUpdateItem } from '../lists/api'
import { ItemRow } from '../lists/ItemRow'

/** Open chores, plus the ones ticked off today so you can enjoy them. */
export function ChoresCard() {
  const { data: lists } = useLists()
  const { data: items } = useOpenItems()
  const update = useUpdateItem()
  const navigate = useNavigate()
  const choreLists = new Map((lists ?? []).filter((l) => l.type === 'chores').map((l) => [l.id, l]))
  const today = todayISO()
  const chores = (items ?? [])
    .filter((i) => choreLists.has(i.list_id) && (!i.done || (i.done_at && toISODate(new Date(i.done_at)) === today)))
    .sort((a, b) => Number(a.done) - Number(b.done))
  const remaining = chores.filter((c) => !c.done).length
  const meta = LIST_TYPES.chores

  return (
    <Card aria-labelledby="chores-title">
      <div className="mb-2 flex items-center gap-2">
        <span className={`grid size-9 place-items-center rounded-xl ${meta.soft} ${meta.text}`}>
          <House className="size-5" aria-hidden />
        </span>
        <h2 id="chores-title" className="flex-1 text-lg font-extrabold">
          Today's chores
        </h2>
        <span className="text-sm font-semibold text-muted">{remaining} left</span>
      </div>
      {chores.length === 0 ? (
        <EmptyState emoji="🧹" title="No chores" hint='Type "chore: vacuum" above to add one.' />
      ) : (
        <ul className="-mx-2 max-h-80 overflow-y-auto">
          {chores.slice(0, 12).map((i) => (
            <ItemRow
              key={i.id}
              item={i}
              type="chores"
              listName={choreLists.size > 1 ? choreLists.get(i.list_id)?.name : undefined}
              onToggle={(done) => update.mutate({ id: i.id, patch: { done } })}
              onOpen={() => navigate(`/lists/${i.list_id}?item=${i.id}`)}
            />
          ))}
        </ul>
      )}
      <Link to="/lists" className={`mt-2 inline-block text-sm font-bold ${meta.text}`}>
        All lists →
      </Link>
    </Card>
  )
}
