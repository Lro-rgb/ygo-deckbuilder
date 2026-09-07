import { useState } from 'react'
import type { Deck } from '../deck/deck.ts'
import { loadDecks, saveDecks, type SavedDecks } from '../deck/decks.ts'
import { feld, knopf } from './ui.ts'

interface Props {
  deck: Deck
  /** Geht über dieselbe Stelle wie jede Deckänderung, damit "rückgängig" greift. */
  onLoad: (deck: Deck) => void
}

/**
 * Mehrere Decks unter einem Namen im localStorage. Für Namen und Rückfragen
 * reichen prompt() und confirm() — ein eigener Dialog wäre hier nur Mechanik.
 */
export function DeckSlots({ deck, onLoad }: Props) {
  const [decks, setDecks] = useState<SavedDecks>(loadDecks)
  /** Name des zuletzt geladenen oder gespeicherten Decks, für Auswahl und Vorschlag. */
  const [aktiv, setAktiv] = useState('')

  const namen = Object.keys(decks).sort((a, b) => a.localeCompare(b, 'de-CH'))
  const total = deck.main.length + deck.extra.length + deck.side.length

  const schreibe = (next: SavedDecks): void => {
    setDecks(next)
    saveDecks(next)
  }

  const speichere = (): void => {
    const name = window.prompt('Deck speichern als', aktiv)?.trim()
    if (name === undefined || name === '') return
    if (name in decks && !window.confirm(`"${name}" überschreiben?`)) return
    schreibe({ ...decks, [name]: deck })
    setAktiv(name)
  }

  const lösche = (): void => {
    if (!window.confirm(`"${aktiv}" löschen?`)) return
    const { [aktiv]: _weg, ...rest } = decks
    schreibe(rest)
    setAktiv('')
  }

  return (
    <div className="mt-2 flex items-center gap-2 text-sm">
      <select
        value={aktiv}
        onChange={(e) => {
          const name = e.target.value
          setAktiv(name)
          const gespeichert = decks[name]
          if (gespeichert !== undefined) onLoad(gespeichert)
        }}
        disabled={namen.length === 0}
        className={`${feld} min-w-0 flex-1 disabled:opacity-40`}
      >
        <option value="">{namen.length === 0 ? 'keine Decks gespeichert' : 'Deck laden…'}</option>
        {namen.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <button type="button" onClick={speichere} disabled={total === 0} className={knopf}>
        Speichern
      </button>
      <button type="button" onClick={lösche} disabled={aktiv === ''} className={knopf}>
        Löschen
      </button>
    </div>
  )
}
