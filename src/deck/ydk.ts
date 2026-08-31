import { findCard, type CardCollection } from '../data/cards.ts'
import { EMPTY_DECK, type Deck, type Zone } from './deck.ts'

/**
 * .ydk ist das Austauschformat von YGOPRO und wird von allen gängigen
 * Deckbuildern gelesen. Aufbau: Abschnittsmarken, darunter je eine Karten-ID
 * pro Zeile, Kopien als wiederholte Zeilen.
 *
 *   #created by ...
 *   #main
 *   46986414
 *   #extra
 *   !side          <- das Side Deck beginnt mit Ausrufezeichen, nicht mit Raute
 */
const MARKERS: Record<string, Zone> = {
  '#main': 'main',
  '#extra': 'extra',
  '!side': 'side',
}

export function toYdk(deck: Deck): string {
  const lines = ['#created by ygo-deckbuilder', '#main']
  for (const id of deck.main) lines.push(String(id))
  lines.push('#extra')
  for (const id of deck.extra) lines.push(String(id))
  lines.push('!side')
  for (const id of deck.side) lines.push(String(id))
  // Abschliessender Zeilenumbruch, damit die Datei POSIX-konform endet.
  return lines.join('\n') + '\n'
}

export interface YdkImport {
  deck: Deck
  /** Was beim Einlesen auffiel, ohne den Import zu verhindern. */
  warnings: string[]
}

export function fromYdk(text: string, collection: CardCollection): YdkImport {
  const deck: Deck = { ...EMPTY_DECK, main: [], extra: [], side: [] }
  const warnings: string[] = []
  const unbekannt: number[] = []

  let zone: Zone | null = null

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (line === '') continue

    const marker = MARKERS[line.toLowerCase()]
    if (marker !== undefined) {
      zone = marker
      continue
    }
    // Übrige Kommentarzeilen wie "#created by ..." überspringen.
    if (line.startsWith('#') || line.startsWith('!')) continue
    if (zone === null) continue

    const id = Number(line)
    if (!Number.isInteger(id) || id <= 0) {
      warnings.push(`Zeile übersprungen: ${line}`)
      continue
    }

    // Alternative Artworks haben eigene Passcodes; findCard löst sie auf,
    // damit die Karte im Deck derselbe Eintrag wird wie aus der Suche.
    const card = findCard(collection, id)
    if (card === undefined) {
      unbekannt.push(id)
      continue
    }
    deck[zone].push(card.id)
  }

  if (unbekannt.length > 0) {
    warnings.push(
      `${String(unbekannt.length)} unbekannte Karten-IDs übersprungen: ${unbekannt.slice(0, 5).join(', ')}${unbekannt.length > 5 ? ' …' : ''}`,
    )
  }

  return { deck, warnings }
}
