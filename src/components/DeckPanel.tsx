import { useState } from 'react'
import { cardImageUrl } from '../data/cards.ts'
import type { Card } from '../data/types.ts'
import { ZONE_LABELS, ZONE_LIMITS, type Deck, type Zone } from '../deck/deck.ts'
import { DRAG_FORMAT, encodePayload } from '../deck/dragPayload.ts'

interface Props {
  deck: Deck
  byId: Map<number, Card>
  issues: string[]
  onRemove: (zone: Zone, index: number) => void
  onDropInZone: (zone: Zone, raw: string) => void
}

const ZONES: Zone[] = ['main', 'extra', 'side']

export function DeckPanel({ deck, byId, issues, onRemove, onDropInZone }: Props) {
  const total = deck.main.length + deck.extra.length + deck.side.length
  /** Zone unter dem Mauszeiger, nur zum Hervorheben. */
  const [über, setÜber] = useState<Zone | null>(null)

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
          <section
            key={zone}
            // Ohne preventDefault im dragOver lässt der Browser gar nicht fallen.
            onDragOver={(e) => {
              e.preventDefault()
              setÜber(zone)
            }}
            onDragLeave={() => {
              setÜber((current) => (current === zone ? null : current))
            }}
            onDrop={(e) => {
              e.preventDefault()
              setÜber(null)
              onDropInZone(zone, e.dataTransfer.getData(DRAG_FORMAT))
            }}
            className={`mt-4 rounded border-2 border-dashed p-1 transition-colors ${
              über === zone ? 'border-sky-500 bg-sky-950/40' : 'border-transparent'
            }`}
          >
            <h3 className="text-sm text-slate-400">
              {ZONE_LABELS[zone]} — {deck[zone].length}
              {zone === 'main'
                ? ` / ${String(ZONE_LIMITS.main.min)}–${String(ZONE_LIMITS.main.max)}`
                : ` / ${String(ZONE_LIMITS[zone].max)}`}
            </h3>

            <ul className="mt-1 grid min-h-12 grid-cols-6 gap-1">
              {deck[zone].map((id, index) => {
                const card = byId.get(id)
                return (
                  <li key={`${String(id)}-${String(index)}`}>
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          DRAG_FORMAT,
                          encodePayload({ kind: 'deck', zone, index }),
                        )
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onClick={() => {
                        onRemove(zone, index)
                      }}
                      title={`${card?.name ?? String(id)} — Klick entfernt, Ziehen verschiebt`}
                      className="block w-full cursor-grab active:cursor-grabbing"
                    >
                      <img
                        src={cardImageUrl(id)}
                        alt={card?.name ?? String(id)}
                        width={168}
                        height={246}
                        loading="lazy"
                        draggable={false}
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
