# Webversion von `chap_hypothesen.tex` (nur der Python-Teil)

Diese Seite deckt **nicht das ganze Kapitel** ab, sondern nur den Abschnitt
«Hypothesentests mit Python» samt den Übungen 3.14–3.20. Die übrigen
Abschnitte (Zufallsgrössen, berühmte Verteilungen, Tests von Hand mit
Wahrscheinlichkeitstabelle oder Taschenrechner) enthalten keinen Code und
bringen als interaktive Webseite keinen Mehrwert gegenüber dem gedruckten
Skript — dort bleibt der PDF-Export massgebend.

`chap_hypothesen.tex` wird nur von `am-profilb-skript.tex` `\input`-iert und
steht dort an dritter Stelle, ist also Kapitel 3. Die Übungsnummern auf dieser
Seite (`3.14`–`3.20`) sind daher wie bei `chap_svg/` eine **Annahme**: Sie
gilt, solange sich diese Position nicht ändert. `data-ex-chapter="3"
data-ex-offset="13"` auf `<main>` in `01-python.html` müsste sonst angepasst
werden.

## Python läuft wirklich im Browser (Pyodide)

Anders als `chap_html/` und `chap_svg/` braucht diese Seite eine
**Internetverbindung** und funktioniert **nicht** über `file://`:

- Python-Code lässt sich nicht wie HTML/CSS/SVG nativ vom Browser darstellen.
  Die Werkbank führt ihn deshalb wirklich aus, mit
  [Pyodide](https://pyodide.org/) (CPython nach WebAssembly kompiliert,
  inklusive `numpy`, `scipy` und `matplotlib`) in einem Web Worker.
- Pyodide selbst kommt von einem CDN (`cdn.jsdelivr.net/pyodide/...`), siehe
  `assets/js/pyworker.js`. Das widerspricht bewusst der sonstigen Konvention
  dieses Submoduls («kein Build-Schritt, keine CDN-Abhängigkeit», siehe
  `chap_html/README.md`) — es gibt für echte Python-Ausführung im Browser
  keine vergleichbar leichtgewichtige Alternative. `numpy`+`scipy`+
  `matplotlib` allein sind schon einige zehn MB gross.
- Der erste Klick auf **Ausführen** auf einer Seite lädt Pyodide und die
  Pakete nach; das kann je nach Verbindung bis zu einer Minute dauern. Alle
  Werkbänke einer Seite teilen sich danach einen Worker (siehe
  `assets/js/pyrunner.js`), der Läufe der Reihe nach abarbeitet.
- Ohne Internetverbindung zeigt die Konsole eine Fehlermeldung statt einer
  Ausgabe. Die Übungstexte und der Code in den Werkbänken (lesen, editieren,
  Fortschritt) funktionieren weiterhin offline wie gewohnt — nur das
  tatsächliche **Ausführen** braucht eine Verbindung.
- Kein Server, keine Ausführung fremden Codes: Pyodide läuft komplett im
  Browser der Schülerin/des Schülers (WebAssembly), der eingegebene Code wird
  nirgends hochgeladen. Geladen wird nur die Python-Umgebung selbst.

Die Pyodide-Version steht als Konstante `PYODIDE_VERSION` am Kopf von
`assets/js/pyworker.js` und lässt sich dort anheben.

## Bauen

Alle Lösungsvorschläge kommen aus dem Submodul
`code/gyminf/python/hypothesen/`. `build.py` bündelt sie in
`assets/examples.js` und kopiert das Kapitelportrait:

```sh
python3 webskript/chap_hypothesen/build.py     # aus dem Wurzelverzeichnis des Hauptrepos
```

Nach jeder Änderung in `code/gyminf/python/hypothesen/` neu ausführen.
`assets/examples.js` und `assets/img/` sind erzeugt — nicht von Hand ändern.

## Anschauen

```sh
python3 -m http.server 8000     # aus dem Wurzelverzeichnis des Submoduls webskript
```

Dann <http://localhost:8000/chap_hypothesen/>. Die Übungstexte funktionieren
auch über `file://`; das **Ausführen** von Python-Code nicht (siehe oben) —
zum Testen der Werkbänke also über einen Server öffnen und eine
Internetverbindung haben.

## Aufbau

Wiederverwendet `../assets/css/style.css` und `../assets/js/{site,editor}.js`
aus `chap_html/`/`chap_svg/` (siehe dort für die allgemeinen Konventionen:
Übungsnummerierung, Fortschritt, Lösungsschalter `?loesungen=1`,
Farbschema). Neu für dieses Kapitel:

```
webskript/assets/js/
├── pyworker.js     Web Worker: laedt Pyodide + numpy/scipy/matplotlib, fuehrt Code aus
└── pyrunner.js     ein gemeinsamer Worker/eine Warteschlange pro Seite
```

`chap_hypothesen/01-python.html` bindet zusätzlich `pyrunner.js` ein (nach
`editor.js`, vor `site.js`); Seiten ohne Python-Werkbank brauchen das nicht.

### Werkbank mit `data-files="python"`

