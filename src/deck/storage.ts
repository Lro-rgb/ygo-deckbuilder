import { EMPTY_DECK, type Deck } from './deck.ts'

const KEY = 'ygo-deckbuilder:deck'

/** Eine Zone aus gespeichertem JSON: nur ganze Zahlen überleben. */
function ids(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry: unknown): entry is number => Number.isInteger(entry))
}

/**
 * Der gespeicherte Text kommt aus dem Browser des Nutzers und kann alles
 * enthalten — darum wird jedes Feld geprüft, statt das JSON blind zu casten.
 * Unbekannte Karten-IDs bleiben drin, die meldet ohnehin validate().
 */
export function parseDeck(raw: string | null): Deck {
  if (raw === null) return EMPTY_DECK
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return EMPTY_DECK
    const record = data as Record<string, unknown>
    return { main: ids(record.main), extra: ids(record.extra), side: ids(record.side) }
  } catch {
    return EMPTY_DECK
  }
}

/**
 * Lesen und Schreiben können werfen, wenn der Browser Speicher verbietet
 * (Privatmodus, blockierte Cookies). Dann lieber ohne Deck weiterarbeiten
 * als die ganze App abstürzen lassen.
 */
export function loadDeck(): Deck {
  try {
    return parseDeck(localStorage.getItem(KEY))
  } catch {
    return EMPTY_DECK
  }
}

export function saveDeck(deck: Deck): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(deck))
  } catch {
    // Ohne Speicher gibt es eben keine Persistenz.
  }
}
