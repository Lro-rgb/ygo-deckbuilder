import { useCallback, useMemo, useState } from 'react'
import { Filters } from './components/Filters.tsx'
import { cardImageUrl } from './data/cards.ts'
import { useCards } from './data/useCards.ts'
import { useDebounced } from './hooks/useDebounced.ts'
import { EMPTY_QUERY, filterCards, type CardQuery } from './search/filter.ts'

/** Wie viele Karten pro Nachschub gerendert werden. */
const STEP = 200

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

  const patch = (part: Partial<CardQuery>): void => {
    setQuery((old) => ({ ...old, ...part }))
    setVisible(STEP)
  }

  // Alle Treffer auf einmal zu rendern kostet bei 14'291 Karten 350-1100 ms, weil
  // React so viele DOM-Knoten anlegen muss. Deshalb wächst die Liste beim
  // Scrollen nach. content-visibility unten hält sie danach billig.
  // ponytail: kein Sprung zu einem beliebigen Index; falls das mal nötig wird,
  // echte Virtualisierung (z.B. @tanstack/react-virtual) einbauen.
  const [visible, setVisible] = useState(STEP)

  // Die leere Dependency-Liste muss leer bleiben: bei wechselnder Identität
  // hängt React den Observer nach jedem Render neu an, er feuert sofort wieder
  // und die Liste wächst ungebremst bis ans Ende.
  const sentinel = useCallback((element: HTMLDivElement | null) => {
    if (element === null) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible((current) => current + STEP)
      },
      // Früher nachladen, damit der Nutzer nie am Listenende wartet.
      { rootMargin: '800px' },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])

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
            setVisible(STEP)
          }}
          className="rounded border border-slate-700 px-2 py-1 hover:border-slate-500"
        >
          Filter zurücksetzen
        </button>
      </div>

      <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
        {results.slice(0, visible).map((card) => (
          // content-visibility überspringt Layout und Paint für alles ausserhalb
          // des Viewports; contain-intrinsic-size verhindert, dass die
          // Scrollbar dabei springt.
          <li
            key={card.id}
            className="[contain-intrinsic-size:auto_180px] [content-visibility:auto]"
          >
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

      {visible < results.length && <div ref={sentinel} className="h-px" />}
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
