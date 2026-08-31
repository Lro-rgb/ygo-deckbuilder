import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Card } from '../data/types.ts'
import { EMPTY_QUERY, createSearchIndex, filterCards } from './filter.ts'

function card(id: number, over: Partial<Card> = {}): Card {
  return {
    id,
    name: `Karte ${String(id)}`,
    type: 'Effect Monster',
    frameType: 'effect',
    desc: '',
    race: 'Dragon',
    deck: 'main',
    ...over,
  }
}

const index = createSearchIndex([
  card(1, { md: 'UR' }),
  card(2, { md: 'SR' }),
  card(3, { md: 'UR' }),
  card(4),
])

function ids(md: (typeof EMPTY_QUERY)['md']): number[] {
  return filterCards(index, { ...EMPTY_QUERY, md }).map((treffer) => treffer.id)
}

test('ohne Filter kommen alle Karten', () => {
  assert.deepEqual(ids(null), [1, 2, 3, 4])
})

test('nach Seltenheit filtern', () => {
  assert.deepEqual(ids('UR'), [1, 3])
  assert.deepEqual(ids('SR'), [2])
  assert.deepEqual(ids('N'), [])
})

test('"keine" findet die Karten ausserhalb von Master Duel', () => {
  assert.deepEqual(ids('keine'), [4])
})
