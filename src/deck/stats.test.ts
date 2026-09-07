import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Card } from '../data/types.ts'
import { EMPTY_DECK } from './deck.ts'
import { deckStats } from './stats.ts'

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

const monster4 = card(1, { level: 4 })
const monster8 = card(2, { level: 8 })
const zauber = card(3, { frameType: 'spell', type: 'Spell Card' })
const falle = card(4, { frameType: 'trap', type: 'Trap Card' })
const linkMonster = card(5, { frameType: 'link', deck: 'extra', linkval: 2 })
const fusion = card(6, { frameType: 'fusion', deck: 'extra', level: 6 })
const pendelFusion = card(7, { frameType: 'fusion_pendulum', deck: 'extra', level: 4 })

const byId = new Map(
  [monster4, monster8, zauber, falle, linkMonster, fusion, pendelFusion].map((c) => [c.id, c]),
)

test('leeres Deck gibt leere Zahlen', () => {
  assert.deepEqual(deckStats(EMPTY_DECK, byId), {
    arten: { monster: 0, zauber: 0, falle: 0 },
    stufen: [],
    extra: [],
  })
})

test('Monster, Zauber und Fallen werden getrennt gezählt', () => {
  const deck = { main: [1, 1, 2, 3, 3, 3, 4], extra: [], side: [] }
  assert.deepEqual(deckStats(deck, byId).arten, { monster: 3, zauber: 3, falle: 1 })
})

test('die Stufenkurve steigt und zählt nur Main-Deck-Monster', () => {
  const deck = { main: [2, 1, 1, 3], extra: [], side: [] }
  assert.deepEqual(deckStats(deck, byId).stufen, [
    { level: 4, count: 2 },
    { level: 8, count: 1 },
  ])
})

test('Link-Monster ohne Stufe fehlen in der Kurve, nicht in der Zählung', () => {
  const deck = { main: [5, 1], extra: [], side: [] }
  const stats = deckStats(deck, byId)
  assert.equal(stats.arten.monster, 2)
  assert.deepEqual(stats.stufen, [{ level: 4, count: 1 }])
})

test('Pendulum-Rahmen zählen zu ihrer Art', () => {
  const deck = { main: [], extra: [6, 7, 5], side: [] }
  assert.deepEqual(deckStats(deck, byId).extra, [
    { art: 'Fusion', count: 2 },
    { art: 'Link', count: 1 },
  ])
})

test('das Side Deck verzerrt die Zahlen nicht', () => {
  const deck = { main: [1], extra: [], side: [3, 4, 6] }
  const stats = deckStats(deck, byId)
  assert.deepEqual(stats.arten, { monster: 1, zauber: 0, falle: 0 })
  assert.deepEqual(stats.extra, [])
})

test('unbekannte IDs werden übersprungen statt geraten', () => {
  const deck = { main: [1, 999], extra: [999], side: [] }
  const stats = deckStats(deck, byId)
  assert.equal(stats.arten.monster, 1)
  assert.deepEqual(stats.extra, [])
})
