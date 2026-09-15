# Webversion von `chap_svg.tex`

Das Kapitel «SVG — Scalable Vector Graphics» als Webseite, auf der die Schüler
alle Übungen im Browser lösen können — mit Editor und Live-Vorschau, ohne
Installation. Aufgebaut wie `chap_html-web/`; die Unterschiede stehen weiter
unten.

## Seiten

| Datei                   | Entspricht im Skript                                        | Übungen   |
| ----------------------- | ----------------------------------------------------------- | --------- |
| `index.html`            | Kapiteleinstieg, Zitat, Linksammlung                        | –         |
| `01-grundformen.html`   | «Die Idee von SVG», «Grundstruktur», «Grundformen»          | 5.01–5.13 |
| `02-pfade.html`         | «Pfade», «Gruppieren und Transformieren», «Benennen/Clipping» | 5.14–5.25 |
| `03-animation.html`     | «Animationen»                                               | 5.26–5.31 |

Die Übungen sind durchgehend numeriert wie im Skript, also `\thechapter.NN`.
Jede Seite trägt dazu `data-ex-chapter` und `data-ex-offset` auf `<main>`; die
Nummern entstehen daraus automatisch. Wird eine Übung eingefügt oder entfernt,
muss nur der Offset der folgenden Seiten angepasst werden.

**`data-ex-chapter="5"`** ist eine Annahme: Sie gilt, solange `chap_svg.tex` in
`informatik-skript.tex` an fünfter Stelle steht (nach `chap_codierungen.tex`,
`chap_gatter.tex` bleibt auskommentiert). Verschiebt sich das Kapitel, muss die
Zahl auf allen drei Inhaltsseiten geändert werden.

Die Reihenfolge der Übungen ist auf allen Seiten dieselbe wie im Skript. Wer im
Skript eine Übung einschiebt, muss sie hier an derselben Stelle einschieben,
sonst stimmen die Nummern nicht mehr.

## Bauen

Alle Listings, Beispielbilder und Lösungsvorschläge kommen aus dem Submodul
`code/gyminf/svg/`. `build.py` bündelt sie in `assets/examples.js` und kopiert
die zwei Portraits nach `assets/img/`:

```sh
python3 chap_svg-web/build.py     # aus dem Repo-Wurzelverzeichnis
```

Nach jeder Änderung in `code/gyminf/svg/` neu ausführen. `assets/examples.js`
und `assets/img/` sind erzeugt — nicht von Hand ändern.

Warum ein JS-Bündel und kein `fetch()`: So funktioniert die Seite auch, wenn
sie direkt per Doppelklick (`file://`) geöffnet wird.

## Anschauen

```sh
python3 -m http.server 8000     # aus dem Repo-Wurzelverzeichnis
```

Dann <http://localhost:8000/chap_svg/>. Über `file://` funktioniert alles
ausser `localStorage` in manchen Browsern — für den Unterricht darum besser
über einen Server ausliefern.

Die Seite ist statisch: das ganze Repo auf einen beliebigen Webserver kopieren
genügt. Es gibt kein Backend, und es werden keine Daten hochgeladen.

## Aufbau

```
webskript/
├── index.html                     Startseite mit Links zu allen Kapiteln
├── assets/                        gemeinsam mit chap_html/, siehe dort
└── chap_svg/
    ├── index.html, 01-…, 02-…, 03-…   Inhalt (der Prosatext steht hier)
    ├── build.py                       Bündelt das Submodul
    └── assets/
        ├── examples.js                erzeugt
        └── img/                       erzeugt
```

