import type { MdRarity } from '../data/types.ts'
import type { Facets } from '../search/facets.ts'
import type { CardQuery } from '../search/filter.ts'

interface Props {
  facets: Facets
  query: CardQuery
  onChange: (patch: Partial<CardQuery>) => void
}

/** "effect_pendulum" -> "effect pendulum" */
function pretty(value: string): string {
  return value.replace(/_/g, ' ')
}

function numberOrNull(value: string): number | null {
  return value === '' ? null : Number(value)
}

/** Fest verdrahtet: Master Duel hat genau diese vier Stufen, die ändern sich nicht. */
const MD_OPTIONEN: { wert: MdRarity | 'keine'; text: string }[] = [
  { wert: 'N', text: 'N' },
  { wert: 'R', text: 'R' },
  { wert: 'SR', text: 'SR' },
  { wert: 'UR', text: 'UR' },
  { wert: 'keine', text: 'nicht in Master Duel' },
]

const field =
  'rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm outline-none focus:border-slate-500'

interface RangeProps {
  label: string
  min: number | null
  max: number | null
  step?: number
  onMin: (value: number | null) => void
  onMax: (value: number | null) => void
}

/** Muss ausserhalb von Filters stehen, sonst remountet React die Inputs bei jedem Render. */
function Range({ label, min, max, step, onMin, onMax }: RangeProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          step={step}
          placeholder="von"
          value={min ?? ''}
          onChange={(e) => {
            onMin(numberOrNull(e.target.value))
          }}
          className={`${field} w-20`}
        />
        <input
          type="number"
          min={0}
          step={step}
          placeholder="bis"
          value={max ?? ''}
          onChange={(e) => {
            onMax(numberOrNull(e.target.value))
          }}
          className={`${field} w-20`}
        />
      </span>
    </label>
  )
}

export function Filters({ facets, query, onChange }: Props) {
  // Einfachauswahl reicht; CardQuery nimmt Listen, falls später Mehrfachauswahl kommt.
  const pick = (key: 'frameTypes' | 'attributes' | 'races', value: string): void => {
    onChange({ [key]: value === '' ? [] : [value] })
  }

  return (
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Typ</span>
        <select
          className={field}
          value={query.frameTypes[0] ?? ''}
          onChange={(e) => {
            pick('frameTypes', e.target.value)
          }}
        >
          <option value="">alle</option>
          {facets.frameTypes.map((v) => (
            <option key={v} value={v}>
              {pretty(v)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Attribut</span>
        <select
          className={field}
          value={query.attributes[0] ?? ''}
          onChange={(e) => {
            pick('attributes', e.target.value)
          }}
        >
          <option value="">alle</option>
          {facets.attributes.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Monsterart</span>
        <select
          className={field}
          value={query.races[0] ?? ''}
          onChange={(e) => {
            pick('races', e.target.value)
          }}
        >
          <option value="">alle</option>
          {facets.races.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Master Duel</span>
        <select
          className={field}
          value={query.md ?? ''}
          onChange={(e) => {
            const wert = e.target.value
            onChange({ md: wert === '' ? null : (wert as MdRarity | 'keine') })
          }}
        >
          <option value="">alle</option>
          {MD_OPTIONEN.map(({ wert, text }) => (
            <option key={wert} value={wert}>
              {text}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">Archetyp</span>
        {/* datalist statt Autocomplete-Komponente: 656 Einträge, native Suche im Browser */}
        <input
          className={`${field} w-48`}
          list="archetypes"
          placeholder="alle"
          value={query.archetype ?? ''}
          onChange={(e) => {
            onChange({ archetype: e.target.value === '' ? null : e.target.value })
          }}
        />
        <datalist id="archetypes">
          {facets.archetypes.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      </label>

      <Range
        label="Level / Rang"
        min={query.levelMin}
        max={query.levelMax}
        onMin={(v) => {
          onChange({ levelMin: v })
        }}
        onMax={(v) => {
          onChange({ levelMax: v })
        }}
      />
      <Range
        label="ATK"
        min={query.atkMin}
        max={query.atkMax}
        step={100}
        onMin={(v) => {
          onChange({ atkMin: v })
        }}
        onMax={(v) => {
          onChange({ atkMax: v })
        }}
      />
      <Range
        label="DEF"
        min={query.defMin}
        max={query.defMax}
        step={100}
        onMin={(v) => {
          onChange({ defMin: v })
        }}
        onMax={(v) => {
          onChange({ defMax: v })
        }}
      />
    </div>
  )
}
