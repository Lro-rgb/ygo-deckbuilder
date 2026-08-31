import { useMemo, useState } from 'react'
import { cardImageUrl } from '../data/cards.ts'
import type { Card } from '../data/types.ts'
import type { Deck } from '../deck/deck.ts'
import { drawHand, openingOdds } from '../deck/odds.ts'

/** Starthand dessen, der beginnt. Wer als Zweiter spielt, zieht eine Karte mehr. */
const HAND = 5

const prozent = new Intl.NumberFormat('de-CH', { style: 'percent', maximumFractionDigits: 1 })

interface Props {
  deck: Deck
  byId: Map<number, Card>
}

export function OpeningHand({ deck, byId }: Props) {
  const [hand, setHand] = useState<number[]>([])
  // Die Wahrscheinlichkeiten hängen nur am Main Deck, nicht an der gezogenen Hand.
  const odds = useMemo(() => openingOdds(deck.main, HAND), [deck.main])

  if (deck.main.length === 0) return null

  return (
    <section className="mt-6 border-t border-slate-800 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Starthand ({HAND} Karten)</h3>
        <button
          type="button"
          onClick={() => {
            setHand(drawHand(deck.main, HAND))
          }}
          className="rounded border border-slate-700 px-2 py-1 text-sm text-slate-300 hover:border-slate-500"
        >
          Hand ziehen
        </button>
      </div>

      {hand.length > 0 && (
        <ul className="mt-2 grid grid-cols-5 gap-1">
          {hand.map((id, index) => (
            <li key={`${String(id)}-${String(index)}`}>
              <img
                src={cardImageUrl(id)}
                alt={byId.get(id)?.name ?? String(id)}
                title={byId.get(id)?.name ?? String(id)}
                width={168}
                height={246}
                loading="lazy"
                className="w-full rounded"
              />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Chance, die Karte in der Starthand zu sehen (exakt gerechnet, nicht simuliert):
      </p>
      <ul className="mt-1 space-y-0.5 text-sm text-slate-300">
        {odds.map(({ id, copies, chance }) => (
          <li key={id} className="flex justify-between gap-2">
            <span className="truncate">
              {copies}× {byId.get(id)?.name ?? String(id)}
            </span>
            <span className="shrink-0 tabular-nums text-slate-400">{prozent.format(chance)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
