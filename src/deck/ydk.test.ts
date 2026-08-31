import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toCollection } from '../data/cards.ts'
import type { Card, CardDatabase } from '../data/types.ts'
import type { Deck } from './deck.ts'
import { fromYdk, toYdk } from './ydk.ts'

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

const db: CardDatabase = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  cards: [card(111), card(222), card(333, { deck: 'extra', type: 'Link Monster' })],
  // 999 ist ein alternatives Artwork von 111
  aliases: { '999': 111 },
}
const collection = toCollection(db)

test('Export schreibt alle drei Abschnitte in der richtigen Form', () => {
  const deck: Deck = { main: [111, 111], extra: [333], side: [222] }
  assert.equal(
    toYdk(deck),
    ['#created by ygo-deckbuilder', '#main', '111', '111', '#extra', '333', '!side', '222', ''].join(
      '\n',
    ),
  )
})

test('Export und Import ergeben wieder dasselbe Deck', () => {
  const deck: Deck = { main: [111, 222, 222], extra: [333], side: [111] }
  assert.deepEqual(fromYdk(toYdk(deck), collection).deck, deck)
})

test('alternative Artwork-Passcodes werden auf die echte Karte abgebildet', () => {
  const { deck, warnings } = fromYdk('#main\n999\n', collection)
  assert.deepEqual(deck.main, [111])
  assert.deepEqual(warnings, [])
})

test('Windows-Zeilenenden und Leerzeilen stören nicht', () => {
  const { deck } = fromYdk('#main\r\n111\r\n\r\n#extra\r\n333\r\n', collection)
  assert.deepEqual(deck.main, [111])
  assert.deepEqual(deck.extra, [333])
})

test('unbekannte IDs werden übersprungen und gemeldet', () => {
  const { deck, warnings } = fromYdk('#main\n111\n42\n', collection)
  assert.deepEqual(deck.main, [111])
  assert.match(warnings.join(' '), /1 unbekannte Karten-IDs/)
})

test('Kommentarzeilen und Unsinn kippen den Import nicht', () => {
  const { deck, warnings } = fromYdk('#created by jemand\n#main\n111\nabc\n', collection)
  assert.deepEqual(deck.main, [111])
  assert.match(warnings.join(' '), /Zeile übersprungen: abc/)
})

test('IDs vor der ersten Abschnittsmarke werden ignoriert', () => {
  assert.deepEqual(fromYdk('111\n#main\n222\n', collection).deck.main, [222])
})
