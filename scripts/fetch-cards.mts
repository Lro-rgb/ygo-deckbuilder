/**
 * Einmaliger Kartenimport von der YGOPRODeck-API.
 *
 * Ergebnis:
 *   public/cards.json       reduzierter Datensatz (siehe src/data/types.ts)
 *   public/cards/<id>.jpg   kleine Kartenbilder, lokal statt hotgelinkt
 *
 * Aufruf:  npm run cards [-- --no-images] [-- --limit 200] [-- --refresh]
 *
 * Wichtig zum Rate Limit (20 req/s, sonst 1h Sperre):
 *  - Die Kartendaten kommen in EINEM Request (cardinfo.php ohne Parameter).
 *  - Nur die Bilder sind viele Requests. Die werden gedrosselt geladen und
 *    bereits vorhandene Dateien uebersprungen, damit ein Abbruch nicht schadet.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Card, CardDatabase, DeckKind } from '../src/data/types.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CACHE_FILE = path.join(ROOT, 'scripts', '.cache', 'cardinfo.json')
const OUT_JSON = path.join(ROOT, 'public', 'cards.json')
const IMAGE_DIR = path.join(ROOT, 'public', 'cards')

const API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'
const CONCURRENCY = 8
/** Mindestabstand zwischen zwei Bild-Requests -> max. ~16 req/s, Puffer zum Limit. */
const MIN_GAP_MS = 60

// --- Rohform der API, nur die Felder die wir anfassen -----------------------

interface ApiImage {
  id: number
  image_url_small: string
}

interface ApiCard {
  id: number
  name: string
  type: string
  frameType: string
  desc: string
  race: string
  // null statt fehlend ist bei dieser API normal (z.B. def/level bei Link-Monstern)
  attribute?: string | null
  atk?: number | null
  def?: number | null
  level?: number | null
  scale?: number | null
  linkval?: number | null
  archetype?: string | null
  card_images?: ApiImage[]
  banlist_info?: { ban_tcg?: string | null }
}

// --- Argumente --------------------------------------------------------------

const args = process.argv.slice(2)
const noImages = args.includes('--no-images')
const refresh = args.includes('--refresh')
const limitIndex = args.indexOf('--limit')
const limit = limitIndex >= 0 ? Number(args[limitIndex + 1]) : Infinity

// --- Schritt 1: Rohdaten holen (mit lokalem Cache) --------------------------

