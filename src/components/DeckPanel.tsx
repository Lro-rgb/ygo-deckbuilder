import { useRef, useState } from 'react'
import type { Card, MdRarity } from '../data/types.ts'
import { deckCost } from '../deck/cost.ts'
import { ZONE_LABELS, ZONE_LIMITS, type Deck, type Zone } from '../deck/deck.ts'
import { DRAG_FORMAT, encodePayload } from '../deck/dragPayload.ts'
import { encodeDeck } from '../deck/share.ts'
import { CardImage } from './CardImage.tsx'
import { DeckSlots } from './DeckSlots.tsx'
import { DeckStats } from './DeckStats.tsx'
import { OpeningHand } from './OpeningHand.tsx'
import { knopf, knopfPrimär, zusammenfaltbar } from './ui.ts'

interface Props {
  deck: Deck
  byId: Map<number, Card>
  issues: string[]
  onRemove: (zone: Zone, index: number) => void
  onDropInZone: (zone: Zone, raw: string) => void
  onExport: () => void
  onImport: (file: File) => void
  onClear: () => void
  /** null, solange es nichts rückgängig zu machen gibt. */
  onUndo: (() => void) | null
  onLoadDeck: (deck: Deck) => void
}

const ZONES: Zone[] = ['main', 'extra', 'side']

const zahl = new Intl.NumberFormat('de-CH')
const euro = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'EUR' })

