import type { Card } from '../data/types.ts'

export type Zone = 'main' | 'extra' | 'side'

/**
 * Ein Deck ist je Zone eine Liste von Karten-IDs. Mehrfachnennungen sind
 * gewollt (drei Kopien = drei Einträge) und die Reihenfolge bleibt erhalten,
 * damit der spätere .ydk-Export eins zu eins darauf abbilden kann.
 */
export interface Deck {
  main: number[]
  extra: number[]
  side: number[]
}

export const EMPTY_DECK: Deck = { main: [], extra: [], side: [] }

export const ZONE_LABELS: Record<Zone, string> = {
  main: 'Main Deck',
  extra: 'Extra Deck',
  side: 'Side Deck',
}

/** Untergrenzen und Obergrenzen laut Turnierregeln. */
export const ZONE_LIMITS: Record<Zone, { min: number; max: number }> = {
  main: { min: 40, max: 60 },
  extra: { min: 0, max: 15 },
  side: { min: 0, max: 15 },
}

/** Erlaubte Kopien: Banlist schlägt die Standardgrenze von 3. */
export function copyLimit(card: Card): number {
  return card.limit ?? 3
}

/** Kopien zählen über alle drei Zonen — die 3er-Grenze gilt für das ganze Deck. */
export function countCopies(deck: Deck, id: number): number {
  const zähle = (ids: number[]): number => ids.filter((entry) => entry === id).length
  return zähle(deck.main) + zähle(deck.extra) + zähle(deck.side)
}

/**
 * Prüft, ob die Karte in die Zone darf. Gibt den Grund zurück, warum nicht,
 * oder null wenn es geht.
 */
export function whyNotAdd(deck: Deck, card: Card, zone: Zone): string | null {
  // Das Side Deck nimmt beides auf, Main und Extra sind strikt getrennt.
  if (zone === 'main' && card.deck === 'extra') return `${card.name} gehört ins Extra Deck`
  if (zone === 'extra' && card.deck === 'main') return `${card.name} gehört ins Main Deck`

  const { max } = ZONE_LIMITS[zone]
  if (deck[zone].length >= max) return `${ZONE_LABELS[zone]} ist voll (max. ${String(max)})`

  const limit = copyLimit(card)
  if (countCopies(deck, card.id) >= limit) {
    if (limit === 0) return `${card.name} steht auf der Verbotsliste`
    return `${card.name}: nur ${String(limit)} Kopie${limit === 1 ? '' : 'n'} erlaubt`
  }

  return null
}

export function addCard(deck: Deck, card: Card, zone: Zone): Deck {
  return { ...deck, [zone]: [...deck[zone], card.id] }
}

export function removeAt(deck: Deck, zone: Zone, index: number): Deck {
  const next = [...deck[zone]]
  next.splice(index, 1)
  return { ...deck, [zone]: next }
}

/**
 * Alles, was das Deck turnierunfähig macht. Wird laufend angezeigt statt erst
 * beim Export geprüft, damit man den Fehler sofort sieht.
 */
export function validate(deck: Deck, byId: Map<number, Card>): string[] {
  const issues: string[] = []

  for (const zone of ['main', 'extra', 'side'] as const) {
    const { min, max } = ZONE_LIMITS[zone]
    const size = deck[zone].length
    if (size < min) issues.push(`${ZONE_LABELS[zone]}: ${String(size)} Karten, mindestens ${String(min)}`)
    if (size > max) issues.push(`${ZONE_LABELS[zone]}: ${String(size)} Karten, höchstens ${String(max)}`)
  }

  // Über die Grenze geratene Kopien können aus einem Import stammen, darum
  // wird hier gegen den ganzen Deckinhalt geprüft und nicht nur beim Hinzufügen.
  const seen = new Set<number>()
  for (const id of [...deck.main, ...deck.extra, ...deck.side]) {
    if (seen.has(id)) continue
    seen.add(id)

    const card = byId.get(id)
    if (card === undefined) {
      issues.push(`Unbekannte Karte mit ID ${String(id)}`)
      continue
    }

    const copies = countCopies(deck, id)
    const limit = copyLimit(card)
    if (copies > limit) {
      issues.push(
        limit === 0
          ? `${card.name} steht auf der Verbotsliste`
          : `${card.name}: ${String(copies)} Kopien, erlaubt sind ${String(limit)}`,
      )
    }
  }

  return issues
}
