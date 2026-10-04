import type { ListType } from './types'

/** Prefix → list type. Some prefixes also add a tag. */
export const QUICK_ADD_PREFIXES: Record<string, { type: ListType; tags?: string[] }> = {
  buy: { type: 'need_to_buy' },
  need: { type: 'need_to_buy' },
  shop: { type: 'need_to_buy' },
  want: { type: 'want_to_buy' },
  wish: { type: 'want_to_buy' },
  chore: { type: 'chores' },
  clean: { type: 'chores' },
  home: { type: 'chores' },
  todo: { type: 'todo' },
  do: { type: 'todo' },
  idea: { type: 'ideas' },
  trip: { type: 'ideas', tags: ['travel'] },
  travel: { type: 'ideas', tags: ['travel'] },
}

export interface ParsedQuickAdd {
  /** null when no known prefix was typed — the selected chip decides. */
  type: ListType | null
  title: string
  tags: string[]
  category: string | null
}

const PREFIX_RE = /^\s*([a-z]+)\s*:\s*(.*)$/is
// A tag/category token must start the string or follow whitespace, so
// "C# book" or "bob@example.com" stay part of the title.
const TAG_RE = /(^|\s)#([\p{L}\p{N}_-]+)/gu
const CATEGORY_RE = /(^|\s)@([\p{L}\p{N}_-]+)/gu

export function normalizeTag(tag: string): string {
  return tag.trim().replace(/^#/, '').toLowerCase()
}

export function parseQuickAdd(input: string): ParsedQuickAdd {
  let text = input
  let type: ListType | null = null
  const tags: string[] = []

  const prefix = PREFIX_RE.exec(text)
  if (prefix) {
    const rule = QUICK_ADD_PREFIXES[prefix[1].toLowerCase()]
    if (rule) {
      type = rule.type
      tags.push(...(rule.tags ?? []))
      text = prefix[2]
    }
  }

  let category: string | null = null
  text = text.replace(CATEGORY_RE, (_m, lead: string, cat: string) => {
    category = cat.toLowerCase()
    return lead
  })
  text = text.replace(TAG_RE, (_m, lead: string, tag: string) => {
    tags.push(normalizeTag(tag))
    return lead
  })

  return {
    type,
    title: text.replace(/\s+/g, ' ').trim(),
    tags: [...new Set(tags)],
    category,
  }
}
