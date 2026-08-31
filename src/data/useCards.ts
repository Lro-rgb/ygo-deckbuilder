import { useEffect, useState } from 'react'
import { loadCards, type CardCollection } from './cards.ts'
import { createSearchIndex, type SearchIndex } from '../search/filter.ts'
import { buildFacets, type Facets } from '../search/facets.ts'

export interface CardsReady {
  status: 'ready'
  collection: CardCollection
  index: SearchIndex
  facets: Facets
}

export type CardsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | CardsReady

/**
 * Lädt die Kartendatenbank einmal beim Start und baut Suchindex und Filter-
 * Auswahllisten gleich mit auf. Beides hängt nur an den Daten, muss also nie
 * neu berechnet werden.
 */
export function useCards(): CardsState {
  const [state, setState] = useState<CardsState>({ status: 'loading' })

  useEffect(() => {
    // Bricht den Fetch ab, wenn die Komponente vorher verschwindet
    // (im StrictMode läuft der Effekt in der Entwicklung doppelt).
    const controller = new AbortController()

    loadCards(controller.signal)
      .then((collection) => {
        setState({
          status: 'ready',
          collection,
          index: createSearchIndex(collection.cards),
          facets: buildFacets(collection.cards),
        })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', message: err instanceof Error ? err.message : String(err) })
      })

    return () => {
      controller.abort()
    }
  }, [])

  return state
}
