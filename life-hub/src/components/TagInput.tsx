import { X } from 'lucide-react'
import { useState } from 'react'
import { normalizeTag } from '@/lib/quickAdd'
import { inputClass } from './ui'

export function TagInput({
  id,
  value,
  onChange,
  suggestions = [],
}: {
  id?: string
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
}) {
  const [draft, setDraft] = useState('')

  const add = (raw: string) => {
    const tags = raw.split(/[,\s]+/).map(normalizeTag).filter(Boolean)
    if (tags.length) onChange([...new Set([...value, ...tags])])
    setDraft('')
  }

  const unused = suggestions.filter((s) => !value.includes(s)).slice(0, 8)

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <li key={t}>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== t))}
                className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
                aria-label={`Remove tag ${t}`}
              >
                #{t} <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        className={inputClass}
        placeholder="Add tags (Enter or comma)"
        value={draft}
        enterKeyHint="done"
        onChange={(e) => {
          const v = e.target.value
          if (/[,]$/.test(v)) add(v)
          else setDraft(v)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add(draft)
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={() => draft && add(draft)}
      />
      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              className="rounded-full bg-card-2 px-2.5 py-1 text-xs font-semibold text-muted hover:text-ink"
              onClick={() => onChange([...value, s])}
            >
              + #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
