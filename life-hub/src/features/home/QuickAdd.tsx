import { ArrowRight, Send } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { cx } from '@/components/ui'
import { LIST_TYPE_ORDER, LIST_TYPES } from '@/lib/meta'
import { parseQuickAdd } from '@/lib/quickAdd'
import type { ListType } from '@/lib/types'
import { useAddItem, useDeleteItem, useQuickAddTargets } from '../lists/api'

/**
 * One box for everything. Type "buy: shoes" and press Enter, or type "shoes"
 * and tap a chip. Either way it's saved in one tap.
 */
export function QuickAdd() {
  const [draft, setDraft] = useState('')
  const [selected, setSelected] = useState<ListType>('todo')
  const add = useAddItem()
  const del = useDeleteItem()
  const targetFor = useQuickAddTargets()
  const toast = useToast()

  const parsed = parseQuickAdd(draft)
  const effectiveType = parsed.type ?? selected
  const target = targetFor(effectiveType)

  const save = async (type: ListType) => {
    const p = parseQuickAdd(draft)
    const list = targetFor(p.type ?? type)
    if (!p.title || !list) return
    try {
      const item = await add.mutateAsync({ list_id: list.id, title: p.title, tags: p.tags, category: p.category })
      setDraft('')
      toast(`Added to ${list.name} ✨`, { action: { label: 'Undo', onClick: () => del.mutate(item.id) } })
    } catch (err) {
      toast((err as Error).message, { tone: 'error' })
    }
  }

  return (
    <section
      aria-label="Quick add"
      className="animate-rise rounded-[2rem] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 p-[2px] shadow-lg shadow-violet-500/20"
    >
      <div className="rounded-[calc(2rem-2px)] bg-card p-3 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            save(selected)
          }}
          className="flex items-center gap-2"
        >
          <input
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-lg font-semibold outline-none placeholder:font-medium placeholder:text-muted/70"
            placeholder="buy: shoes · chore: vacuum · idea: …"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            enterKeyHint="send"
            aria-label="Quick add an item"
            autoCapitalize="sentences"
          />
          <button
            type="submit"
            disabled={!parsed.title || add.isPending}
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-500 text-white shadow transition hover:bg-violet-600 active:scale-90 disabled:opacity-40"
            aria-label={target ? `Add to ${target.name}` : 'Add'}
          >
            <Send className="size-5" aria-hidden />
          </button>
        </form>

        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="List type">
          {LIST_TYPE_ORDER.map((t) => {
            const m = LIST_TYPES[t]
            const Icon = m.icon
            const active = effectiveType === t
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                title={parsed.title ? `Save to ${m.label}` : `Select ${m.label}`}
                onClick={() => (parsed.title ? save(t) : setSelected(t))}
                className={cx(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition active:scale-95',
                  active ? cx(m.chip, 'shadow-sm') : 'bg-card-2 text-muted hover:text-ink',
                )}
              >
                <Icon className="size-4" aria-hidden /> {m.short}
              </button>
            )
          })}
        </div>

        {parsed.title && (
          <p className="animate-fade mt-2 flex flex-wrap items-center gap-1.5 px-1 text-sm text-muted">
            <ArrowRight className="size-4" aria-hidden />
            <span className={cx('font-bold', LIST_TYPES[effectiveType].text)}>{target?.name ?? LIST_TYPES[effectiveType].label}</span>
            {parsed.category && <span>· @{parsed.category}</span>}
            {parsed.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
            {!parsed.type && <span className="text-xs">(tap a chip to save elsewhere)</span>}
          </p>
        )}
      </div>
    </section>
  )
}
