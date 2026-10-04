import { describe, expect, it } from 'vitest'
import { parseQuickAdd } from './quickAdd'

describe('parseQuickAdd', () => {
  it('routes a known prefix', () => {
    expect(parseQuickAdd('buy: shoes')).toEqual({ type: 'need_to_buy', title: 'shoes', tags: [], category: null })
    expect(parseQuickAdd('Want:  new headphones ')).toMatchObject({ type: 'want_to_buy', title: 'new headphones' })
    expect(parseQuickAdd('chore:vacuum')).toMatchObject({ type: 'chores', title: 'vacuum' })
  })

  it('leaves unknown prefixes in the title', () => {
    expect(parseQuickAdd('Note: call mum')).toEqual({ type: null, title: 'Note: call mum', tags: [], category: null })
  })

  it('extracts tags and category', () => {
    expect(parseQuickAdd('buy: running shoes #Sport #sport @Clothes')).toEqual({
      type: 'need_to_buy',
      title: 'running shoes',
      tags: ['sport'],
      category: 'clothes',
    })
  })

  it('adds implied tags', () => {
    expect(parseQuickAdd('trip: Lisbon in May #spring')).toEqual({
      type: 'ideas',
      title: 'Lisbon in May',
      tags: ['travel', 'spring'],
      category: null,
    })
  })

  it('keeps # and @ that are part of words', () => {
    expect(parseQuickAdd('todo: read C# book, email bob@example.com')).toMatchObject({
      title: 'read C# book, email bob@example.com',
      tags: [],
      category: null,
    })
  })

  it('supports unicode tags', () => {
    expect(parseQuickAdd('idea: café crème #été').tags).toEqual(['été'])
  })

  it('returns an empty title when only tags were typed', () => {
    expect(parseQuickAdd('buy: #x').title).toBe('')
  })
})