export function DeckPanel({
  deck,
  byId,
  issues,
  onRemove,
  onDropInZone,
  onExport,
  onImport,
  onClear,
  onUndo,
  onLoadDeck,
}: Props) {
  const total = deck.main.length + deck.extra.length + deck.side.length
  // Über 60 Karten summieren ist billiger als der Vergleich, den useMemo dafür bräuchte.
  const kosten = deckCost(deck, byId)
  // Nur die Töpfe zeigen, in denen wirklich etwas zu zahlen ist.
  const cp = (Object.keys(kosten.cp) as MdRarity[]).filter((stufe) => kosten.cp[stufe] > 0)
  const fehlt = [
    kosten.ohneMd > 0 ? `${String(kosten.ohneMd)}× nicht in Master Duel` : null,
    kosten.ohnePreis > 0 ? `${String(kosten.ohnePreis)}× ohne Preis` : null,
  ].filter((teil) => teil !== null)

  /** Zone unter dem Mauszeiger, nur zum Hervorheben. */
  const [über, setÜber] = useState<Zone | null>(null)
  /** Rückmeldung des Teilen-Knopfs, verschwindet nach zwei Sekunden wieder. */
  const [geteilt, setGeteilt] = useState<string | null>(null)
  const grossansicht = useRef<HTMLDialogElement>(null)

  const teilen = (): void => {
    const url = `${location.origin}${location.pathname}#${encodeDeck(deck)}`
    void navigator.clipboard
      .writeText(url)
      .then(() => {
        setGeteilt('Link kopiert')
      })
      .catch(() => {
        // Ohne HTTPS oder ohne Erlaubnis gibt es keine Zwischenablage;
        // im Dialog lässt sich der Link wenigstens von Hand kopieren.
        window.prompt('Link zum Teilen', url)
      })
      .finally(() =>
        setTimeout(() => {
          setGeteilt(null)
        }, 2000),
      )
  }

  /**
   * Eine Deckzone. Dieselbe Funktion malt die schmale Spalte und die
   * Grossansicht, nur die Mindestbreite pro Karte unterscheidet sich —
   * auto-fill bestimmt die Spaltenzahl selbst, je nach verfügbarer Breite.
   * So können die beiden Ansichten gar nicht auseinanderlaufen.
   */
  const zoneAnsicht = (zone: Zone, spalten: string) => {
    const { min, max } = ZONE_LIMITS[zone]
    const anzahl = deck[zone].length
    const grenze = zone === 'main' ? `${String(min)}–${String(max)}` : String(max)

    return (
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
        className={`mt-3 rounded-lg border p-2 transition-colors ${
          über === zone ? 'border-sky-500 bg-sky-950/40' : 'border-slate-800'
        }`}
      >
        <h3 className="flex items-baseline justify-between gap-2 text-xs font-medium tracking-wide text-slate-400 uppercase">
          {ZONE_LABELS[zone]}
          <span className="tabular-nums normal-case">
            {anzahl}
            <span className="text-slate-600"> / {grenze}</span>
          </span>
        </h3>

        {anzahl === 0 ? (
          <p className="mt-2 rounded border border-dashed border-slate-800 py-3 text-center text-xs text-slate-600">
            leer
          </p>
        ) : (
          <ul className={`mt-2 grid gap-1 ${spalten}`}>
            {deck[zone].map((id, index) => {
              const card = byId.get(id)
              const name = card?.name ?? String(id)
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
                    title={`${name} — Klick entfernt, Ziehen verschiebt`}
                    className="block w-full cursor-grab rounded transition-opacity hover:opacity-50 active:cursor-grabbing"
                  >
                    <CardImage id={id} name={name} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    )
  }

  return (
    <aside className="w-full shrink-0 lg:w-80">
      {/* Erst ab lg klebt die Spalte; auf schmalen Schirmen steht sie unter der Suche. */}
      <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Deck</h2>
          <span className="tabular-nums text-slate-400">{total} Karten</span>
        </div>

        {total > 0 && (
          <p className="mt-1 text-sm text-slate-400">
            <span title="Summe der Cardmarket-Richtpreise, eine Momentaufnahme">
              {euro.format(kosten.euro)}
            </span>
            <span className="text-slate-600"> · </span>
            <span title="Master Duel führt vier getrennte CP-Töpfe; sie lassen sich nicht gegeneinander tauschen">
              {cp.length === 0
                ? 'nicht in Master Duel'
                : cp.map((stufe) => `${zahl.format(kosten.cp[stufe])} ${stufe}`).join(' · ')}
            </span>
            {fehlt.length > 0 && (
              <span className="block text-xs text-slate-500">ohne: {fehlt.join(', ')}</span>
            )}
          </p>
        )}

        {/* Die eine Aktion, die man ständig braucht — der Rest liegt eine Ebene tiefer. */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => grossansicht.current?.showModal()}
            disabled={total === 0}
            className={`${knopfPrimär} flex-1`}
          >
            Deck ansehen
          </button>
          {onUndo !== null && (
            <button type="button" onClick={onUndo} className={knopf} title="Letzte Änderung zurücknehmen">
              Rückgängig
            </button>
          )}
        </div>

        <DeckSlots deck={deck} onLoad={onLoadDeck} />

        {/*
          Datei und Teilen braucht man selten. Als natives details bleibt es
          erreichbar, ohne die Spalte mit vier weiteren Knöpfen zu füllen —
          Aufklappen, Tastatur und Zustand kommen vom Browser.
        */}
        <details className="mt-2">
          <summary className={`${zusammenfaltbar} cursor-pointer list-none`}>
            Datei &amp; Teilen
          </summary>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={teilen} disabled={total === 0} className={knopf}>
              {geteilt ?? 'Link teilen'}
            </button>
            <button type="button" onClick={onExport} className={knopf} disabled={total === 0}>
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
            <button type="button" onClick={onClear} className={knopf} disabled={total === 0}>
              Deck leeren
            </button>
          </div>
        </details>

        {total === 0 ? (
          <p className="mt-3 rounded border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-400">
            Karte anklicken oder in eine Zone ziehen.
          </p>
        ) : issues.length === 0 ? (
          <p className="mt-3 rounded border border-emerald-900 bg-emerald-950/60 px-2.5 py-2 text-sm text-emerald-300">
            Deck ist regelkonform
          </p>
        ) : (
          <ul className="mt-3 space-y-1 rounded border border-amber-900 bg-amber-950/60 px-2.5 py-2 text-sm text-amber-300">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}

        {ZONES.map((zone) => zoneAnsicht(zone, 'grid-cols-[repeat(auto-fill,minmax(4rem,1fr))]'))}

        <OpeningHand deck={deck} byId={byId} />
      </div>

      {/*
        Natives dialog: Overlay, Backdrop, Esc und Fokusfalle kommen vom Browser.
        showModal() hebt es in den Top Layer, die Stelle im DOM spielt keine Rolle.
      */}
      <dialog
        ref={grossansicht}
        // Ein Klick auf den Backdrop trifft das dialog-Element selbst, nie ein
        // Kind davon — genau daran lässt er sich vom Klick im Inhalt trennen.
        onClick={(e) => {
          if (e.target === grossansicht.current) grossansicht.current.close()
        }}
        className="m-auto max-h-[90vh] w-[min(94vw,72rem)] overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-6 text-slate-100 backdrop:bg-slate-950/80"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">
            Deck <span className="font-normal text-slate-400">· {total} Karten</span>
          </h2>
          <form method="dialog">
            <button type="submit" className={knopf}>
              Schliessen
            </button>
          </form>
        </div>
        <DeckStats deck={deck} byId={byId} />
        {ZONES.map((zone) => zoneAnsicht(zone, 'grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]'))}
      </dialog>
    </aside>
  )
}
