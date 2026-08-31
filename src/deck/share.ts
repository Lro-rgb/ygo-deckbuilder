import type { Deck } from './deck.ts'

/**
 * Deck als URL-Fragment. Karten-IDs sind achtstellige Zahlen; in Basis 36
 * werden daraus sechs Zeichen. Ein 60-Karten-Deck landet so bei rund 400
 * Zeichen — kurz genug, dass sich Komprimieren nicht lohnt.
 *
 * Das Fragment schickt der Browser nie an einen Server, das geteilte Deck
 * bleibt also zwischen den beiden Leuten.
 */
export function encodeDeck(deck: Deck): string {
  return [deck.main, deck.extra, deck.side]
    .map((ids) => ids.map((id) => id.toString(36)).join('.'))
    .join('~')
}

function parseIds(teil: string): number[] | null {
  if (teil === '') return []
  const ids = teil.split('.').map((wert) => parseInt(wert, 36))
  // Ein einziger kaputter Eintrag macht den ganzen Link ungültig — sonst
  // bekäme man ein halbes Deck untergeschoben, ohne es zu merken.
  return ids.every((id) => Number.isInteger(id) && id > 0) ? ids : null
}

/** Gibt null zurück, wenn das Fragment kein Deck ist (z.B. ein normaler Anker). */
export function decodeDeck(fragment: string): Deck | null {
  const zonen = fragment.replace(/^#/, '').split('~')
  if (zonen.length !== 3) return null

  const [main, extra, side] = zonen.map(parseIds)
  if (main === null || extra === null || side === null) return null
  return { main, extra, side }
}
