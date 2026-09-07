import { useState } from 'react'
import { cardImageUrl } from '../data/cards.ts'

interface Props {
  id: number
  name: string
}

/**
 * Ein Kartenbild — eigene Komponente, weil es drei Stellen gibt, die eines
 * zeichnen, und weil das Bild fehlen kann: cards.json entsteht bei jedem
 * Deploy neu aus der API, die Bilder werden aber nur gelegentlich nachgeladen.
 * Zu einer brandneuen Karte gibt es dann noch keines. Statt eines kaputten
 * Symbols steht dort der Kartenname.
 */
export function CardImage({ id, name }: Props) {
  const [fehlt, setFehlt] = useState(false)

  if (fehlt) {
    return (
      <span className="flex aspect-[168/246] w-full items-center justify-center rounded border border-slate-700 bg-slate-800 p-1 text-center text-[0.6rem] leading-tight text-slate-400">
        {name}
      </span>
    )
  }

  return (
    <img
      src={cardImageUrl(id)}
      alt={name}
      width={168}
      height={246}
      loading="lazy"
      draggable={false}
      onError={() => {
        setFehlt(true)
      }}
      className="w-full rounded"
    />
  )
}
