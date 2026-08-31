/** In welchen Deckteil die Karte gehört (Side-Deck kann beides aufnehmen). */
export type DeckKind = 'main' | 'extra'

/**
 * Reduzierte Kartendaten. Nur was die App wirklich braucht — die API liefert
 * pro Karte ~20 Felder mehr (Preise, Sets, Rulings), die wir wegwerfen.
 */
export interface Card {
  id: number
  name: string
  /** z.B. "Effect Monster", "Spell Card" */
  type: string
  /** Farbrahmen: normal, effect, ritual, fusion, synchro, xyz, link, spell, trap */
  frameType: string
  desc: string
  /** Bei Monstern die Rasse (Dragon, Spellcaster…), bei Zauber/Fallen die Art (Quick-Play…) */
  race: string
  attribute?: string
  atk?: number
  def?: number
  /** Level bei Main-Deck-Monstern, Rang bei XYZ */
  level?: number
  /** Pendulum-Skala */
  scale?: number
  /** Link-Rating */
  linkval?: number
  archetype?: string
  deck: DeckKind
  /**
   * Erlaubte Kopien laut TCG-Banlist (0 = Banned, 1 = Limited, 2 = Semi-Limited).
   * Fehlt das Feld, sind 3 Kopien erlaubt.
   */
  limit?: 0 | 1 | 2
  /** Fehlt, wenn es die Karte in Master Duel (noch) nicht gibt. */
  md?: MdRarity
  /**
   * Richtpreis einer einzelnen Karte auf Cardmarket in Euro, aus dem Import.
   * Eine Momentaufnahme, kein Angebot: der echte Preis hängt an Auflage,
   * Zustand und Anbieter. Fehlt, wenn keine Verkäufe bekannt sind.
   */
  price?: number
}

/** Seltenheit in Master Duel; bestimmt, was das Herstellen kostet. */
export type MdRarity = 'N' | 'R' | 'SR' | 'UR'

export interface CardDatabase {
  generatedAt: string
  cards: Card[]
  /**
   * Alternative Artwork-Passcodes → echte Karten-ID. Nötig, weil .ydk-Dateien
   * aus anderen Tools solche Passcodes enthalten können.
   */
  aliases: Record<string, number>
}
