# Webversion von `chap_html.tex`

Das Kapitel «HTML und CSS» als Webseite, auf der die Schüler alle Übungen im
Browser lösen können — mit Editor und Live-Vorschau, ohne Installation.

## Seiten

| Datei              | Entspricht im Skript                          | Übungen |
| ------------------ | --------------------------------------------- | ------- |
| `index.html`       | Kapiteleinstieg, Linksammlung                 | –       |
| `01-html.html`     | Abschnitt «Die Struktur von Webseiten: HTML»   | 3.01–3.14 |
| `02-css.html`      | Abschnitt «Webseiten gestalten: CSS»          | 3.15–3.37 |
| `03-projekt.html`  | Abschnitt «Eine eigene Webseite»              | 3.38–3.39 |

Die Übungen sind durchgehend numeriert wie im Skript, also `\thechapter.NN` —
`3.01`, `3.02`, …. Jede Seite trägt dazu `data-ex-chapter` (die Kapitelnummer,
Standard `3`) und `data-ex-offset` auf `<main>`; die Nummern entstehen daraus
automatisch. Wird eine Übung eingefügt oder entfernt, muss nur der Offset der
folgenden Seiten angepasst werden.

## Bauen

Alle Listings und Lösungsvorschläge kommen aus dem Submodul
`code/gyminf/html/`. `build.py` bündelt sie in `assets/examples.js` und kopiert
die Figuren, welche die Seite nicht selber rendern kann, nach `assets/img/`:

```sh
python3 web/build.py     # aus dem Repo-Wurzelverzeichnis
```

Nach jeder Änderung in `code/gyminf/html/` neu ausführen. `assets/examples.js`
und `assets/img/` sind erzeugt — nicht von Hand ändern.

Warum ein JS-Bündel und kein `fetch()`: So funktioniert die Seite auch, wenn
sie direkt per Doppelklick (`file://`) geöffnet wird.

## Anschauen

```sh
python3 -m http.server 8000     # aus dem Repo-Wurzelverzeichnis
```

Dann <http://localhost:8000/chap_html/>. Über `file://` funktioniert alles
ausser `localStorage` in manchen Browsern — für den Unterricht darum besser
über einen Server ausliefern.

Die Seite ist statisch: das ganze Repo auf einen beliebigen Webserver kopieren
genügt. Es gibt kein Backend, und es werden keine Daten hochgeladen.

## Aufbau

```
webskript/
├── index.html                     Startseite mit Links zu allen Kapiteln
├── assets/
│   ├── css/style.css              Gestaltung, dunkel und hell — geteilt mit chap_svg/
│   └── js/
│       ├── site.js                Syntaxfarben, Listings, Vorschauen,
│       │                          Übungsnummern, Fortschritt, minitoc,
│       │                          Lösungsschalter — geteilt mit chap_svg/
│       └── editor.js              Die «Werkbank» (Editor + Vorschau) — geteilt
└── chap_html/
    ├── index.html, 01-…, 02-…, 03-…   Inhalt (der Prosatext steht hier)
    ├── build.py                       Bündelt das Submodul
    └── assets/
        ├── examples.js                erzeugt
        └── img/                       erzeugt
```

`style.css`, `site.js` und `editor.js` sind kapitelunabhängig: `site.js`
bestimmt den localStorage-Namensraum (`skript.html.*`, `skript.svg.*`, …)
automatisch aus dem Ordnernamen (`chap_html` → `html`), und `editor.js` baut
die Werkbank-Reiter aus `data-files` auf der jeweiligen Seite. Ein drittes
Kapitel braucht darum keine Änderung an diesen Dateien.

### Farbschema

Dunkel ist der Standard; die Einstellung des Betriebssystems spielt keine
Rolle. Der Knopf in der Kopfleiste schaltet auf hell um und legt die Wahl in
`localStorage` ab (`skript.html.theme`, Werte `dark` und `light`).

In `style.css` stehen die dunklen Farben darum direkt in `:root`, die hellen in
`:root[data-theme="light"]`. Jede Seite trägt im `<head>` ein kurzes Skript,
welches das Attribut vor dem ersten Zeichnen setzt — sonst blitzt beim Laden
das falsche Schema auf. Wird eine Seite hinzugefügt, muss dieses Skript
mitkopiert werden.

Die Vorschauen (`.demo`, Werkbank) bleiben immer weiss: dort steht die Seite der
Schüler, und die soll aussehen wie in einem frischen Browserfenster.

### Listings

```html
<figure class="listing">
  <pre data-src="first-example.html" data-lines="13-16" data-linenos data-hl="9,10"></pre>
  <figcaption><b>Listing 2.</b> Ungeordnete Liste</figcaption>
</figure>
```

- `data-src` — Pfad relativ zu `code/gyminf/html/`. Fehlt er, wird der Inhalt
  des `<pre>` verwendet (dann `&lt;` schreiben).
- `data-lines="a-b"` — Ausschnitt; die gemeinsame Einrückung wird entfernt.
- `data-linenos` — Zeilennummern, beginnend bei der echten Zeile der Datei.
- `data-hl="9,10"` oder `"6-16"` — hervorgehobene Zeilen (wie `highlightlines`
  bei `minted`).
- `data-lang` — `html` (Standard) oder `css`; sonst aus der Endung.

### Live-Vorschau eines Beispiels

```html
<figure class="demo">
  <iframe data-src="firstcss/first-css-example.html"
          data-css="firstcss/style.css" data-height="320"></iframe>
  <figcaption>Die Webseite mit CSS.</figcaption>
</figure>
```

