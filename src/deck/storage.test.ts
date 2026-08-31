import assert from 'node:assert/strict'
import { test } from 'node:test'
import { EMPTY_DECK } from './deck.ts'
import { parseDeck } from './storage.ts'

test('leerer Speicher gibt ein leeres Deck', () => {
  assert.deepEqual(parseDeck(null), EMPTY_DECK)
})

test('gültiges Deck kommt unverändert zurück', () => {
  const deck = { main: [1, 1, 2], extra: [3], side: [] }
  assert.deepEqual(parseDeck(JSON.stringify(deck)), deck)
})

test('kaputtes JSON wirft nicht', () => {
  assert.deepEqual(parseDeck('{nicht mal JSON'), EMPTY_DECK)
})

test('fremde Werte werden aussortiert', () => {
  assert.deepEqual(parseDeck('{"main":[1,"zwei",null,3.5,4],"extra":"nope"}'), {
    main: [1, 4],
    extra: [],
    side: [],
  })
})
