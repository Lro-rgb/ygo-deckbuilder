import type { Zone } from './deck.ts'

/**
 * Was beim Ziehen mitgegeben wird. Entweder kommt die Karte aus der Suche
 * (dann zählt nur ihre ID) oder aus einer Deckzone (dann muss klar sein,
 * welcher Eintrag verschoben wird, denn Kopien sehen gleich aus).
 */
export type DragPayload =
  | { kind: 'card'; id: number }
  | { kind: 'deck'; zone: Zone; index: number }

/** text/plain statt eigenem MIME-Typ: funktioniert in allen Browsern gleich. */
export const DRAG_FORMAT = 'text/plain'

export function encodePayload(payload: DragPayload): string {
  return JSON.stringify(payload)
}

/** Fremde Drops (Text, Dateien, andere Seiten) landen hier und geben null. */
export function decodePayload(raw: string): DragPayload | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const value = parsed as Record<string, unknown>

  if (value.kind === 'card' && typeof value.id === 'number') {
    return { kind: 'card', id: value.id }
  }
  if (
    value.kind === 'deck' &&
    typeof value.index === 'number' &&
    (value.zone === 'main' || value.zone === 'extra' || value.zone === 'side')
  ) {
    return { kind: 'deck', zone: value.zone, index: value.index }
  }
  return null
}
