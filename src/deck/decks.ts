import type { Deck } from './deck.ts'
import { deckFrom } from './storage.ts'

const KEY = 'ygo-deckbuilder:decks'

/** Gespeicherte Decks unter ihrem Namen. */
export type SavedDecks = Record<string, Deck>

/**
 * Wie parseDeck, nur eine Ebene höher. Der Inhalt kommt aus dem Browser des
 * Nutzers, darum geht jedes einzelne Deck nochmals durch deckFrom().
 */
export function parseDecks(raw: string | null): SavedDecks {
  if (raw === null) return {}
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return {}
    return Object.fromEntries(
      Object.entries(data).map(([name, deck]) => [name, deckFrom(deck)]),
    )
  } catch {
    return {}
  }
}

/** Wie in storage.ts: ohne Speicher lieber ohne gespeicherte Decks weiterarbeiten. */
export function loadDecks(): SavedDecks {
  try {
    return parseDecks(localStorage.getItem(KEY))
  } catch {
    return {}
  }
}

export function saveDecks(decks: SavedDecks): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(decks))
  } catch {
    // Ohne Speicher gibt es eben keine gespeicherten Decks.
  }
}