Ersetzt die Screenshots des Skripts, wo das Resultat reproduzierbar ist. Ein
`<link rel="stylesheet">` mit relativem Pfad wird durch den Inhalt von
`data-css` ersetzt. Screenshots bleiben dort, wo sie ein *Ziel* zeigen, das die
Schüler nachbauen sollen.

### Übung

```html
<section class="exercise" id="ex-structure" data-tag="Recherche">
  <div class="exercise__body">
    …
    <details class="sol"><summary>Lösungsvorschlag</summary>
      <div class="sol__body">…</div>
    </details>
  </div>
</section>
```

Kopfzeile, Nummer und das Häkchen «erledigt» werden von `site.js` ergänzt.
`data-tag` ist optional (`Recherche`, `Spiel`, `Tutorial`, `Projekt`).
Die `id` ist der Schlüssel für den gespeicherten Fortschritt — beim Umbenennen
verlieren die Schüler ihr Häkchen und ihren Code für diese Übung.

### Lösungen

Die Schüler bekommen die Lösungen nicht auf der Webseite: Sie sollen sie im
Skript nachschlagen. `setupSolutions()` in `site.js` nimmt darum jedes
`details.sol` aus dem DOM, bevor die Seite fertig aufgebaut ist, und der Knopf
«Lösung laden» der Werkbank wird nicht gebaut.

Für den Unterricht schaltet ein Aufruf mit `?loesungen=1` beides ein,
`?loesungen=0` wieder aus:

```
01-html.html?loesungen=1
```

Die Wahl liegt in `localStorage` (`skript.html.loesungen`, Werte `1` und `0`)
und gilt darum für alle Seiten dieses Browsers, auch ohne Parameter in der URL.
Ist sie eingeschaltet, trägt `<html>` das Attribut `data-loesungen="1"`.

Das ist eine Bequemlichkeit und **kein Schloss.** Die Lösungsboxen stehen
weiterhin im Quelltext der Seiten, und `assets/examples.js` enthält sowieso
jede Datei des Submoduls als `window.EXAMPLES` — mit der Konsole oder Ctrl+U
kommt man an alles heran. Wer die Lösungen wirklich zurückhalten will, muss
eine eigene, bereinigte Fassung der Seiten ausliefern.

### Werkbank

```html
<div class="workbench" data-id="wb15" data-files="html,css"
     data-seed-html="firstcss/inline.html"
     data-sol-html="external-css/external-css.html"
     data-sol-css="external-css/style.css"
     data-height="380"></div>
```

- `data-id` — eindeutig pro Seite, Schlüssel für den gespeicherten Code.
- `data-files` — `html` oder `html,css` (zwei Reiter, `index.html` und
  `style.css`).
- `data-seed-*` — Startcode aus dem Submodul. Alternativ direkt im Element:
  `<template data-seed="html">…</template>` (Inhalt mit `&lt;` schreiben) —
  für Startcode, der nur im Skript steht und in keiner Datei.
- `data-sol-*` — schaltet den Knopf «Lösung laden» ein, sofern die Lösungen
  eingeschaltet sind (siehe [Lösungen](#lösungen)).

Die Vorschau läuft in einem `sandbox`-`<iframe>` mit `srcdoc`, ohne
`allow-same-origin`. Sie kann also nicht auf diese Seite oder den gespeicherten
Code zugreifen.

Der Editor färbt den Code ein — mit demselben Tokenizer wie die Listings
(`window.SITE.highlight`). Dazu liegen zwei Ebenen genau übereinander: unten der
eingefärbte Code (`.wb__hl`), darüber das `<textarea>` mit durchsichtiger
Schrift und sichtbarem Cursor. Beide Ebenen brauchen darum dieselbe Schrift,
Schriftgrösse, Zeilenhöhe und dasselbe `padding` — wer eines davon in
`style.css` ändert, muss es an beiden Stellen ändern, sonst laufen Text und
Farben auseinander.

Im `html`-Reiter expandiert Tab Emmet-artige Kürzel (`nav>ul>li*3>a`,
`div.card>h2+p`, `.box$*3` mit `$` als Zähler). Kein fertiges Emmet
eingebunden, sondern ein kleiner eigener Parser in `editor.js`
(`emmetExpand` und Umfeld) für den gängigen Teilumfang — Grund ist wieder
`file://`: kein Build-Schritt, keine CDN-Abhängigkeit. Erkennt das Kürzel vor
dem Cursor nichts Sinnvolles (z. B. ein normales Wort ohne `.`/`#`/`>`/…, das
nicht in der Tag-Liste `EMMET_KNOWN_TAGS` steht), fügt Tab wie gewohnt zwei
Leerzeichen ein.

## Was der Browser nicht kann

- `:visited` (Übung 3.21) wird aus Datenschutzgründen eingeschränkt und zählt in
  der Vorschau nie als besucht. Steht als Hinweis in der Übung.
- Der Fortschritt liegt in `localStorage`, also pro Browser und Gerät. Wer den
  Rechner wechselt, fängt mit leeren Werkbänken an; darum der Knopf
  «Herunterladen».

## Bekannte Abweichungen vom Skript

- Der Kapitelanfang hat kein Zitat: `chap_html.tex` verweist mit
  `\myquote{kapor}` auf einen Bib-Key, der in `sources/` nicht existiert.
- Die Bib-Keys `web:w3cvalidator` und `www:w3schooltables` fehlen ebenfalls; die
  Webseite verlinkt direkt auf <https://validator.w3.org/> und die
  Tabellen-Seite von w3schools.
- Statt Seitenverweisen («Seite 42») verlinkt die Webseite direkt auf das Ziel.
