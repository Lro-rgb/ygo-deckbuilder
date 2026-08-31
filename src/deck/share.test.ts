import assert from 'node:assert/strict'
import { test } from 'node:test'
import { EMPTY_DECK } from './deck.ts'
import { decodeDeck, encodeDeck } from './share.ts'

const deck = { main: [46986414, 46986414, 89631139], extra: [1861629], side: [] }

test('Deck übersteht den Weg durch den Link', () => {
  assert.deepEqual(decodeDeck(encodeDeck(deck)), deck)
})

test('leeres Deck bleibt leer', () => {
  assert.deepEqual(decodeDeck(encodeDeck(EMPTY_DECK)), EMPTY_DECK)
})

test('führendes Doppelkreuz stört nicht', () => {
  assert.deepEqual(decodeDeck(`#${encodeDeck(deck)}`), deck)
})

test('Reihenfolge und Kopien bleiben erhalten', () => {
  assert.equal(encodeDeck(deck), 'rz2y6.rz2y6.1hd3tv~13wfx~')
})

test('fremde Fragmente ergeben kein Deck', () => {
  assert.equal(decodeDeck('#irgendein-anker'), null)
  // Keine Basis-36-Ziffern und die 0 als ID sind beides kaputte Links.
  assert.equal(decodeDeck('!!~~'), null)
  assert.equal(decodeDeck('0~~'), null)
  // Ein Teil kaputt heisst: der ganze Link zählt nicht.
  assert.equal(decodeDeck('rz2y6.!~~'), null)
})

test('drei leere Zonen sind ein leeres Deck, kein Fehler', () => {
  assert.deepEqual(decodeDeck('~~'), EMPTY_DECK)
})
