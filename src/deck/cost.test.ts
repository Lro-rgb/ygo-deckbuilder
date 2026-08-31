import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Card } from '../data/types.ts'
import { EMPTY_DECK } from './deck.ts'
import { cardCostLabel, deckCost } from './cost.ts'

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

const ur = card(1, { md: 'UR', price: 0.34 })
const n = card(2, { md: 'N', price: 0.1 })
const nurPapier = card(3, { price: 12.5 })
const byId = new Map([ur, n, nurPapier].map((c) => [c.id, c]))

test('leeres Deck kostet nichts', () => {
  assert.deepEqual(deckCost(EMPTY_DECK, byId), {
    cp: { N: 0, R: 0, SR: 0, UR: 0 },
    euro: 0,
    ohneMd: 0,
    ohnePreis: 0,
  })
})

test('jede Kopie kostet einzeln, über alle Zonen', () => {
  const kosten = deckCost({ main: [1, 1, 2], extra: [1], side: [2] }, byId)
  // Getrennte Töpfe: gleicher Preis je Kopie, aber die drei UR landen nicht
  // im selben Konto wie die zwei N.
  assert.deepEqual(kosten.cp, { N: 30 * 2, R: 0, SR: 0, UR: 30 * 3 })
  assert.equal(Number(kosten.euro.toFixed(2)), 0.34 * 3 + 0.1 * 2)
})

test('fehlende Angaben werden gezählt, nicht als null gerechnet', () => {
  const kosten = deckCost({ main: [3, 99], extra: [], side: [] }, byId)
  assert.deepEqual(kosten.cp, { N: 0, R: 0, SR: 0, UR: 0 })
  assert.equal(kosten.euro, 12.5)
  assert.equal(kosten.ohneMd, 2)
  // Karte 3 hat einen Preis, die unbekannte 99 nicht.
  assert.equal(kosten.ohnePreis, 1)
})

test('Tooltip nennt Seltenheit, CP und Preis', () => {
  assert.equal(cardCostLabel(ur), '30 UR-CP · 0.34 €')
  assert.equal(cardCostLabel(nurPapier), 'nicht in Master Duel · 12.50 €')
})