`style.css`, `site.js` und `editor.js` liegen zusammen mit `chap_html/` unter
`../assets/` im Repo-Wurzelverzeichnis — beide Kapitel benutzen dieselben
Dateien, siehe [`chap_html/README.md`](../chap_html/README.md#aufbau).

### Farbschema

Dunkel ist der Standard; die Einstellung des Betriebssystems spielt keine
Rolle. Der Knopf in der Kopfleiste schaltet auf hell um und legt die Wahl in
`localStorage` ab (`skript.svg.theme`, Werte `dark` und `light`). Der
Schlüssel-Prefix ist `skript.svg.` — dieses Kapitel teilt seinen Fortschritt
also nicht mit `chap_html-web/`.

Jede Seite trägt im `<head>` ein kurzes Skript, welches das Attribut vor dem
ersten Zeichnen setzt — sonst blitzt beim Laden das falsche Schema auf. Wird
eine Seite hinzugefügt, muss dieses Skript mitkopiert werden.

Die Vorschauen (`.demo`, Werkbank) bleiben immer weiss: dort steht die Grafik
der Schüler, und die soll aussehen wie in einem frischen Browserfenster.

### Listings

```html
<figure class="listing">
  <pre data-src="path.svg" data-lines="3-8" data-linenos data-hl="4"></pre>
  <figcaption><b>Listing 2.</b> Ein Pfad</figcaption>
</figure>
```

- `data-src` — Pfad relativ zu `code/gyminf/svg/`. Fehlt er, wird der Inhalt
  des `<pre>` verwendet (dann `&lt;` schreiben).
- `data-lines="a-b"` — Ausschnitt; die gemeinsame Einrückung wird entfernt.
- `data-linenos` — Zeilennummern, beginnend bei der echten Zeile der Datei.
- `data-hl="9,10"` oder `"6-16"` — hervorgehobene Zeilen.
- `data-lang` — `html` (Standard) oder `css`. SVG wird mit dem HTML-Tokenizer
  eingefärbt; das passt, denn beides ist Markup.

### Live-Vorschau eines Beispiels

```html
<figure class="demo">
  <iframe data-src="flower.svg" data-height="220"></iframe>
  <figcaption>Eine Blume.</figcaption>
</figure>
```

Endet `data-src` auf `.svg`, stellt `site.js` die Datei in den `<body>` eines
leeren Dokuments und zentriert sie (`SVG_DEMO_CSS` in `site.js`). Weil eine
SVG-Datei kein ganzes HTML-Dokument ist, ist das genau richtig: Der Browser
zeichnet sie als Inline-SVG, so wie sie in einer Webseite stünde.

Das ersetzt hier fast alle Bilder des Skripts:

- **Beispiele** stehen als Code und als gezeichnetes Bild nebeneinander, genau
  wie das `\svgexample`-Makro im Skript.
- **Zielbilder** von Übungen sind die gerenderte Lösungsdatei. Das Bild ist
  immer sichtbar — es ist ja die Aufgabe. Der Code dazu steckt im
  Lösungsvorschlag und ist darum normalerweise nicht auf der Seite (siehe
  [Lösungen](#lösungen)).
- **Animationen** laufen wirklich. Das Skript kann nur ein starres Bild zeigen
  und hat dafür eigene `*-still.svg`-Dateien; die Webseite braucht sie nicht
  und verwendet immer die animierte Datei.

Didaktische Figuren, die es im Submodul nicht gibt (Koordinatensystem,
Kontrollpunkte einer Bézierkurve), stehen als Inline-`<svg>` in
`<figure class="diagram">` direkt in der Seite. Sie zeichnen mit
`currentColor` und gehen darum beim Wechsel des Farbschemas mit.

### Übung

```html
<section class="exercise" id="ex-swissflag" data-tag="Recherche">
  <div class="exercise__body">
    …
    <details class="sol"><summary>Lösungsvorschlag</summary>
      <div class="sol__body">…</div>
    </details>
  </div>
</section>
```

Kopfzeile, Nummer und das Häkchen «erledigt» werden von `site.js` ergänzt.
`data-tag` ist optional. Die `id` ist der Schlüssel für den gespeicherten
Fortschritt — beim Umbenennen verlieren die Schüler ihr Häkchen und ihren Code
für diese Übung.

### Lösungen

Die Schüler bekommen die Lösungen nicht auf der Webseite: Sie sollen sie im
Skript nachschlagen. `setupSolutions()` in `site.js` nimmt darum jedes
`details.sol` aus dem DOM, bevor die Seite fertig aufgebaut ist, und der Knopf
«Lösung laden» der Werkbank wird nicht gebaut.

Für den Unterricht schaltet ein Aufruf mit `?loesungen=1` beides ein,
`?loesungen=0` wieder aus:

```
01-grundformen.html?loesungen=1
```

Die Wahl liegt in `localStorage` (`skript.svg.loesungen`, Werte `1` und `0`)
und gilt darum für alle Seiten dieses Browsers, auch ohne Parameter in der URL.
Ist sie eingeschaltet, trägt `<html>` das Attribut `data-loesungen="1"`.

Das ist eine Bequemlichkeit und **kein Schloss.** Die Lösungsboxen stehen
weiterhin im Quelltext der Seiten, und `assets/examples.js` enthält sowieso
jede Datei des Submoduls als `window.EXAMPLES` — mit der Konsole oder Ctrl+U
kommt man an alles heran. Wer die Lösungen wirklich zurückhalten will, muss
eine eigene, bereinigte Fassung der Seiten ausliefern.

### Werkbank

```html
<div class="workbench" data-id="wb9" data-files="svg"
     data-seed-svg="three-ellipse.svg"
     data-sol-svg="swiss-flag.svg"
     data-height="300"></div>
```

- `data-id` — eindeutig pro Seite, Schlüssel für den gespeicherten Code.
- `data-files` — `svg` (Standard in diesem Kapitel, ein Reiter `bild.svg`).
  `html` und `css` funktionieren weiterhin, für den Fall, dass eine Übung ein
  SVG in einer Webseite braucht.
- `data-seed-*` — Startcode aus dem Submodul. Alternativ direkt im Element:
  `<template data-seed="svg">…</template>` (Inhalt mit `&lt;` schreiben und
  ohne Einrückung, sonst landet sie im Editor).
- `data-sol-*` — schaltet den Knopf «Lösung laden» ein, sofern die Lösungen
  eingeschaltet sind (siehe [Lösungen](#lösungen)).

Ist `svg` unter `data-files`, wird der Inhalt des Reiters als Inline-SVG in die
Vorschau gestellt, mit demselben Zentrierstil wie eine `.demo`. Der Editor
färbt SVG mit dem HTML-Tokenizer ein.

Auch im `svg`-Reiter expandiert Tab Emmet-artige Kürzel (`g>circle+rect`,
`svg>circle*3`, `use[href=#stern]`) -- derselbe Parser wie im `html`-Reiter
von `chap_html/`, aber mit einem eigenen Profil (`EMMET_PROFILE_SVG` in
`editor.js`): eigene Tag-Liste mit den SVG-Elementnamen (`circle`, `rect`,
`linearGradient`, …, Gross-/Kleinschreibung bleibt erhalten), eigene leere
Elemente (`circle`, `path`, `use`, `stop`, …) und ein paar sinnvolle
Standardattribute (`circle` bekommt `cx`/`cy`/`r`, `path` bekommt `d`). Ein
Tag ohne bekannten Namen expandiert nicht -- Tab fügt dann wie gewohnt zwei
Leerzeichen ein.

Die Vorschau läuft in einem `sandbox`-`<iframe>` mit `srcdoc`, ohne
`allow-same-origin`. Sie kann also nicht auf diese Seite oder den gespeicherten
Code zugreifen.

## Was der Browser nicht kann

- Eine Animation mit `fill="freeze"` läuft nur einmal und ist vorbei, bevor die
  Schüler hinunterscrollen. Bei diesen Übungen steht darum in der Bildlegende,
  dass ein Neuladen der Seite sie neu startet.
- Der Fortschritt liegt in `localStorage`, also pro Browser und Gerät. Wer den
  Rechner wechselt, fängt mit leeren Werkbänken an; darum der Knopf
  «Herunterladen».

## Bekannte Abweichungen vom Skript

- Statt Seitenverweisen («Seite 15») verlinkt die Webseite direkt auf das Ziel.
- Das Zitat von Benoît Mandelbrot steht auf der Startseite statt am
  Kapitelanfang, und der Quellennachweis ist ein Link statt einer Fussnote.
- Die Tabellen des Skripts (Raster/Vektor, Pfadbefehle) sind
  `<table class="data">`.
- Die Übung zur `viewBox` hat im Skript keine Werkbank; hier ist die Lösung der
  vorhergehenden Übung als Startcode eingefüllt.
