import { useState } from 'react'
import { cardImageUrl } from '../data/cards.ts'
import type { Card } from '../data/types.ts'
import { ZONE_LABELS, ZONE_LIMITS, type Deck, type Zone } from '../deck/deck.ts'
import { DRAG_FORMAT, encodePayload } from '../deck/dragPayload.ts'
import { encodeDeck } from '../deck/share.ts'
import { OpeningHand } from './OpeningHand.tsx'

interface Props {
  deck: Deck
  byId: Map<number, Card>
  issues: string[]
  onRemove: (zone: Zone, index: number) => void
  onDropInZone: (zone: Zone, raw: string) => void
  onExport: () => void
  onImport: (file: File) => void
  onClear: () => void
}

const ZONES: Zone[] = ['main', 'extra', 'side']

const knopf = 'rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-slate-500'

export function DeckPanel({
  deck,
  byId,
  issues,
  onRemove,
  onDropInZone,
  onExport,
  onImport,
  onClear,
}: Props) {
  const total = deck.main.length + deck.extra.length + deck.side.length
  /** Zone unter dem Mauszeiger, nur zum Hervorheben. */
  const [über, setÜber] = useState<Zone | null>(null)
  /** Rückmeldung des Teilen-Knopfs, verschwindet nach zwei Sekunden wieder. */
  const [geteilt, setGeteilt] = useState<string | null>(null)

  return (
    <aside className="w-80 shrink-0">
      <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h2 className="text-lg font-semibold">Deck ({total})</h2>

        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <button type="button" onClick={onExport} className={knopf}>
            .ydk speichern
          </button>
          {/* Der Datei-Dialog gehoert dem input; das label macht ihn klickbar. */}
          <label className={`${knopf} cursor-pointer`}>
            .ydk laden
            <input
              type="file"
              accept=".ydk,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onImport(file)
                // Zuruecksetzen, damit dieselbe Datei erneut gewaehlt werden kann.
                e.target.value = ''
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              const url = `${location.origin}${location.pathname}#${encodeDeck(deck)}`
              void navigator.clipboard
                .writeText(url)
                .then(() => { setGeteilt('Link kopiert') })
                .catch(() => {
                  // Ohne HTTPS oder ohne Erlaubnis gibt es keine Zwischenablage;
                  // im Dialog lässt sich der Link wenigstens von Hand kopieren.
                  window.prompt('Link zum Teilen', url)
                })
                .finally(() => setTimeout(() => { setGeteilt(null) }, 2000))
            }}
            className={knopf}
          >
            {geteilt ?? 'Link teilen'}
          </button>
          <button type="button" onClick={onClear} className={knopf}>
            leeren
          </button>
        </div>

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

        <OpeningHand deck={deck} byId={byId} />
      </div>
    </aside>
  )
}
