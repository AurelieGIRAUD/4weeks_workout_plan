import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TagInput } from '@/components/TagInput'
import { useToast } from '@/components/Toast'
import { Button, ErrorNote, Field, inputClass, Sheet } from '@/components/ui'
import { LIST_TYPES } from '@/lib/meta'
import type { List, ListItem } from '@/lib/types'
import { useAddItem, useDeleteItem, useUpdateItem } from './api'

export function ItemEditor({
  item,
  lists,
  categories,
  tags,
  onClose,
}: {
  item: ListItem | null
  lists: List[]
  categories: string[]
  tags: string[]
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState('')
  const [itemTags, setItemTags] = useState<string[]>([])
  const [listId, setListId] = useState('')
  const update = useUpdateItem()
  const del = useDeleteItem()
  const add = useAddItem()
  const toast = useToast()

  useEffect(() => {
    if (!item) return
    setTitle(item.title)
    setNote(item.note ?? '')
    setCategory(item.category ?? '')
    setItemTags(item.tags)
    setListId(item.list_id)
  }, [item])

  if (!item) return null

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await update.mutateAsync({
      id: item.id,
      patch: {
        title: title.trim(),
        note: note.trim() || null,
        category: category.trim().toLowerCase() || null,
        tags: itemTags,
        list_id: listId,
      },
    })
    onClose()
  }

  const remove = async () => {
    const snapshot = item
    await del.mutateAsync(item.id)
    onClose()
    toast('Item deleted', {
      action: {
        label: 'Undo',
        onClick: () =>
          add.mutate({
            list_id: snapshot.list_id,
            title: snapshot.title,
            note: snapshot.note,
            category: snapshot.category,
            tags: snapshot.tags,
          }),
      },
    })
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Edit item"
      footer={
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={remove} loading={del.isPending} aria-label="Delete item">
            <Trash2 className="size-4" aria-hidden />
          </Button>
          <Button type="submit" form="item-form" accent="lists" className="flex-1" loading={update.isPending}>
            Save
          </Button>
        </div>
      }
    >
      <form id="item-form" onSubmit={save} className="flex flex-col gap-4">
        <Field label="Title">
          {(id) => (
            <input id={id} className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={300} />
          )}
        </Field>
        <Field label="Note">
          {(id) => (
            <textarea
              id={id}
              className={inputClass + ' min-h-24'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              placeholder="Size, link, where to find it…"
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            {(id) => (
              <>
                <input
                  id={id}
                  className={inputClass}
                  list="item-categories"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  maxLength={40}
                  placeholder="e.g. clothes"
                />
                <datalist id="item-categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          <Field label="List">
            {(id) => (
              <select id={id} className={inputClass} value={listId} onChange={(e) => setListId(e.target.value)}>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} · {LIST_TYPES[l.type].label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field label="Tags">{(id) => <TagInput id={id} value={itemTags} onChange={setItemTags} suggestions={tags} />}</Field>
        <p className="text-xs text-muted">
          Created {format(new Date(item.created_at), 'PPP')}
          {item.done_at && ` · done ${format(new Date(item.done_at), 'PPP')}`}
        </p>
        <ErrorNote error={update.error ?? del.error} />
      </form>
    </Sheet>
  )
}
