import { describe, expect, it } from 'vitest'
import type { ListItem } from '@/lib/types'
import { facets, filterItems } from './filter'

const item = (p: Partial<ListItem>): ListItem => ({
  id: Math.random().toString(36),
  list_id: 'l',
  created_by: null,
  title: 'x',
  note: null,
  category: null,
  tags: [],
  done: false,
  done_at: null,
  done_by: null,
  archived_at: null,
  position: null,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  ...p,
})

const items = [
  item({ title: 'Running shoes', category: 'clothes', tags: ['sport'] }),
  item({ title: 'Milk', category: 'food', tags: ['groceries'] }),
  item({ title: 'Jacket', category: 'clothes', note: 'waterproof, size M' }),
]

describe('filterItems', () => {
  it('searches title, note, tags and category', () => {
    expect(filterItems(items, { q: 'water', category: null, tag: null }).map((i) => i.title)).toEqual(['Jacket'])
    expect(filterItems(items, { q: 'groc', category: null, tag: null }).map((i) => i.title)).toEqual(['Milk'])
  })
  it('combines category and tag', () => {
    expect(filterItems(items, { q: '', category: 'clothes', tag: 'sport' }).map((i) => i.title)).toEqual(['Running shoes'])
  })
})

describe('facets', () => {
  it('orders by usage', () => {
    expect(facets(items).categories).toEqual(['clothes', 'food'])
  })
})
