# Webversion von `chap_bio.tex`

Das Kapitel «Diskrete dynamische Systeme» als Webseite: Iterationen,
Wachstumsmodelle und Räuber-Beute-Systeme, mit Python-Werkbänken für alle
Übungen — Code läuft wirklich im Browser (Pyodide), inklusive der
`matplotlib`-Diagramme. Technisch identisch zu `chap_hypothesen/` (siehe
dort, Abschnitt Pyodide, für Details zur Code-Ausführung); die Unterschiede
zu diesem Kapitel stehen weiter unten.

## Seiten

| Datei                             | Entspricht im Skript                                    | Übungen |
| ---------------------------------- | --------------------------------------------------------- | ------- |
| `index.html`                       | Kapiteleinstieg, Zitat, Linksammlung                       | –       |
| `01-python-matplotlib.html`        | «Vorbereitung: Python und Matplotlib»                      | 2.01    |
| `02-iterationen.html`              | «Iterationen» (inkl. Schaefer'sches Modell, Definition)    | 2.02–2.09 |
| `03-wachstumsmodelle.html`         | «Das Schaefer'sche Modell», Übungsteil                     | 2.10–2.13 |
| `04-mehrere-zustandsgroessen.html` | «Modelle mit mehreren Zustandsgrössen» (Räuber-Beute, SI, SIR) | 2.14–2.22 |

Die Übungen sind durchgehend numeriert wie im Skript (`\thechapter.NN`).
Jede Seite trägt dazu `data-ex-chapter` und `data-ex-offset` auf `<main>`;
die Nummern entstehen daraus automatisch (siehe `chap_svg/README.md` für die
Mechanik). **`data-ex-chapter="2"`**: `chap_bio.tex` steht sowohl in
`am-profila-skript.tex` als auch in `am-profilb-skript.tex` an zweiter
Stelle (nach `chap_modellieren.tex`) — anders als bei `chap_hypothesen/`
ist die Kapitelnummer hier also in beiden Kursbüchern gleich und braucht
keine zusätzliche Annahme. Verschiebt sich das Kapitel in einem der beiden
Master-Dokumente, muss die Zahl auf allen vier Inhaltsseiten angepasst
werden.

## Bauen

Alle Lösungsvorschläge kommen aus dem Submodul
`code/gyminf/python/dynamic-systems/`. `build.py` bündelt sie in
`assets/examples.js` und kopiert die benötigten Bilder nach `assets/img/`:

```sh
python3 webskript/chap_bio/build.py     # aus dem Wurzelverzeichnis des Hauptrepos
```

Nach jeder Änderung in `code/gyminf/python/dynamic-systems/` neu ausführen.
`assets/examples.js` und `assets/img/` sind erzeugt — nicht von Hand ändern.

## Anschauen

```sh
python3 -m http.server 8000     # aus dem Wurzelverzeichnis des Submoduls webskript
```

Dann <http://localhost:8000/chap_bio/>. Die Übungstexte funktionieren auch
über `file://`; das **Ausführen** von Python-Code nicht (siehe
`chap_hypothesen/README.md`, Abschnitt Pyodide) — zum Testen der Werkbänke
also über einen Server öffnen und eine Internetverbindung haben.

## Urheberrecht: Bilder dieses Kapitels

Das Skript zeigt beim Räuber-Beute-Modell die Porträts von **Lotka und
Volterra** nebeneinander. Für die öffentliche Webseite wurde das geprüft:

| Bild                    | Lizenz laut `sources/people-pics.bib` / `sources/sources.bib` | Web?             |
| ------------------------ | --------------------------------------------------------------- | ---------------- |
| `lotka.jpg`              | **Fair use** (`pic:lotka`)                                       | **Nein** — nicht auf der Webseite |
| `volterra.jpg`           | Public Domain (`pic:volterra`)                                   | Ja |
| `feigenbaum.jpg`         | CC BY-SA 2.0 (`pic:feigenbaum`)                                   | Ja, mit Lizenzlink |
| `hudson.jpg`             | CC BY-SA 4.0 (`pic:hudson`)                                       | Ja, mit Lizenzlink |
| `wolfram.jpg`            | CC BY-SA 3.0 (`pic:wolfram`)                                      | Ja, mit Lizenzlink |
| `feigenbaum-diagram.png` | selbst erzeugt (Ausgabe von `feigenbaum.py`)                      | Ja, kein Urheberrecht Dritter |
| `matplotlib-example.svg` | selbst erzeugt (Ausgabe von `matplotlib-example.py`)              | Ja, kein Urheberrecht Dritter |

«Fair use» erlaubt die Nutzung nur in einem begrenzten, meist redaktionellen
Rahmen (wie es z.&nbsp;B. Wikipedia für sich beansprucht) — nicht die freie
Weiterverbreitung auf einer beliebigen öffentlichen Webseite. `lotka.jpg`
wird deshalb von `build.py` nicht nach `assets/img/` kopiert und taucht in
keiner der vier Seiten auf; `02-iterationen.html` (Abschnitt «Das
Räuber-Beute-Modell») zeigt darum nur noch Volterras Porträt. Das
entspricht dem bereits bestehenden Vorgehen bei `bezier.jpg` in
`chap_svg/build.py` — siehe dort für das gleiche Muster.

## Bekannte Abweichungen vom Skript

- **Lotka-Porträt fehlt** (siehe oben, Urheberrecht).
- **Feigenbaumdiagramm bleibt statisch.** `feigenbaum.py` rechnet
  10'000 × 2000 Iterationen in reinem Python — nativ schon mehrere
  Sekunden, im Browser über Pyodide unpraktikabel langsam. Übung 2.07
  zeigt darum den Code nur als Listing (`<pre data-src="…">`, nicht
  ausführbar) zusammen mit dem vorgerechneten Bild
  `feigenbaum-diagram.png`, statt als laufende Werkbank.
- **Viele statische Spinnwebdiagramme im Skript → eine interaktive
  Werkbank.** Das gedruckte Kapitel zeigt das Spinnwebdiagramm-Konzept
  anhand von rund einem Dutzend einzelner TikZ-Abbildungen (verschiedene
  Startwerte, verschiedene Trägerfunktionen). Die Webseite zeigt
  stattdessen eine Werkbank, die das Diagramm für eine editierbare
  Trägerfunktion live zeichnet (`02-iterationen.html`, Abschnitt
  «Spinnwebdiagramm«) — das deckt dieselbe Idee ab und ist zugleich die
  Grundlage für Übung 2.03 (eigene, allgemeine `spinnweb(f, x0, n)`-Funktion
  schreiben). Aus demselben Grund verzichtet die Webseite auf die vielen
  einzelnen Wachstums-/Zerfalls-Abbildungen aus dem Beispielteil
  «Weitere Beispiele» und beschreibt diese stattdessen mit einer
  Werkbank pro Modelltyp (exponentiell, logistisch) zum selbst
  Experimentieren.
- **Vollständig lauffähiger Code statt Zeilenausschnitten.** Das Skript
  zeigt bei `lotka-volterra.py` drei verschiedene `\inputminted`-Ausschnitte
  (Zeilen 1–25, 25–26, 29–37) für die Übungen 2.14, 2.17 und 2.18. Eine
  Werkbank muss aber tatsächlich lauffähigen Code enthalten (das ist der
  ganze Sinn dieser Webseite), darum enthält jede Lösungs-Werkbank die
  vollständigen, für die jeweilige Übung nötigen Funktionsdefinitionen
  plus genau die Aufrufe, die der entsprechende Skript-Ausschnitt
  demonstriert — nicht den exakten, teils mitten in einer Funktion
  endenden Zeilenausschnitt selbst.
- **R₀ vs. R₀.** Das SIR-Modell verwendet `R` bereits für die Gruppe der
  Removed (mit Anfangswert R(0)=0 in Übung 2.22); dieselbe Bezeichnung
  R₀ wird in der Epidemiologie zugleich für die Basisreproduktionszahl
  verwendet (neu in `chap_bio.tex` ergänzt, siehe Definitionsbox in
  `04-mehrere-zustandsgroessen.html`). Diese Doppelbedeutung ist in der
  Fachliteratur so üblich und bleibt aus dem Kontext heraus verständlich;
  die Webseite schreibt den Anfangswert der Removed-Gruppe darum explizit
  als «R(0)=0», um beim ersten Lesen keine Verwechslung aufkommen zu
  lassen.
- Übung 2.12 (Rehe/Schaefer'sches Modell) und Übung 2.15
  (Parameter-Experimente beim Räuber-Beute-Modell) haben im Skript keine
  `\sol`/keinen expliziten Programmierauftrag, verlangen aber inhaltlich
  eine Simulation. Die Webseite gibt ihnen darum zusätzlich eine
  (unbeantwortete) Werkbank zum Explorieren — ohne „Lösung laden“-Knopf,
  da im Skript keine Musterlösung existiert.
- Wie bei den anderen Kapiteln: Seitenverweise («Seite 15») werden zu
  direkten Links, und Quellenangaben stehen als Link statt als Fussnote.

## Aufbau

```
webskript/
├── index.html                     Startseite mit Links zu allen Kapiteln
├── assets/                        gemeinsam mit chap_html/, chap_svg/, chap_hypothesen/
└── chap_bio/
    ├── index.html, 01-…, 02-…, 03-…, 04-…   Inhalt (der Prosatext steht hier)
    ├── build.py                              Bündelt das Submodul
    └── assets/
        ├── examples.js                       erzeugt
        └── img/                              erzeugt
```

`style.css`, `site.js`, `editor.js`, `pyworker.js` und `pyrunner.js` liegen
gemeinsam mit den anderen Kapiteln unter `../assets/` im Repo-Wurzel­ver­zeichnis
des Submoduls — siehe [`chap_hypothesen/README.md`](../chap_hypothesen/README.md)
für die Python-Werkbank-Konventionen (`data-files="python"`,
`data-sol-python`, Konsole statt Vorschau, Farbschema, Lösungsschalter
`?loesungen=1` usw.), die dieses Kapitel unverändert übernimmt.
