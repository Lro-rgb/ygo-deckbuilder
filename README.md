# Yu-Gi-Oh! Deckbuilder

Deckbuilder für das Yu-Gi-Oh! TCG als reine Client-App. Kartensuche mit Filtern,
Deck-Editor mit Main/Extra/Side, Banlist-Prüfung und `.ydk`-Import/Export.

Stack: React + TypeScript, Vite, Tailwind CSS. Kein Backend.

## Funktionen

- Kartensuche über ~14'000 Karten mit Freitext sowie Filtern für Typ,
  Attribut, Monsterart, Archetyp, Level/Rang, ATK, DEF und Master-Duel-Seltenheit
  (inklusive „nicht in Master Duel")
- Deck-Editor mit Main, Extra und Side Deck; Karten per Klick oder
  Drag and Drop hinzufügen, verschieben und entfernen
- Laufende Regelprüfung: Zonengrössen, höchstens drei Kopien über alle
  Zonen zusammen und die aktuelle TCG-Banlist
- Import und Export im `.ydk`-Format
- Das Deck überlebt einen Reload: es liegt im `localStorage` des Browsers
- Kosten des Decks: Craft-Preis in Master Duel je CP-Topf (N, R, SR, UR sind
  getrennte Währungen) und Summe der Cardmarket-Richtpreise; Karten ohne
  Angabe werden ausgewiesen statt mitgerechnet
- Deck teilen: der Knopf legt einen Link in die Zwischenablage, der das ganze
  Deck im URL-Fragment trägt — kein Server, keine Datenbank
- Starthand: Chance auf jede Karte in den ersten fünf Karten, exakt über die
  hypergeometrische Verteilung gerechnet statt simuliert, dazu eine Beispielhand

## Einrichten

```bash
npm install
npm run cards
npm run dev
```

`npm run cards` ist der einmalige Kartenimport (siehe unten). Ohne diesen
Schritt startet die App zwar, hat aber keine Kartendaten.

Die Regeln des Deck-Editors und der `.ydk`-Umgang sind mit dem Testrunner von
Node abgedeckt, ohne zusätzliches Testframework:

```bash
npm test
```

## Kartenimport

Die Kartendaten stammen von der [YGOPRODeck-API](https://ygoprodeck.com/api-guide/)
(kostenlos, kein Key nötig). Die API erlaubt 20 Requests pro Sekunde und sperrt
bei Überschreitung für eine Stunde; Bilder dürfen ausserdem nicht hotgelinkt
werden. Deshalb läuft der komplette Datenbezug einmalig beim Entwickeln und
nicht zur Laufzeit:

- `scripts/fetch-cards.mts` holt alle ~14'000 Karten in **einem** Request
  (`?misc=yes`, dadurch sind Master-Duel-Seltenheit und Preise gleich dabei)
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
- Preise: Cardmarket-Richtpreise aus derselben API-Antwort. Momentaufnahme des
  Imports, kein Angebot — der echte Preis hängt an Auflage, Zustand und Anbieter.
- Craft-Kosten in Master Duel: 30 CP je Kopie, in der Sorte der Karte. Die vier
  Töpfe (N, R, SR, UR) sind getrennt und nicht gegeneinander tauschbar — eine
  UR kostet 30 UR-CP, nicht 30 beliebige CP.
- Yu-Gi-Oh! ist eine Marke von Konami. Dieses Projekt ist ein privates
  Lernprojekt ohne Verbindung zu Konami.