async function exists(file: string): Promise<boolean> {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

async function loadRawCards(): Promise<ApiCard[]> {
  if (!refresh && (await exists(CACHE_FILE))) {
    console.log('Nutze Cache:', path.relative(ROOT, CACHE_FILE))
    const cached: unknown = JSON.parse(await readFile(CACHE_FILE, 'utf8'))
    return (cached as { data: ApiCard[] }).data
  }

  console.log('Lade Kartendaten von der API (ein Request, ~60 MB) ...')
  const res = await fetch(API_URL)
  if (!res.ok) throw new Error(`API antwortete mit ${res.status} ${res.statusText}`)
  const body = await res.text()

  await mkdir(path.dirname(CACHE_FILE), { recursive: true })
  await writeFile(CACHE_FILE, body)

  const parsed: unknown = JSON.parse(body)
  return (parsed as { data: ApiCard[] }).data
}

// --- Schritt 2: auf das Noetige reduzieren ----------------------------------

/** Fusion, Synchro, XYZ und Link gehoeren ins Extra Deck - auch als Pendulum-Mischform. */
const EXTRA_DECK = /\b(Fusion|Synchro|XYZ|Link)\b/i
/** Tokens und Speed-Duel-Skills sind in keinem normalen Deck spielbar. */
const NOT_PLAYABLE = /\b(Token|Skill Card)\b/i

const BAN_LIMITS: Record<string, 0 | 1 | 2> = {
  Forbidden: 0,
  Limited: 1,
  'Semi-Limited': 2,
}

function deckKind(type: string): DeckKind {
  return EXTRA_DECK.test(type) ? 'extra' : 'main'
}

/**
 * Laesst leere Felder weg, damit das JSON nicht unnoetig aufgeblaeht wird.
 * Achtung: die API schickt bei Link-Monstern `def: null` und `level: null`,
 * darum wird gegen null UND undefined geprueft.
 */
function toCard(raw: ApiCard): Card {
  const card: Card = {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    frameType: raw.frameType,
    desc: raw.desc,
    race: raw.race,
    deck: deckKind(raw.type),
  }
  if (raw.attribute != null) card.attribute = raw.attribute
  if (raw.atk != null) card.atk = raw.atk
  if (raw.def != null) card.def = raw.def
  if (raw.level != null) card.level = raw.level
  if (raw.scale != null) card.scale = raw.scale
  if (raw.linkval != null) card.linkval = raw.linkval
  if (raw.archetype != null) card.archetype = raw.archetype

  const ban = raw.banlist_info?.ban_tcg
  if (ban != null && ban in BAN_LIMITS) card.limit = BAN_LIMITS[ban]

  return card
}

// --- Schritt 3: Bilder laden ------------------------------------------------

let nextSlot = 0

/** Wartet, bis der naechste Zeitschlitz frei ist. Haelt die Requests unter dem Limit. */
async function throttle(): Promise<void> {
  const now = Date.now()
  const slot = Math.max(now, nextSlot)
  nextSlot = slot + MIN_GAP_MS
  if (slot > now) await new Promise((resolve) => setTimeout(resolve, slot - now))
}

async function downloadImage(url: string, file: string): Promise<'skipped' | 'ok'> {
  if (await exists(file)) return 'skipped'

  for (let attempt = 1; attempt <= 3; attempt++) {
    await throttle()
    try {
      const res = await fetch(url)
      if (res.status === 429) {
        // Sperre droht: lieber lange warten als weiterhaemmern.
        console.warn('\nRate Limit erreicht, warte 60s ...')
        await new Promise((resolve) => setTimeout(resolve, 60_000))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await writeFile(file, Buffer.from(await res.arrayBuffer()))
      return 'ok'
    } catch (err) {
      if (attempt === 3) throw new Error(`Bild ${url} fehlgeschlagen: ${String(err)}`)
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
    }
  }
  return 'ok'
}

interface ImageJob {
  url: string
  file: string
}

/** Arbeitet die Liste mit fester Parallelitaet ab (kein Paket noetig). */
async function downloadAll(jobs: ImageJob[]): Promise<void> {
  let index = 0
  let done = 0
  let loaded = 0

  const worker = async (): Promise<void> => {
    while (index < jobs.length) {
      const job = jobs[index++]
      const result = await downloadImage(job.url, job.file)
      if (result === 'ok') loaded++
      done++
      if (done % 100 === 0 || done === jobs.length) {
        process.stdout.write(`\rBilder: ${done}/${jobs.length} (${loaded} neu)`)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  process.stdout.write('\n')
}

// --- Ablauf -----------------------------------------------------------------

async function main(): Promise<void> {
  const raw = await loadRawCards()
  console.log(`API lieferte ${raw.length} Eintraege.`)

  const playable = raw.filter((card) => !NOT_PLAYABLE.test(card.type)).slice(0, limit)
  const cards = playable.map(toCard)

  // Alternative Artworks tauchen als eigene Passcodes auf, sind aber dieselbe Karte.
  const aliases: Record<string, number> = {}
  const jobs: ImageJob[] = []

  for (const card of playable) {
    const images = card.card_images ?? []
    for (const image of images) {
      if (image.id !== card.id) aliases[String(image.id)] = card.id
    }
    // Nur das erste Artwork laden - mehr braucht die Deckansicht nicht.
    if (images[0]) {
      jobs.push({ url: images[0].image_url_small, file: path.join(IMAGE_DIR, `${card.id}.jpg`) })
    }
  }

  const db: CardDatabase = { generatedAt: new Date().toISOString(), cards, aliases }
  const json = JSON.stringify(db)
  await mkdir(path.dirname(OUT_JSON), { recursive: true })
  await writeFile(OUT_JSON, json)

  const sizeMb = (Buffer.byteLength(json) / 1024 / 1024).toFixed(1)
  console.log(
    `${cards.length} Karten geschrieben (${sizeMb} MB), ${Object.keys(aliases).length} Alt-Art-Aliase.`,
  )

  if (noImages) {
    console.log('Bilder uebersprungen (--no-images).')
    return
  }

  await mkdir(IMAGE_DIR, { recursive: true })
  console.log(`Lade ${jobs.length} Bilder (vorhandene werden uebersprungen) ...`)
  await downloadAll(jobs)
  console.log('Fertig.')
}

main().catch((err: unknown) => {
  console.error('\nAbbruch:', err instanceof Error ? err.message : err)
  process.exit(1)
})
