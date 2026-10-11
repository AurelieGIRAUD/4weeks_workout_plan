import type { ListItem } from '@/lib/types'

export interface ItemFilter {
  q: string
  category: string | null
  tag: string | null
}

export function filterItems(items: ListItem[], f: ItemFilter): ListItem[] {
  const q = f.q.trim().toLowerCase()
  return items.filter(
    (i) =>
      (!f.category || i.category === f.category) &&
      (!f.tag || i.tags.includes(f.tag)) &&
      (!q ||
        i.title.toLowerCase().includes(q) ||
        i.note?.toLowerCase().includes(q) ||
        i.tags.some((t) => t.includes(q)) ||
        i.category?.includes(q)),
  )
}

/** Distinct categories and tags, most used first. */
export function facets(items: ListItem[]) {
  const cats = new Map<string, number>()
  const tags = new Map<string, number>()
  for (const i of items) {
    if (i.category) cats.set(i.category, (cats.get(i.category) ?? 0) + 1)
    for (const t of i.tags) tags.set(t, (tags.get(t) ?? 0) + 1)
  }
  const sort = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k)
  return { categories: sort(cats), tags: sort(tags) }
}
