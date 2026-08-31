import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Card } from '../data/types.ts'
import { EMPTY_DECK, addCard, removeAt, validate, whyNotAdd, type Deck } from './deck.ts'

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

const monster = card(1)
const extraMonster = card(2, { deck: 'extra', type: 'Link Monster', frameType: 'link' })
const verboten = card(3, { limit: 0 })
const limitiert = card(4, { limit: 1 })

function decked(zone: 'main' | 'extra' | 'side', ids: number[]): Deck {
  return { ...EMPTY_DECK, [zone]: ids }
}

test('normale Karte darf ins Main Deck', () => {
  assert.equal(whyNotAdd(EMPTY_DECK, monster, 'main'), null)
})

test('Extra-Deck-Karte darf nicht ins Main Deck und umgekehrt', () => {
  assert.match(whyNotAdd(EMPTY_DECK, extraMonster, 'main') ?? '', /Extra Deck/)
  assert.match(whyNotAdd(EMPTY_DECK, monster, 'extra') ?? '', /Main Deck/)
})

test('Side Deck nimmt beides auf', () => {
  assert.equal(whyNotAdd(EMPTY_DECK, monster, 'side'), null)
  assert.equal(whyNotAdd(EMPTY_DECK, extraMonster, 'side'), null)
})

test('vierte Kopie wird abgelehnt', () => {
  const deck = decked('main', [1, 1, 1])
  assert.match(whyNotAdd(deck, monster, 'main') ?? '', /3 Kopien/)
})

test('Kopien zählen über alle Zonen zusammen', () => {
  // Eine im Main, eine im Side: die dritte geht noch, die vierte nirgends mehr.
  const zwei: Deck = { main: [1], extra: [], side: [1] }
  assert.equal(whyNotAdd(zwei, monster, 'main'), null)

  const drei = addCard(zwei, monster, 'main')
  assert.match(whyNotAdd(drei, monster, 'side') ?? '', /3 Kopien/)
  assert.match(whyNotAdd(drei, monster, 'main') ?? '', /3 Kopien/)
})

test('Banlist schlägt die Standardgrenze', () => {
  assert.match(whyNotAdd(EMPTY_DECK, verboten, 'main') ?? '', /Verbotsliste/)
  assert.equal(whyNotAdd(EMPTY_DECK, limitiert, 'main'), null)
  assert.match(whyNotAdd(decked('main', [4]), limitiert, 'main') ?? '', /1 Kopie erlaubt/)
})

test('volle Zone lehnt ab', () => {
  const vollesExtra = decked('extra', Array.from({ length: 15 }, () => 2))
  assert.match(whyNotAdd(vollesExtra, extraMonster, 'extra') ?? '', /voll/)
})

test('removeAt entfernt genau eine Kopie', () => {
  assert.deepEqual(removeAt(decked('main', [1, 1, 1]), 'main', 0).main, [1, 1])
})

test('validate meldet zu kleines Main Deck', () => {
  const issues = validate(decked('main', [1]), new Map([[1, monster]]))
  assert.match(issues.join('\n'), /Main Deck: 1 Karten, mindestens 40/)
})

test('validate findet importierte Regelverstösse', () => {
  const byId = new Map([
    [1, monster],
    [3, verboten],
  ])
  const deck: Deck = { main: [1, 1, 1, 1, 3], extra: [], side: [] }
  const issues = validate(deck, byId).join('\n')
  assert.match(issues, /4 Kopien, erlaubt sind 3/)
  assert.match(issues, /Verbotsliste/)
})

test('validate akzeptiert ein regelkonformes Deck', () => {
  const byId = new Map<number, Card>()
  const main: number[] = []
  for (let i = 0; i < 20; i++) {
    const c = card(100 + i)
    byId.set(c.id, c)
    main.push(c.id, c.id)
  }
  assert.deepEqual(validate({ main, extra: [], side: [] }, byId), [])
})

test('validate findet Karten in der falschen Zone', () => {
  const byId = new Map([
    [1, monster],
    [2, extraMonster],
  ])
  // So kann nur ein Import aussehen, über die Oberfläche geht das nicht.
  const issues = validate({ main: [2], extra: [1], side: [] }, byId).join('\n')
  assert.match(issues, /Karte 2 liegt im Main Deck, gehört aber ins Extra Deck/)
  assert.match(issues, /Karte 1 liegt im Extra Deck, gehört aber ins Main Deck/)
})
