import { describe, expect, it } from 'vitest'
import { toCSV } from './csv'

describe('toCSV', () => {
  it('quotes and escapes', () => {
    expect(toCSV([{ a: 'x,y', b: 'say "hi"', c: 'line\nbreak' }])).toBe('a,b,c\r\n"x,y","say ""hi""","line\nbreak"\r\n')
  })
  it('joins arrays, blanks nulls, keeps column order', () => {
    expect(toCSV([{ tags: ['a', 'b'], n: null, z: 1 }], ['z', 'tags', 'n'])).toBe('z,tags,n\r\n1,a; b,\r\n')
  })
  it('neutralises spreadsheet formulas', () => {
    expect(toCSV([{ a: '=SUM(A1)' }])).toBe("a\r\n'=SUM(A1)\r\n")
  })
})
