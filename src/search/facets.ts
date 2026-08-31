import type { Card } from '../data/types.ts'

/**
 * Auswahlmöglichkeiten für die Filter-UI. Die werden aus den Daten abgeleitet
 * statt fest verdrahtet — sonst fehlen nach einem neuen Import die Werte, die
 * Konami frisch eingeführt hat (neue Attribute gibt es zwar selten, neue
 * Archetypen aber in jedem Set).
 */
export interface Facets {
  frameTypes: string[]
  attributes: string[]
  races: string[]
  archetypes: string[]
}

function sortedUnique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}

export function buildFacets(cards: Card[]): Facets {
  const frameTypes: string[] = []
  const attributes: string[] = []
  const races: string[] = []
  const archetypes: string[] = []

  for (const card of cards) {
    frameTypes.push(card.frameType)
    races.push(card.race)
    if (card.attribute !== undefined) attributes.push(card.attribute)
    if (card.archetype !== undefined) archetypes.push(card.archetype)
  }

  return {
    frameTypes: sortedUnique(frameTypes),
    attributes: sortedUnique(attributes),
    races: sortedUnique(races),
    archetypes: sortedUnique(archetypes),
  }
}
