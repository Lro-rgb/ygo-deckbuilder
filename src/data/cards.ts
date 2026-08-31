import type { Card, CardDatabase } from './types.ts'

/**
 * Die geladene Kartendatenbank in einer Form, die die App direkt nutzen kann:
 * Liste zum Durchsuchen, Map zum Nachschlagen einzelner IDs.
 */
export interface CardCollection {
  generatedAt: string
  cards: Card[]
  byId: Map<number, Card>
  /** Alternative Artwork-Passcodes -> echte Karten-ID */
  aliases: Map<number, number>
}

/**
 * Vite kann die App unter einem Unterpfad ausliefern (z.B. /deckbuilder/).
 * BASE_URL endet immer mit einem Slash, deshalb wird hier keiner ergänzt.
 */
const BASE = import.meta.env.BASE_URL

export function cardImageUrl(cardId: number): string {
  return `${BASE}cards/${cardId}.jpg`
}

export function toCollection(db: CardDatabase): CardCollection {
  const byId = new Map<number, Card>()
  for (const card of db.cards) byId.set(card.id, card)

  const aliases = new Map<number, number>()
  for (const [alias, id] of Object.entries(db.aliases)) aliases.set(Number(alias), id)

  return { generatedAt: db.generatedAt, cards: db.cards, byId, aliases }
}

/**
 * Schlägt eine Karte nach ID nach. Nötig für .ydk-Dateien aus anderen Tools:
 * die enthalten teils den Passcode eines alternativen Artworks statt der
 * eigentlichen Karten-ID.
 */
export function findCard(collection: CardCollection, id: number): Card | undefined {
  const direct = collection.byId.get(id)
  if (direct) return direct

  const aliased = collection.aliases.get(id)
  return aliased === undefined ? undefined : collection.byId.get(aliased)
}

/** Lädt die vom Import-Script erzeugte cards.json. Der einzige Netzwerkzugriff der App. */
export async function loadCards(signal?: AbortSignal): Promise<CardCollection> {
  const res = await fetch(`${BASE}cards.json`, { signal })
  if (!res.ok) {
    throw new Error(
      `cards.json konnte nicht geladen werden (HTTP ${res.status}). Läuft "npm run cards"?`,
    )
  }
  const db = (await res.json()) as CardDatabase
  return toCollection(db)
}
