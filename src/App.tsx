import { useMemo, useState } from 'react'
import { Filters } from './components/Filters.tsx'
import { cardImageUrl } from './data/cards.ts'
import { useCards } from './data/useCards.ts'
import { useDebounced } from './hooks/useDebounced.ts'
import { GAP, useGridWindow } from './hooks/useGridWindow.ts'
import { EMPTY_QUERY, filterCards, type CardQuery } from './search/filter.ts'

export default function App() {
  const cards = useCards()
  const [query, setQuery] = useState<CardQuery>(EMPTY_QUERY)
  // Nur der Freitext wird entprellt; Dropdowns feuern ohnehin nur beim Auswählen.
  const text = useDebounced(query.text)

  const index = cards.status === 'ready' ? cards.index : null

  const results = useMemo(
    () => (index === null ? [] : filterCards(index, { ...query, text })),
    [index, query, text],
  )

  const grid = useGridWindow(results.length)

  const patch = (part: Partial<CardQuery>): void => {
    setQuery((old) => ({ ...old, ...part }))
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
      <input
        type="search"
        value={query.text}
        onChange={(e) => {
          patch({ text: e.target.value })
        }}
        placeholder="Karte suchen …"
        className="mt-4 w-full max-w-md rounded border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-slate-500"
      />

      <Filters facets={cards.facets} query={query} onChange={patch} />

      <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
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
              <img
                src={cardImageUrl(card.id)}
                alt={card.name}
                title={card.name}
                loading="lazy"
                width={168}
                height={246}
                className="w-full rounded"
              />
            </li>
          ))}
        </ul>
        <div style={{ height: grid.paddingBottom }} />
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
