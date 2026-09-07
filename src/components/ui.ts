/**
 * Die Bausteine der Oberfläche an einer Stelle. Vorher hatte jede Datei ihre
 * eigene Variante mit leicht anderen Abständen — gleiche Absicht, uneinheitlich
 * im Ergebnis.
 */

/** Normaler Knopf. */
export const knopf =
  'rounded border border-slate-700 px-2.5 py-1.5 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40'

/** Die eine wichtige Aktion pro Bereich. Höchstens eine, sonst hebt sich nichts mehr ab. */
export const knopfPrimär =
  'rounded border border-sky-700 bg-sky-950/60 px-2.5 py-1.5 text-sm font-medium text-sky-200 transition-colors hover:border-sky-500 hover:bg-sky-900/50 disabled:cursor-not-allowed disabled:opacity-40'

/** Eingabefeld und Auswahlliste. */
export const feld =
  'rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-slate-500'

/** Aufklappbarer Bereich für alles, was man selten braucht. */
export const zusammenfaltbar =
  'rounded border border-slate-800 px-2.5 py-1.5 text-sm text-slate-400 transition-colors hover:text-slate-200'
