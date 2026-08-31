import { useMemo, useState } from 'react'
import { cardImageUrl } from './data/cards.ts'
import { useCards } from './data/useCards.ts'
import { useDebounced } from './hooks/useDebounced.ts'
import { EMPTY_QUERY, filterCards } from './search/filter.ts'

/** Vorschau-Grenze, solange die Ergebnisliste noch nicht virtualisiert ist. */
const PREVIEW_LIMIT = 60

export default function App() {
  const cards = useCards()
  const [text, setText] = useState('')
  const debouncedText = useDebounced(text)

  const index = cards.status === 'ready' ? cards.index : null

  const results = useMemo(() => {
    if (index === null) return []
    return filterCards(index, { ...EMPTY_QUERY, text: debouncedText })
  }, [index, debouncedText])

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <h1 className="text-2xl font-semibold">Yu-Gi-Oh! Deckbuilder</h1>

      {cards.status === 'loading' && <p className="mt-4 text-slate-400">Lade Karten …</p>}

      {cards.status === 'error' && (
        <p className="mt-4 rounded bg-red-950 p-3 text-red-300">{cards.message}</p>
      )}

      {cards.status === 'ready' && (
        <>
          <input
            type="search"
            value={text}
            onChange={(event) => {
              setText(event.target.value)
            }}
            placeholder="Karte suchen …"
            className="mt-4 w-full max-w-md rounded border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-slate-500"
          />
          <p className="mt-2 text-sm text-slate-400">
            {results.length} von {cards.collection.cards.length} Karten
            {results.length > PREVIEW_LIMIT && ` (zeigt die ersten ${PREVIEW_LIMIT})`}
          </p>

          <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {results.slice(0, PREVIEW_LIMIT).map((card) => (
              <li key={card.id}>
                <img
                  src={cardImageUrl(card.id)}
                  alt={card.name}
                  title={card.name}
                  loading="lazy"
                  className="w-full rounded"
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
