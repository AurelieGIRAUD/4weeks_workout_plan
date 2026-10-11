import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Chip, ErrorNote, Field, inputClass, Sheet } from '@/components/ui'
import { LIST_TYPE_ORDER, LIST_TYPES } from '@/lib/meta'
import type { ListType } from '@/lib/types'
import { useCreateList } from './api'

export function NewListSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ListType>('ideas')
  const create = useCreateList()
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const list = await create.mutateAsync({ name: name.trim(), type })
    setName('')
    onClose()
    navigate(`/lists/${list.id}`)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New list"
      footer={
        <Button type="submit" form="new-list" accent="lists" className="w-full" loading={create.isPending} disabled={!name.trim()}>
          Create list
        </Button>
      }
    >
      <form id="new-list" onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Name">
          {(id) => (
            <input
              id={id}
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Japan trip, Groceries with Sam"
              maxLength={80}
              required
            />
          )}
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-muted">Type</span>
          <div className="flex flex-wrap gap-2">
            {LIST_TYPE_ORDER.map((t) => {
              const m = LIST_TYPES[t]
              const Icon = m.icon
              return (
                <Chip key={t} selected={type === t} selectedClass={m.chip} onClick={() => setType(t)}>
                  <Icon className="size-4" aria-hidden /> {m.label}
                </Chip>
              )
            })}
          </div>
        </div>
        <ErrorNote error={create.error} />
      </form>
    </Sheet>
  )
}
