import type { Card, DeckKind } from '../data/types.ts'

/**
 * Alle Filterkriterien der Suche. Leere Listen und `null` bedeuten
 * "nicht einschränken", damit ein frisches Query alle Karten liefert.
 */
export interface CardQuery {
  /** Freitext, sucht in Name, Kartentext und Archetyp */
  text: string
  /** frameType-Werte (normal, effect, spell, trap, xyz, link, ...), ODER-verknüpft */
  frameTypes: string[]
  attributes: string[]
  /** Monsterart bzw. Zauber-/Fallenart (Dragon, Spellcaster, Quick-Play, ...) */
  races: string[]
  archetype: string | null
  deck: DeckKind | null
  levelMin: number | null
  levelMax: number | null
  atkMin: number | null
  atkMax: number | null
  defMin: number | null
  defMax: number | null
}

export const EMPTY_QUERY: CardQuery = {
  text: '',
  frameTypes: [],
  attributes: [],
  races: [],
  archetype: null,
  deck: null,
  levelMin: null,
  levelMax: null,
  atkMin: null,
  atkMax: null,
  defMin: null,
  defMax: null,
}

/**
 * Vorberechneter Suchindex. Der Freitext wird gegen kleingeschriebene Strings
 * geprüft, die einmal beim Laden entstehen — sonst müsste bei jedem Tastendruck
 * 14'000 Mal toLowerCase() laufen, und genau das macht die Suche träge.
 */
export interface SearchIndex {
  cards: Card[]
  /** kleingeschriebener Kartenname, gleiche Reihenfolge wie `cards` */
  names: string[]
  /** kleingeschriebener Name + Kartentext + Archetyp, gleiche Reihenfolge wie `cards` */
  haystacks: string[]
}

export function createSearchIndex(cards: Card[]): SearchIndex {
  const names: string[] = new Array<string>(cards.length)
  const haystacks: string[] = new Array<string>(cards.length)

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    names[i] = card.name.toLowerCase()
    haystacks[i] = `${names[i]}\n${card.desc.toLowerCase()}\n${card.archetype?.toLowerCase() ?? ''}`
  }

  return { cards, names, haystacks }
}

/**
 * ATK/DEF von "?" liefert die API als -1. Als Zahl behandelt würde eine Karte
 * mit "? ATK" bei jedem Filter "ATK bis 1000" auftauchen, was falsch ist —
 * darum gilt der Wert hier als unbekannt.
 */
function knownValue(value: number | undefined): number | undefined {
  return value === undefined || value === -1 ? undefined : value
}

/** Prüft eine Zahl gegen eine optionale Ober-/Untergrenze. */
function inRange(value: number | undefined, min: number | null, max: number | null): boolean {
  if (min === null && max === null) return true
  // Karten ohne den Wert (z.B. Zauberkarten haben kein ATK) fallen aus dem Filter.
  if (value === undefined) return false
  if (min !== null && value < min) return false
  if (max !== null && value > max) return false
  return true
}

/**
 * Sortiergewicht für Treffer: exakter Name vor Namensanfang vor Name enthält
 * vor "alle Wörter im Namen" vor reinem Kartentext-Treffer. Ohne das steht bei
 * "dark magician" die eigentliche Karte irgendwo zwischen 200 Karten, die sie
 * nur im Kartentext erwähnen.
 */
function rankOf(name: string, needle: string, terms: string[]): number {
  if (name === needle) return 0
  if (name.startsWith(needle)) return 1
  if (name.includes(needle)) return 2
  // Deckt vertauschte Wörter ab: "magician dark" soll trotzdem Dark Magician finden.
  if (terms.every((term) => name.includes(term))) return 3
  return 4
}

export function filterCards(index: SearchIndex, query: CardQuery): Card[] {
  const needle = query.text.trim().toLowerCase()
  // Mehrere Wörter werden UND-verknüpft, Reihenfolge egal ("magician dark").
  const terms = needle.length > 0 ? needle.split(/\s+/) : []

  const matches: number[] = []

  for (let i = 0; i < index.cards.length; i++) {
    const card = index.cards[i]

    if (query.deck !== null && card.deck !== query.deck) continue
    if (query.frameTypes.length > 0 && !query.frameTypes.includes(card.frameType)) continue
    if (query.attributes.length > 0) {
      if (card.attribute === undefined || !query.attributes.includes(card.attribute)) continue
    }
    if (query.races.length > 0 && !query.races.includes(card.race)) continue
    if (query.archetype !== null && card.archetype !== query.archetype) continue
    if (!inRange(card.level, query.levelMin, query.levelMax)) continue
    if (!inRange(knownValue(card.atk), query.atkMin, query.atkMax)) continue
    if (!inRange(knownValue(card.def), query.defMin, query.defMax)) continue

    if (terms.length > 0) {
      const haystack = index.haystacks[i]
      let all = true
      for (const term of terms) {
        if (!haystack.includes(term)) {
          all = false
          break
        }
      }
      if (!all) continue
    }

    matches.push(i)
  }

  // Ohne Freitext bleibt die Reihenfolge der Datenbank erhalten (spart das Sortieren).
  if (terms.length > 0) {
    const ranks = new Map<number, number>()
    for (const i of matches) ranks.set(i, rankOf(index.names[i], needle, terms))
    matches.sort((a, b) => {
      const byRank = (ranks.get(a) ?? 4) - (ranks.get(b) ?? 4)
      return byRank !== 0 ? byRank : index.names[a] < index.names[b] ? -1 : 1
    })
  }

  return matches.map((i) => index.cards[i])
}
