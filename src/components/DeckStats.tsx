import type { Card } from '../data/types.ts'
import type { Deck } from '../deck/deck.ts'
import { deckStats } from '../deck/stats.ts'

interface Props {
  deck: Deck
  byId: Map<number, Card>
}

/** Kartenfarben von Yu-Gi-Oh!, damit der Balken ohne Legende lesbar ist. */
const ARTEN = [
  { key: 'monster', label: 'Monster', farbe: 'bg-amber-600' },
  { key: 'zauber', label: 'Zauber', farbe: 'bg-emerald-600' },
  { key: 'falle', label: 'Fallen', farbe: 'bg-fuchsia-700' },
] as const

export function DeckStats({ deck, byId }: Props) {
  // Über 60 Karten gruppieren ist billiger als der Vergleich, den useMemo bräuchte.
  const { arten, stufen, extra } = deckStats(deck, byId)
  const summe = arten.monster + arten.zauber + arten.falle
  if (summe === 0) return null

  // Die höchste Säule gibt den Massstab vor; sonst wäre die Kurve bei kleinen
  // Decks nur ein Strich und bei grossen unlesbar breit.
  const höchste = Math.max(...stufen.map(({ count }) => count))

  return (
    <section className="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold">Main Deck ({summe})</h3>
        <div className="mt-2 flex h-2 overflow-hidden rounded bg-slate-800">
          {ARTEN.map(({ key, label, farbe }) => (
            <div
              key={key}
              className={farbe}
              style={{ width: `${String((arten[key] / summe) * 100)}%` }}
              title={`${label}: ${String(arten[key])}`}
            />
          ))}
        </div>
        <ul className="mt-2 space-y-0.5 text-sm text-slate-300">
          {ARTEN.map(({ key, label, farbe }) => (
            <li key={key} className="flex items-center gap-2">
              <span className={`size-2 shrink-0 rounded-full ${farbe}`} />
              <span className="flex-1">{label}</span>
              <span className="tabular-nums text-slate-400">
                {arten[key]} · {Math.round((arten[key] / summe) * 100)}%
              </span>
            </li>
          ))}
        </ul>

        {extra.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold">Extra Deck</h3>
            <ul className="mt-1 space-y-0.5 text-sm text-slate-300">
              {extra.map(({ art, count }) => (
                <li key={art} className="flex justify-between gap-2">
                  <span>{art}</span>
                  <span className="tabular-nums text-slate-400">{count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {stufen.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Stufen und Ränge</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {stufen.map(({ level, count }) => (
              <li key={level} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-right tabular-nums text-slate-400">{level}</span>
                <span className="h-3 flex-1 overflow-hidden rounded-sm bg-slate-800">
                  <span
                    className="block h-full rounded-sm bg-sky-700"
                    style={{ width: `${String((count / höchste) * 100)}%` }}
                  />
                </span>
                <span className="w-4 shrink-0 text-right tabular-nums text-slate-400">{count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Link-Monster haben keine Stufe und fehlen darum in der Kurve.
          </p>
        </div>
      )}
    </section>
  )
}
