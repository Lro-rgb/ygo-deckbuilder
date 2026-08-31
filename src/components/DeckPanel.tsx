import { cardImageUrl } from '../data/cards.ts'
import type { Card } from '../data/types.ts'
import { ZONE_LABELS, ZONE_LIMITS, type Deck, type Zone } from '../deck/deck.ts'

interface Props {
  deck: Deck
  byId: Map<number, Card>
  issues: string[]
  onRemove: (zone: Zone, index: number) => void
}

const ZONES: Zone[] = ['main', 'extra', 'side']

export function DeckPanel({ deck, byId, issues, onRemove }: Props) {
  const total = deck.main.length + deck.extra.length + deck.side.length

  return (
    <aside className="w-80 shrink-0">
      <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h2 className="text-lg font-semibold">Deck ({total})</h2>

        {issues.length === 0 ? (
          <p className="mt-2 rounded bg-emerald-950 px-2 py-1 text-sm text-emerald-300">
            Deck ist regelkonform
          </p>
        ) : (
          <ul className="mt-2 space-y-1 rounded bg-amber-950 px-2 py-1 text-sm text-amber-300">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}

        {ZONES.map((zone) => (
          <section key={zone} className="mt-4">
            <h3 className="text-sm text-slate-400">
              {ZONE_LABELS[zone]} — {deck[zone].length}
              {zone === 'main'
                ? ` / ${String(ZONE_LIMITS.main.min)}–${String(ZONE_LIMITS.main.max)}`
                : ` / ${String(ZONE_LIMITS[zone].max)}`}
            </h3>

            <ul className="mt-1 grid grid-cols-6 gap-1">
              {deck[zone].map((id, index) => {
                const card = byId.get(id)
                return (
                  <li key={`${String(id)}-${String(index)}`}>
                    <button
                      type="button"
                      onClick={() => {
                        onRemove(zone, index)
                      }}
                      title={`${card?.name ?? String(id)} — Klick entfernt`}
                      className="block w-full cursor-pointer"
                    >
                      <img
                        src={cardImageUrl(id)}
                        alt={card?.name ?? String(id)}
                        width={168}
                        height={246}
                        loading="lazy"
                        className="w-full rounded hover:opacity-60"
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  )
}
