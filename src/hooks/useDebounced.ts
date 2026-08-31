import { useEffect, useState } from 'react'

/**
 * Gibt den Wert erst nach einer Ruhepause zurück. Damit läuft die Suche nicht
 * bei jedem Tastendruck über alle Karten, sondern erst wenn getippt wurde.
 */
export function useDebounced<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return () => {
      clearTimeout(timer)
    }
  }, [value, delayMs])

  return debounced
}
