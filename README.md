# Yu-Gi-Oh! Deckbuilder

Deckbuilder für das Yu-Gi-Oh! TCG als reine Client-App. Kartensuche mit Filtern,
Deck-Editor mit Main/Extra/Side, Banlist-Prüfung und `.ydk`-Import/Export.

Stack: React + TypeScript, Vite, Tailwind CSS. Kein Backend.

## Einrichten

```bash
npm install
npm run cards
npm run dev
```

`npm run cards` ist der einmalige Kartenimport (siehe unten). Ohne diesen
Schritt startet die App zwar, hat aber keine Kartendaten.

## Kartenimport

Die Kartendaten stammen von der [YGOPRODeck-API](https://ygoprodeck.com/api-guide/)
(kostenlos, kein Key nötig). Die API erlaubt 20 Requests pro Sekunde und sperrt
bei Überschreitung für eine Stunde; Bilder dürfen ausserdem nicht hotgelinkt
werden. Deshalb läuft der komplette Datenbezug einmalig beim Entwickeln und
nicht zur Laufzeit:

- `scripts/fetch-cards.mts` holt alle ~14'000 Karten in **einem** Request
- reduziert sie auf die benötigten Felder → `public/cards.json` (~7 MB)
- lädt die Kartenbilder nach `public/cards/<id>.jpg`

Zur Laufzeit macht die App **keine** API-Calls, sie lädt nur `cards.json`.

Optionen:

```bash
npm run cards -- --no-images    # nur das JSON neu erzeugen
npm run cards -- --limit 200    # kleiner Testlauf
npm run cards -- --refresh      # API neu abfragen statt Cache zu nutzen
```

Die Rohantwort der API wird in `scripts/.cache/` zwischengespeichert, damit
wiederholte Läufe die API nicht unnötig belasten. Bereits vorhandene Bilder
werden übersprungen — ein abgebrochener Lauf kann einfach neu gestartet werden.

Die erzeugten Dateien (`public/cards.json`, `public/cards/`, `scripts/.cache/`)
sind bewusst nicht im Repository; sie werden lokal mit `npm run cards` erzeugt.

Die Kartenbilder sind in `vite.config.ts` vom Dateiwächter ausgenommen. Ohne
diese Ausnahme indexiert Vite beim Start alle ~14'000 Bilder und blockiert
dabei den Node-Prozess: das Ausliefern eines einzelnen Bildes dauert dann rund
1.4 Sekunden statt 1 Millisekunde.

## Quellen

- Kartendaten und Bilder: [YGOPRODeck](https://ygoprodeck.com/) via
  `https://db.ygoprodeck.com/api/v7/cardinfo.php`
- Yu-Gi-Oh! ist eine Marke von Konami. Dieses Projekt ist ein privates
  Lernprojekt ohne Verbindung zu Konami.
