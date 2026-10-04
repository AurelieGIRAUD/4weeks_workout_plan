import { Archive, ArchiveRestore, ArrowLeft, ChevronDown, Pencil, Plus, Trash2, UserPlus, Users, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useUserId } from '@/auth/AuthProvider'
import { Avatar } from '@/components/Avatar'
import { useToast } from '@/components/Toast'
import { Button, Card, Chip, cx, EmptyState, ErrorNote, IconButton, inputClass, Sheet, Spinner } from '@/components/ui'
import { relativeDay, toISODate } from '@/lib/dates'
import { LIST_TYPES } from '@/lib/meta'
import { useProfile, useUpdateProfile } from '@/lib/profile'
import { parseQuickAdd } from '@/lib/quickAdd'
import type { ListItem } from '@/lib/types'
import {
  useAddItem,
  useArchiveCompleted,
  useArchivedItems,
  useDeleteItem,
  useDeleteList,
  useLists,
  useOpenItems,
  useRenameList,
  useRestoreItems,
  useUpdateItem,
} from './api'
import { facets, filterItems } from './filter'
import { ItemEditor } from './ItemEditor'
import { ItemRow } from './ItemRow'
import { ShareSheet } from './ShareSheet'

export default function ListDetailPage() {
  const { listId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const userId = useUserId()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: lists, isLoading } = useLists()
  const { data: allItems } = useOpenItems()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const add = useAddItem()
  const update = useUpdateItem()
  const archive = useArchiveCompleted()
  const restore = useRestoreItems()
  const deleteItem = useDeleteItem()
  const rename = useRenameList()
  const deleteList = useDeleteList()

  const [draft, setDraft] = useState('')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [tag, setTag] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

  const list = lists?.find((l) => l.id === listId)
  const archived = useArchivedItems(listId, showArchived)
  const items = useMemo(() => (allItems ?? []).filter((i) => i.list_id === listId), [allItems, listId])
  const { categories, tags } = useMemo(() => facets(items), [items])
  const visible = filterItems(items, { q, category, tag })
  const open = visible.filter((i) => !i.done)
  const done = visible.filter((i) => i.done).sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? ''))

  const editingId = params.get('item')
  const editing: ListItem | null =
    (editingId && (items.find((i) => i.id === editingId) ?? archived.data?.find((i) => i.id === editingId))) || null
  const openEditor = (id: string | null) =>
    setParams(
      (p) => {
        if (id) p.set('item', id)
        else p.delete('item')
        return p
      },
      { replace: true },
    )

  if (isLoading) return <Spinner className="mx-auto mt-10" />
  if (!list) {
    return (
      <EmptyState
        emoji="🫥"
        title="List not found"
        hint="It may have been deleted, or it is no longer shared with you."
        action={<Link to="/lists" className="font-semibold text-amber-600 underline">Back to lists</Link>}
      />
    )
  }

  const meta = LIST_TYPES[list.type]
  const Icon = meta.icon
  const isOwner = list.owner_id === userId
  const isQuickAddTarget =
    profile?.quick_add_targets?.[list.type] === list.id || (!profile?.quick_add_targets?.[list.type] && list.is_default && isOwner)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseQuickAdd(draft)
    if (!parsed.title) return
    await add.mutateAsync({ list_id: list.id, title: parsed.title, tags: parsed.tags, category: parsed.category })
    setDraft('')
  }

  const archiveDone = async () => {
    const res = await archive.mutateAsync(list.id)
    toast(`Archived ${res.length} item${res.length === 1 ? '' : 's'}`, {
      action: { label: 'Undo', onClick: () => restore.mutate(res.map((r) => r.id)) },
    })
  }

  const toggleQuickAdd = () => {
    const targets = { ...profile?.quick_add_targets }
    if (isQuickAddTarget) delete targets[list.type]
    else targets[list.type] = list.id
    updateProfile.mutate({ quick_add_targets: targets })
  }

  const removeList = async () => {
    if (!confirm(`Delete "${list.name}" and all its items? This can't be undone.`)) return
    await deleteList.mutateAsync(list.id)
    navigate('/lists')
  }

  return (
    <>
      <header className="mb-4 flex items-center gap-2">
        <IconButton label="Back to lists" onClick={() => navigate('/lists')} className="-ml-2">
          <ArrowLeft className="size-5" />
        </IconButton>
        <div className={cx('grid size-11 shrink-0 place-items-center rounded-2xl', meta.soft, meta.text)}>
          <Icon className="size-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">{list.name}</h1>
          <p className="truncate text-sm text-muted">
            {meta.label}
            {!isOwner && ` · shared by ${list.owner?.display_name || list.owner?.email}`}
          </p>
        </div>
        {(list.members?.length ?? 0) > 0 || !isOwner ? (
          <button
            type="button"
            onClick={() => setSharing(true)}
            className="flex items-center -space-x-2 rounded-full p-1 transition hover:bg-card-2"
            aria-label="People on this list"
          >
            {list.owner && <Avatar name={list.owner.display_name} email={list.owner.email} />}
            <span className="grid size-8 place-items-center rounded-full bg-sky-100 text-sky-700 ring-2 ring-card dark:bg-sky-500/20 dark:text-sky-200">
              <Users className="size-4" aria-hidden />
            </span>
          </button>
        ) : (
          <IconButton label="Share list" onClick={() => setSharing(true)}>
            <UserPlus className="size-5" />
          </IconButton>
        )}
        {isOwner && (
          <IconButton label="Rename list" onClick={() => setRenaming(list.name)}>
            <Pencil className="size-5" />
          </IconButton>
        )}
        {isOwner && !list.is_default && (
          <IconButton label="Delete list" onClick={removeList}>
            <Trash2 className="size-5" />
          </IconButton>
        )}
      </header>

      <form onSubmit={submit} className="mb-3 flex gap-2">
        <input
          className={inputClass}
          placeholder="Add an item… (#tag @category)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          enterKeyHint="done"
          aria-label={`Add to ${list.name}`}
        />
        <Button type="submit" accent="lists" aria-label="Add item" loading={add.isPending} disabled={!draft.trim()}>
          <Plus className="size-5" aria-hidden />
        </Button>
      </form>
      <ErrorNote error={add.error} />

      <div className="mb-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="search"
            className={cx(inputClass, 'py-2')}
            placeholder="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search this list"
          />
          {categories.length > 0 && (
            <select
              className={cx(inputClass, 'w-auto py-2')}
              value={category ?? ''}
              onChange={(e) => setCategory(e.target.value || null)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
        {tags.length > 0 && (
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by tag">
            {tags.map((t) => (
              <Chip key={t} selected={tag === t} selectedClass={meta.chip} onClick={() => setTag(tag === t ? null : t)}>
                #{t}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <Card className="p-2 sm:p-3">
        {open.length === 0 && done.length === 0 ? (
          <EmptyState
            emoji={items.length === 0 ? '🌱' : '🔍'}
            title={items.length === 0 ? 'Nothing here yet' : 'No matches'}
            hint={items.length === 0 ? 'Add your first item above.' : 'Try clearing the filters.'}
          />
        ) : (
          <>
            {open.length === 0 && <p className="px-3 py-4 text-center font-semibold text-muted">All done! 🎉</p>}
            <ul>
              {open.map((i) => (
                <ItemRow
                  key={i.id}
                  item={i}
                  type={list.type}
                  onToggle={(d) => update.mutate({ id: i.id, patch: { done: d } })}
                  onOpen={() => openEditor(i.id)}
                />
              ))}
            </ul>
            {done.length > 0 && (
              <div className="mt-2 border-t border-line pt-2">
                <div className="flex items-center justify-between px-2">
                  <button
                    className="flex items-center gap-1 py-1 text-sm font-bold text-muted"
                    onClick={() => setShowDone((v) => !v)}
                    aria-expanded={showDone}
                  >
                    <ChevronDown className={cx('size-4 transition', !showDone && '-rotate-90')} aria-hidden />
                    Done ({done.length})
                  </button>
                  <Button variant="soft" accent="lists" size="sm" onClick={archiveDone} loading={archive.isPending}>
                    <Archive className="size-4" aria-hidden /> Archive completed
                  </Button>
                </div>
                {showDone && (
                  <ul>
                    {done.map((i) => (
                      <ItemRow
                        key={i.id}
                        item={i}
                        type={list.type}
                        onToggle={(d) => update.mutate({ id: i.id, patch: { done: d } })}
                        onOpen={() => openEditor(i.id)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip selected={isQuickAddTarget} selectedClass={meta.chip} onClick={toggleQuickAdd}>
          <Zap className="size-4" aria-hidden /> Quick-add “{meta.prefix}” goes here
        </Chip>
        <Chip selected={showArchived} onClick={() => setShowArchived((v) => !v)} selectedClass="bg-slate-500 text-white">
          <Archive className="size-4" aria-hidden /> Archived
        </Chip>
      </div>

      {showArchived && (
        <Card className="mt-3 p-2 sm:p-3">
          {archived.isLoading ? (
            <Spinner className="mx-auto my-4" />
          ) : (archived.data ?? []).length === 0 ? (
            <p className="p-4 text-center text-sm text-muted">No archived items.</p>
          ) : (
            <ul>
              {archived.data!.map((i) => (
                <li key={i.id} className="flex items-center gap-2 rounded-2xl px-2 py-2 hover:bg-card-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-muted line-through">{i.title}</span>
                    <span className="text-xs text-muted">archived {relativeDay(toISODate(new Date(i.archived_at!)))}</span>
                  </span>
                  <IconButton label={`Restore ${i.title}`} onClick={() => restore.mutate([i.id])}>
                    <ArchiveRestore className="size-5" />
                  </IconButton>
                  <IconButton label={`Delete ${i.title}`} onClick={() => deleteItem.mutate(i.id)}>
                    <Trash2 className="size-5" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <ItemEditor
        item={editing}
        lists={lists ?? []}
        categories={categories}
        tags={tags}
        onClose={() => openEditor(null)}
      />

      <ShareSheet list={list} open={sharing} onClose={() => setSharing(false)} />

      <Sheet
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title="Rename list"
        footer={
          <Button
            type="submit"
            form="rename-list"
            accent="lists"
            className="w-full"
            loading={rename.isPending}
            disabled={!renaming?.trim()}
          >
            Save
          </Button>
        }
      >
        <form
          id="rename-list"
          onSubmit={async (e) => {
            e.preventDefault()
            await rename.mutateAsync({ id: list.id, name: renaming!.trim() })
            setRenaming(null)
          }}
        >
          <input
            className={inputClass}
            value={renaming ?? ''}
            onChange={(e) => setRenaming(e.target.value)}
            maxLength={80}
            aria-label="List name"
          />
        </form>
      </Sheet>
    </>
  )
}
