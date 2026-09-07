import type { Card } from '../data/types.ts'
import type { Deck } from './deck.ts'

/** Deutsche Namen der Extra-Deck-Arten; der Kartenrahmen verrät sie. */
const ART_LABELS: Record<string, string> = {
  fusion: 'Fusion',
  synchro: 'Synchro',
  xyz: 'XYZ',
  link: 'Link',
  ritual: 'Ritual',
}

export interface DeckStats {
  /** Das Verhältnis, das man an einem Main Deck zuerst abliest. */
  arten: { monster: number; zauber: number; falle: number }
  /** Stufen und Ränge der Main-Deck-Monster, aufsteigend. Nur belegte Stufen. */
  stufen: { level: number; count: number }[]
  /** Extra Deck nach Art, häufigste zuerst. */
  extra: { art: string; count: number }[]
}

/**
 * Zählt, woraus das Deck besteht. Alles steckt schon in den Kartendaten, hier
 * wird nur gruppiert. Unbekannte IDs werden übersprungen — die meldet
 * ohnehin validate(), und eine Kurve mit Lücke lügt weniger als eine mit
 * erfundenem Eintrag.
 */
export function deckStats(deck: Deck, byId: Map<number, Card>): DeckStats {
  const arten = { monster: 0, zauber: 0, falle: 0 }
  const stufen = new Map<number, number>()

  for (const id of deck.main) {
    const card = byId.get(id)
    if (card === undefined) continue
    if (card.frameType === 'spell') arten.zauber++
    else if (card.frameType === 'trap') arten.falle++
    else {
      arten.monster++
      // Ohne Stufe (Link-Monster) taucht die Karte in der Kurve nicht auf.
      if (card.level !== undefined) stufen.set(card.level, (stufen.get(card.level) ?? 0) + 1)
    }
  }

  const extra = new Map<string, number>()
  for (const id of deck.extra) {
    const card = byId.get(id)
    if (card === undefined) continue
    // Pendulum-Rahmen heissen z.B. "fusion_pendulum" — die Art steht vorne.
    const rahmen = card.frameType.split('_')[0]
    const art = ART_LABELS[rahmen] ?? rahmen
    extra.set(art, (extra.get(art) ?? 0) + 1)
  }

  return {
    arten,
    stufen: [...stufen]
      .sort((a, b) => a[0] - b[0])
      .map(([level, count]) => ({ level, count })),
    extra: [...extra]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([art, count]) => ({ art, count })),
  }
}
