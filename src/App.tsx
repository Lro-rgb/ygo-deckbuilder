import { useEffect, useMemo, useState } from 'react'
import { DeckPanel } from './components/DeckPanel.tsx'
import { Filters } from './components/Filters.tsx'
import { cardImageUrl } from './data/cards.ts'
import type { Card } from './data/types.ts'
import { useCards } from './data/useCards.ts'
import {
  EMPTY_DECK,
  addCard,
  removeAt,
  validate,
  whyNotAdd,
  type Deck,
  type Zone,
} from './deck/deck.ts'
import { cardCostLabel } from './deck/cost.ts'
import { decodePayload, encodePayload, DRAG_FORMAT } from './deck/dragPayload.ts'
import { decodeDeck } from './deck/share.ts'
import { loadDeck, saveDeck } from './deck/storage.ts'
import { fromYdk, toYdk } from './deck/ydk.ts'
import { useDebounced } from './hooks/useDebounced.ts'
import { GAP, useGridWindow } from './hooks/useGridWindow.ts'
import { EMPTY_QUERY, filterCards, type CardQuery } from './search/filter.ts'

export default function App() {
  const cards = useCards()
  const [query, setQuery] = useState<CardQuery>(EMPTY_QUERY)
  // Ein geteilter Link schlägt das gespeicherte Deck — sonst würde man beim
  // Öffnen sein eigenes Deck sehen statt das, was einem geschickt wurde.
  const [deck, setDeck] = useState<Deck>(() => decodeDeck(location.hash) ?? loadDeck())
  /** Letzte abgelehnte Aktion, damit der Nutzer den Grund sieht. */
  const [hinweis, setHinweis] = useState<string | null>(null)
  /** Deckstand vor der letzten Änderung. Eine Stufe reicht gegen Fehlklicks. */
  const [vorher, setVorher] = useState<Deck | null>(null)

  // Das Fragment nach dem Übernehmen entfernen: sonst holt ein Reload später
  // wieder das geteilte Deck und wirft die eigenen Änderungen weg.
  useEffect(() => {
    if (location.hash !== '') history.replaceState(null, '', location.pathname)
  }, [])

  // Jede Deckänderung sofort sichern; ~60 Zahlen als JSON sind auch synchron
  // schnell genug, ein Entprellen wäre hier nur zusätzliche Mechanik.
  useEffect(() => {
    saveDeck(deck)
  }, [deck])

  // Nur der Freitext wird entprellt; Dropdowns feuern ohnehin nur beim Auswählen.
  const text = useDebounced(query.text)

  const index = cards.status === 'ready' ? cards.index : null
  const collection = cards.status === 'ready' ? cards.collection : null
  const byId = collection?.byId ?? null

  const results = useMemo(
    () => (index === null ? [] : filterCards(index, { ...query, text })),
    [index, query, text],
  )

  const issues = useMemo(
    () => (byId === null ? [] : validate(deck, byId)),
    [deck, byId],
  )

  const grid = useGridWindow(results.length)

  /** Jede Deckänderung geht hier durch, damit "rückgängig" immer greift. */
  const ändere = (next: Deck): void => {
    setVorher(deck)
    setDeck(next)
  }

  const patch = (part: Partial<CardQuery>): void => {
    setQuery((old) => ({ ...old, ...part }))
  }

  /** Legt die Karte in ihre natürliche Zone; Extra-Deck-Karten also ins Extra Deck. */
  const add = (card: Card, zone: Zone = card.deck): void => {
    const grund = whyNotAdd(deck, card, zone)
    if (grund !== null) {
      setHinweis(grund)
      return
    }
    setHinweis(null)
    ändere(addCard(deck, card, zone))
  }

  const remove = (zone: Zone, position: number): void => {
    setHinweis(null)
    ändere(removeAt(deck, zone, position))
  }

  /** Ziel eines Drops: entweder eine neue Karte aus der Suche oder ein Umzug. */
  const dropInZone = (zone: Zone, raw: string): void => {
    const payload = decodePayload(raw)
    if (payload === null || byId === null) return

    if (payload.kind === 'card') {
      const card = byId.get(payload.id)
      if (card !== undefined) add(card, zone)
      return
    }

    if (payload.zone === zone) return

    const id = deck[payload.zone][payload.index]
    const card = byId.get(id)
    if (card === undefined) return

    // Erst entfernen, dann prüfen: sonst zählt die Karte bei der
    // Kopiengrenze doppelt und ein reiner Umzug würde abgelehnt.
    const ohne = removeAt(deck, payload.zone, payload.index)
    const grund = whyNotAdd(ohne, card, zone)
    if (grund !== null) {
      setHinweis(grund)
      return
    }
    setHinweis(null)
    ändere(addCard(ohne, card, zone))
  }

  /** Lädt das Deck als .ydk herunter — Blob und <a download>, ohne Bibliothek. */
  const exportieren = (): void => {
    const url = URL.createObjectURL(new Blob([toYdk(deck)], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'deck.ydk'
    link.click()
    // Ohne revoke bleibt der Blob bis zum Neuladen der Seite im Speicher.
    // Erst im nächsten Tick, weil manche Browser den Download sonst abbrechen.
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 0)
  }

  const importieren = (file: File): void => {
    if (collection === null) return
    void file.text().then((inhalt) => {
      const { deck: geladen, warnings } = fromYdk(inhalt, collection)
      ändere(geladen)
      setHinweis(warnings.length > 0 ? warnings.join(' · ') : null)
    })
  }

  if (cards.status === 'loading') {
    return <Page>Lade Karten …</Page>
  }
  if (cards.status === 'error') {
    return (
      <Page>
        <p className="rounded bg-red-950 p-3 text-red-300">{cards.message}</p>
      </Page>
    )
  }

  return (
    <Page>
      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <input
            type="search"
            value={query.text}
            onChange={(e) => {
              patch({ text: e.target.value })
            }}
            placeholder="Karte suchen …"
            className="w-full max-w-md rounded border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-slate-500"
          />

          <Filters facets={cards.facets} query={query} onChange={patch} />

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span>
              {results.length} von {cards.collection.cards.length} Karten
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery(EMPTY_QUERY)
              }}
              className="rounded border border-slate-700 px-2 py-1 hover:border-slate-500"
            >
              Filter zurücksetzen
            </button>
            {hinweis !== null && <span className="text-amber-400">{hinweis}</span>}
          </div>

          {/* Die Platzhalter halten die Scrollhöhe, obwohl nur der Sichtbereich im DOM liegt. */}
          <div ref={grid.setContainer} className="mt-4">
            <div style={{ height: grid.paddingTop }} />
            <ul
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${String(grid.columns)}, minmax(0, 1fr))`,
                gap: GAP,
              }}
            >
              {results.slice(grid.first, grid.last).map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        DRAG_FORMAT,
                        encodePayload({ kind: 'card', id: card.id }),
                      )
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    onClick={() => {
                      add(card)
                    }}
                    title={`${card.name}
${cardCostLabel(card)}
Klick fügt hinzu, Ziehen in eine Zone`}
                    className="block w-full cursor-grab active:cursor-grabbing"
                  >
                    <img
                      src={cardImageUrl(card.id)}
                      alt={card.name}
                      loading="lazy"
                      width={168}
                      height={246}
                      draggable={false}
                      className="w-full rounded hover:opacity-60"
                    />
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ height: grid.paddingBottom }} />
          </div>
        </div>

        <DeckPanel
          deck={deck}
          byId={cards.collection.byId}
          issues={issues}
          onRemove={remove}
          onDropInZone={dropInZone}
          onExport={exportieren}
          onImport={importieren}
          onClear={() => {
            ändere(EMPTY_DECK)
            setHinweis(null)
          }}
          onUndo={
            vorher === null
              ? null
              : () => {
                  setDeck(vorher)
                  setVorher(null)
                  setHinweis(null)
                }
          }
        />
      </div>
    </Page>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <h1 className="text-2xl font-semibold">Yu-Gi-Oh! Deckbuilder</h1>
      {children}
    </div>
  )
}
