/**
 * Binomialkoeffizient, multiplikativ gerechnet statt über Fakultäten: so
 * bleibt jeder Zwischenwert klein genug, um exakt in einer Gleitkommazahl zu
 * liegen. C(40,5) wären als Fakultät schon 40! — weit jenseits von Number.
 */
export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  let ergebnis = 1
  // Nach jedem Schritt ist das Zwischenergebnis wieder eine ganze Zahl,
  // darum ist das Teilen hier verlustfrei.
  for (let i = 0; i < k; i++) ergebnis = (ergebnis * (n - i)) / (i + 1)
  return ergebnis
}

/**
 * Hypergeometrische Verteilung: Chance, beim Ziehen von `handSize` Karten aus
 * einem Deck von `deckSize` Karten mindestens `wanted` der `copies` Kopien zu
 * erwischen. Gerechnet wird über die Gegenwahrscheinlichkeit, weil die Summe
 * über die schlechten Fälle (0 … wanted-1 Treffer) kürzer ist.
 *
 * Das ist die exakte Zahl — eine Simulation würde dieselbe nur annähern.
 */
export function atLeast(deckSize: number, copies: number, handSize: number, wanted = 1): number {
  if (wanted <= 0) return 1
  if (deckSize <= 0 || handSize > deckSize || copies < wanted || handSize < wanted) return 0

  let zuWenig = 0
  for (let treffer = 0; treffer < wanted; treffer++) {
    zuWenig += choose(copies, treffer) * choose(deckSize - copies, handSize - treffer)
  }
  return 1 - zuWenig / choose(deckSize, handSize)
}

export interface CardOdds {
  id: number
  copies: number
  /** Chance auf mindestens eine Kopie in der Starthand, 0 … 1 */
  chance: number
}

/** Je eindeutiger Karte im Main Deck: wie viele Kopien und wie oft man sie sieht. */
export function openingOdds(main: number[], handSize: number): CardOdds[] {
  const kopien = new Map<number, number>()
  for (const id of main) kopien.set(id, (kopien.get(id) ?? 0) + 1)

  return [...kopien]
    .map(([id, copies]) => ({ id, copies, chance: atLeast(main.length, copies, handSize) }))
    .sort((a, b) => b.chance - a.chance || a.id - b.id)
}

/** Fisher-Yates auf einer Kopie — das Deck selbst bleibt in seiner Reihenfolge. */
export function drawHand(main: number[], handSize: number): number[] {
  const rest = [...main]
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return rest.slice(0, handSize)
}
