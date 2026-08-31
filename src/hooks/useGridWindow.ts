import { useEffect, useState } from 'react'

/** Mindestbreite einer Kartenzelle in Pixeln. */
export const CELL_MIN = 120
/** Abstand zwischen den Zellen in Pixeln. */
export const GAP = 12
/** Seitenverhältnis der Kartenbilder (168 x 246). */
const RATIO = 246 / 168
/** Zusätzliche Zeilen ober- und unterhalb des Sichtbereichs gegen Flackern. */
const OVERSCAN = 2

export interface GridWindow {
  /** An das Container-Element hängen, dessen Breite das Raster bestimmt. */
  setContainer: (element: HTMLDivElement | null) => void
  columns: number
  rowHeight: number
  /** Erster und letzter sichtbarer Index in der Ergebnisliste (last exklusiv). */
  first: number
  last: number
  /** Höhe der Platzhalter ober- und unterhalb der gerenderten Zeilen. */
  paddingTop: number
  paddingBottom: number
}

/**
 * Rendert nur die Zeilen, die gerade im Sichtbereich liegen. Ober- und unterhalb
 * hält je ein Platzhalter die Scrollhöhe korrekt, damit die Scrollbar stimmt.
 *
 * Damit bleibt die Anzahl DOM-Knoten konstant, egal ob 200 oder 14'291 Karten
 * gefunden wurden — vorher wuchs die Liste beim Scrollen unbegrenzt weiter.
 */
export function useGridWindow(total: number): GridWindow {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  /** Abstand des Rasters vom Seitenanfang; ändert sich, wenn die Filter umbrechen. */
  const [offsetTop, setOffsetTop] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [viewport, setViewport] = useState(0)

  useEffect(() => {
    if (container === null) return

    const measure = (): void => {
      const box = container.getBoundingClientRect()
      setWidth(box.width)
      setOffsetTop(box.top + window.scrollY)
      setViewport(window.innerHeight)
    }
    const onScroll = (): void => {
      setScrollY(window.scrollY)
    }

    measure()
    // ResizeObserver deckt auch Umbrüche der Filterzeile ab, nicht nur Fenstergrösse.
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
    }
  }, [container])

  // Vor der ersten Messung nichts rendern, sonst wird mit Breite 0 gerechnet.
  if (width === 0) {
    return {
      setContainer,
      columns: 1,
      rowHeight: 0,
      first: 0,
      last: 0,
      paddingTop: 0,
      paddingBottom: 0,
    }
  }

  const columns = Math.max(1, Math.floor((width + GAP) / (CELL_MIN + GAP)))
  const cellWidth = (width - GAP * (columns - 1)) / columns
  const rowHeight = cellWidth * RATIO + GAP
  const totalRows = Math.ceil(total / columns)

  const firstRow = Math.max(0, Math.floor((scrollY - offsetTop) / rowHeight) - OVERSCAN)
  const visibleRows = Math.ceil(viewport / rowHeight) + OVERSCAN * 2
  const lastRow = Math.min(totalRows, firstRow + visibleRows)

  return {
    setContainer,
    columns,
    rowHeight,
    first: firstRow * columns,
    last: Math.min(total, lastRow * columns),
    paddingTop: firstRow * rowHeight,
    paddingBottom: Math.max(0, (totalRows - lastRow) * rowHeight),
  }
}
