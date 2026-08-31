import type { Card, MdRarity } from '../data/types.ts'
import type { Deck } from './deck.ts'

/**
 * Was eine Kopie in Master Duel zu erstellen kostet. N und R kosten dasselbe,
 * das ist im Spiel so und kein Tippfehler. Zerlegen bringt weniger zurück,
 * hier geht es aber ums Bauen.
 */
export const CRAFT_CP: Record<MdRarity, number> = { N: 30, R: 30, SR: 100, UR: 300 }

export interface DeckCost {
  /** Craft-Kosten in CP für alle Kopien zusammen. */
  cp: number
  /** Summe der Cardmarket-Richtpreise in Euro. */
  euro: number
  /** Kopien, die es in Master Duel nicht gibt — sie fehlen in der CP-Summe. */
  ohneMd: number
  /** Kopien ohne bekannten Preis — sie fehlen in der Euro-Summe. */
  ohnePreis: number
}

/**
 * Kosten über alle drei Zonen: auch Side- und Extra-Deck-Karten muss man
 * besitzen. Was fehlt, wird gezählt statt verschwiegen, sonst sieht eine
 * unvollständige Summe aus wie eine vollständige.
 */
export function deckCost(deck: Deck, byId: Map<number, Card>): DeckCost {
  const kosten: DeckCost = { cp: 0, euro: 0, ohneMd: 0, ohnePreis: 0 }

  for (const id of [...deck.main, ...deck.extra, ...deck.side]) {
    const card = byId.get(id)
    if (card === undefined) {
      kosten.ohneMd++
      kosten.ohnePreis++
      continue
    }
    if (card.md === undefined) kosten.ohneMd++
    else kosten.cp += CRAFT_CP[card.md]
    if (card.price === undefined) kosten.ohnePreis++
    else kosten.euro += card.price
  }

  return kosten
}

/** Kurzform für einen Tooltip: "UR · 300 CP · 0.34 €" */
export function cardCostLabel(card: Card): string {
  const teile = card.md === undefined ? ['nicht in Master Duel'] : [card.md, `${String(CRAFT_CP[card.md])} CP`]
  if (card.price !== undefined) teile.push(`${card.price.toFixed(2)} €`)
  return teile.join(' · ')
}