```html
<div
  class="workbench"
  data-id="wb14"
  data-files="python"
  data-sol-python="hypothesen/lootbox.py"
  data-height="220"
>
  <template data-seed="python">
import numpy as np
from scipy import stats
...
# TODO: ...
  </template>
</div>
```

- Nur ein Reiter (`aufgabe.py`), keine Emmet-Kürzel, kein automatischer Lauf
  beim Tippen (das wäre mit Pyodide zu teuer) — nur **Ausführen** oder
  Ctrl/⌘ + Enter lösen eine Ausführung aus.
- Rechts steht statt einer `<iframe>`-Vorschau eine Konsole
  (`.wb__console`), die `stdout`/`stderr` des Python-Laufs zeigt. Jeder Lauf
  bekommt frische globale Variablen (kein Zustand zwischen zwei Klicks auf
  Ausführen).
- `data-seed-python="…"` (Datei aus dem Submodul) oder ein inneres
  `<template data-seed="python">` (Startcode nur im Skript, wie bei
  html/svg) legen den Startcode fest; ohne beides ein leerer Kommentar.
- `data-sol-python="hypothesen/<name>.py"` schaltet den Knopf
  «Lösung laden» ein, sofern `?loesungen=1` aktiv ist — wie bei den anderen
  Kapiteln.

### Syntaxfarben

`site.js` bekam einen eigenen, ebenso einfachen Tokenizer wie für HTML/CSS
(`tokenizePython`): Kommentare, Strings (inkl. Präfixe `f`/`r`/`b` und
Dreifachquotes), Zahlen, Schlüsselwörter (`t-kw`) und Funktionsnamen (ein
Bezeichner direkt vor `(`, Klasse `t-fn`). Kein Anspruch auf einen
vollständigen Parser, reicht aber für die Übungen hier.

### Auch die Theorie-Beispiele sind Werkbänke

Alle acht Code-Beispiele im Theorieteil (`scipy.stats`-Übersicht, die fünf
Tests, Bootstrap, Simulation) stehen ebenfalls als Werkbank (`wbex1`–`wbex8`)
und sind editier- und ausführbar, genau wie die sieben Übungen. Anders als
bei den Übungen gibt es dort keinen `data-sol-python` (der Beispielcode ist
bereits die "Lösung") und keinen `data-src` (der Code steht nur inline im
Skript, nicht in `code/gyminf/`, darum als `<template data-seed="python">`
im Element selbst statt als Dateiverweis).

Einige dieser Beispiele erzeugen mit `matplotlib.pyplot` einen Plot
(Histogramm, Boxplot, Balkendiagramm). Damit das im Worker (ohne echtes
Fenster) funktioniert, erzwingt `pyworker.js` nach dem Laden das
Agg-Backend (`matplotlib.use("Agg")`) und sammelt nach jedem Lauf alle
offenen Figuren als PNG ein (`FIGURE_CAPTURE`-Skript, Base64-kodiert), die
`editor.js` als `<img>` unter der Konsolenausgabe anzeigt (`.wb__images`).
Deswegen lädt `pyodide.loadPackage` hier zusätzlich `matplotlib` (weitere
paar MB). Die sieben Übungen selbst brauchen kein `matplotlib`.

### Lösungsvorschläge sind ebenfalls Werkbänke — und genauso versteckt

Jede Übung hat unter `<details class="sol">` einen eigenen
Lösungsvorschlag: Erklärtext, eine **eigene, zweite Werkbank** mit
`data-seed-python="hypothesen/<name>.py"` (lädt direkt den fertigen
Lösungscode aus dem Submodul, editier- und ausführbar) und der
Antwortsatz. Das ist eine zweite, unabhängige Werkbank neben der
Übungs-Werkbank oben (eigene `data-id`, eigener localStorage-Schlüssel) —
wer daran herumspielt, verliert nicht den eigenen Versuch in der
Übungs-Werkbank.

Wie bei `chap_html/`/`chap_svg/` gilt: **`details.sol` wird standardmässig
komplett aus dem DOM entfernt** (`setupSolutions()` in `site.js`, läuft vor
`Workbench.initAll()`) — die Lösungs-Werkbank wird für Schülerinnen und
Schüler also gar nicht erst gebaut, nicht nur versteckt. Erst
`?loesungen=1` in der Adresse (oder vorher schon gesetzt, siehe
`chap_html/README.md#lösungen`) schaltet sie ein. Das ist weiterhin eine
Bequemlichkeit und kein Schloss: Der Quelltext der Seite und
`assets/examples.js` enthalten die Lösungsdateien so oder so.

## Bekannte Abweichungen vom Skript

- Nur der Python-Abschnitt ist als Webseite umgesetzt (siehe oben).
- Die Übungen verlangen im Skript auch eine schriftliche Nullhypothese,
  Alternativhypothese und einen Antwortsatz. Die Werkbank nimmt nur Code
  entgegen; H₀/H₁ und der Antwortsatz gehören wie gewohnt auf Papier oder in
  einen Kommentar im Code.
