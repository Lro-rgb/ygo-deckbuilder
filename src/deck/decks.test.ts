import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseDecks } from './decks.ts'

test('leerer Speicher gibt keine Decks', () => {
  assert.deepEqual(parseDecks(null), {})
})

test('gespeicherte Decks kommen unter ihrem Namen zurück', () => {
  const decks = { Blaudrache: { main: [1, 1], extra: [2], side: [] } }
  assert.deepEqual(parseDecks(JSON.stringify(decks)), decks)
})

test('kaputtes JSON wirft nicht', () => {
  assert.deepEqual(parseDecks('{nicht mal JSON'), {})
})

test('eine Liste ist kein Deckverzeichnis', () => {
  assert.deepEqual(parseDecks('[1,2,3]'), {})
})

test('fremde Werte in einem Deck werden aussortiert', () => {
  assert.deepEqual(parseDecks('{"Test":{"main":[1,"zwei",3.5,4],"extra":"nope"}}'), {
    Test: { main: [1, 4], extra: [], side: [] },
  })
})

test('ein Name ohne brauchbares Deck ergibt ein leeres Deck', () => {
  assert.deepEqual(parseDecks('{"Test":null}'), {
    Test: { main: [], extra: [], side: [] },
  })
})
