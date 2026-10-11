import { StickyNote } from 'lucide-react'
import { Checkbox, cx } from '@/components/ui'
import { relativeDay, toISODate } from '@/lib/dates'
import { LIST_TYPES } from '@/lib/meta'
import type { ListItem, ListType } from '@/lib/types'

export function ItemRow({
  item,
  type,
  onToggle,
  onOpen,
  listName,
  showDate,
}: {
  item: ListItem
  type: ListType
  onToggle: (done: boolean) => void
  onOpen: () => void
  listName?: string
  showDate?: boolean
}) {
  const meta = LIST_TYPES[type]
  return (
    <li className="animate-rise flex items-start gap-3 rounded-2xl px-2 py-2 transition hover:bg-card-2">
      <div className="pt-0.5">
        <Checkbox
          checked={item.done}
          onChange={onToggle}
          label={`Mark "${item.title}" ${item.done ? 'not done' : 'done'}`}
          colorClass={cx(meta.dot, 'border-transparent')}
        />
      </div>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left outline-none focus-visible:underline">
        <span className={cx('block break-words font-semibold transition', item.done && 'text-muted line-through')}>
          {item.title}
        </span>
        {(listName || item.category || item.tags.length > 0 || item.note || showDate) && (
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            {listName && <span className={cx('font-semibold', meta.text)}>{listName}</span>}
            {item.category && (
              <span className={cx('rounded-full px-2 py-0.5 font-semibold', meta.soft, meta.text)}>{item.category}</span>
            )}
            {item.tags.map((t) => (
              <span key={t} className="font-medium">
                #{t}
              </span>
            ))}
            {item.note && <StickyNote className="size-3.5" aria-label="Has a note" />}
            {showDate && <span>added {relativeDay(toISODate(new Date(item.created_at)))}</span>}
          </span>
        )}
      </button>
    </li>
  )
}
