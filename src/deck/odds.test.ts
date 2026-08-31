import assert from 'node:assert/strict'
import { test } from 'node:test'
import { atLeast, choose, drawHand, openingOdds } from './odds.ts'

/** Auf sechs Stellen runden, sonst vergleicht man Gleitkomma-Rauschen. */
function rund(wert: number): number {
  return Number(wert.toFixed(6))
}

test('Binomialkoeffizient gegen bekannte Werte', () => {
  assert.equal(choose(40, 5), 658008)
  assert.equal(choose(37, 5), 435897)
  assert.equal(choose(5, 0), 1)
  assert.equal(choose(3, 5), 0)
})

test('eine Kopie in 40 Karten: genau 5 von 40', () => {
  assert.equal(rund(atLeast(40, 1, 5)), rund(5 / 40))
})

test('drei Kopien in 40 Karten sieht man in gut einem Drittel der Hände', () => {
  // 1 - C(37,5)/C(40,5) — der Wert, den jede Yu-Gi-Oh!-Tabelle mit 33.8 % angibt
  assert.equal(rund(atLeast(40, 3, 5)), rund(1 - 435897 / 658008))
})

test('zwei von drei Kopien sind deutlich seltener als eine', () => {
  assert.ok(atLeast(40, 3, 5, 2) < atLeast(40, 3, 5))
  // Gegenprobe über den anderen Rechenweg: genau 2 Treffer plus genau 3.
  const genau = (treffer: number): number =>
    (choose(3, treffer) * choose(37, 5 - treffer)) / choose(40, 5)
  assert.equal(rund(atLeast(40, 3, 5, 2)), rund(genau(2) + genau(3)))
})

test('Grenzfälle: keine Kopie, kein Wunsch, ganzes Deck', () => {
  assert.equal(atLeast(40, 0, 5), 0)
  assert.equal(atLeast(40, 3, 5, 0), 1)
  assert.equal(atLeast(40, 3, 5, 4), 0)
  assert.equal(rund(atLeast(40, 1, 40)), 1)
})

test('Karten mit mehr Kopien stehen oben', () => {
  const odds = openingOdds([1, 1, 1, 2, 2, 3], 5)
  assert.deepEqual(
    odds.map((eintrag) => [eintrag.id, eintrag.copies]),
    [[1, 3], [2, 2], [3, 1]],
  )
  assert.ok(odds[0].chance > odds[2].chance)
})

test('gezogene Hand hat die richtige Grösse und stammt aus dem Deck', () => {
  const main = Array.from({ length: 40 }, (_, i) => i)
  const hand = drawHand(main, 5)
  assert.equal(hand.length, 5)
  assert.equal(new Set(hand).size, 5)
  assert.ok(hand.every((id) => main.includes(id)))
  assert.deepEqual(main, Array.from({ length: 40 }, (_, i) => i))
})
