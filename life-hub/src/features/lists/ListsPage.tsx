import { Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUserId } from '@/auth/AuthProvider'
import { Button, Card, cx, EmptyState, inputClass, PageHeader, Spinner } from '@/components/ui'
import { LIST_TYPE_ORDER, LIST_TYPES } from '@/lib/meta'
import { useLists, useOpenItems, useUpdateItem } from './api'
import { filterItems } from './filter'
import { ItemRow } from './ItemRow'
import { NewListSheet } from './NewListSheet'

export default function ListsPage() {
  const userId = useUserId()
  const { data: lists, isLoading } = useLists()
  const { data: items } = useOpenItems()
  const update = useUpdateItem()
  const [newOpen, setNewOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const counts = useMemo(() => {
    const m = new Map<string, { open: number; done: number }>()
    for (const i of items ?? []) {
      const c = m.get(i.list_id) ?? { open: 0, done: 0 }
      if (i.done) c.done++
      else c.open++
      m.set(i.list_id, c)
    }
    return m
  }, [items])

  const listById = useMemo(() => new Map((lists ?? []).map((l) => [l.id, l])), [lists])
  const results = q.trim() ? filterItems(items ?? [], { q, category: null, tag: null }).slice(0, 30) : []

  return (
    <>
      <PageHeader
        module="lists"
        title="Lists"
        subtitle="Buy, do, dream"
        action={
          <Button accent="lists" size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" aria-hidden /> New list
          </Button>
        }
      />

      <input
        type="search"
        className={cx(inputClass, 'mb-5')}
        placeholder="Search all lists…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search all lists"
      />

      {q.trim() ? (
        <Card>
          {results.length === 0 ? (
            <EmptyState emoji="🔍" title="Nothing found" hint="Try another word, tag or category." />
          ) : (
            <ul>
              {results.map((i) => {
                const list = listById.get(i.list_id)
                if (!list) return null
                return (
                  <ItemRow
                    key={i.id}
                    item={i}
                    type={list.type}
                    listName={list.name}
                    onToggle={(done) => update.mutate({ id: i.id, patch: { done } })}
                    onOpen={() => navigate(`/lists/${list.id}?item=${i.id}`)}
                  />
                )
              })}
            </ul>
          )}
        </Card>
      ) : isLoading ? (
        <Spinner className="mx-auto mt-10" />
      ) : (
        <div className="flex flex-col gap-6">
          {LIST_TYPE_ORDER.map((type) => {
            const meta = LIST_TYPES[type]
            const Icon = meta.icon
            const ofType = (lists ?? []).filter((l) => l.type === type)
            if (ofType.length === 0) return null
            return (
              <section key={type} aria-labelledby={`h-${type}`}>
                <h2 id={`h-${type}`} className="mb-2 flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wide text-muted">
                  <span className={cx('size-2.5 rounded-full', meta.dot)} aria-hidden /> {meta.label}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ofType.map((list) => {
                    const c = counts.get(list.id) ?? { open: 0, done: 0 }
                    const sharedWithMe = list.owner_id !== userId
                    const memberCount = list.members?.length ?? 0
                    return (
                      <Link
                        key={list.id}
                        to={`/lists/${list.id}`}
                        className="animate-rise group flex items-center gap-3 rounded-3xl border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
                      >
                        <div className={cx('grid size-12 place-items-center rounded-2xl transition group-hover:rotate-6', meta.soft, meta.text)}>
                          <Icon className="size-6" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{list.name}</p>
                          <p className="text-sm text-muted">
                            {c.open} to go{c.done > 0 && ` · ${c.done} done`}
                          </p>
                        </div>
                        {(sharedWithMe || memberCount > 0) && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                            title={sharedWithMe ? `Shared by ${list.owner?.display_name || list.owner?.email}` : `Shared with ${memberCount}`}
                          >
                            <Users className="size-3.5" aria-hidden />
                            {sharedWithMe ? 'shared' : memberCount}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <NewListSheet open={newOpen} onClose={() => setNewOpen(false)} />
    </>
  )
}
