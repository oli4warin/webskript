# Webversion von `chap_modellieren.tex`

Das Kapitel «Regression» als Webseite: die Regressionsgerade, nicht-lineare
Regression durch Linearisierung und mit `scipy.optimize.curve_fit`, sowie der
empirische Korrelationskoeffizient — mit Python-Werkbänken für alle Übungen,
Code läuft wirklich im Browser (Pyodide), inklusive der `numpy`/`scipy`-
Berechnungen und `matplotlib`-Diagramme. Technisch identisch zu `chap_bio/`
(siehe dort bzw. `chap_hypothesen/README.md`, Abschnitt Pyodide, für Details
zur Code-Ausführung); die Unterschiede zu diesem Kapitel stehen weiter unten.

Der `.tex`-Quelltext trägt `\chapter{Regression}`, die Datei selbst heisst
aber historisch `chap_modellieren.tex` — der eigentliche
Modellierungs-Einstieg (Kreislauf reales/mathematisches Problem, Datensammel-
Übungen zu Stau, Bierschaum-Schaumkrone-artigen Schätzfragen usw.) steht dort
in einem `\iffalse …\fi`-Block und wird **nicht** kompiliert. Diese Webseite
deckt darum nur den tatsächlich gedruckten Teil ab, beginnend bei
«Die Regressionsgerade».

## Seiten

| Datei                              | Entspricht im Skript                                          | Übungen |
| ----------------------------------- | ----------------------------------------------------------------- | ------- |
| `index.html`                        | Kapiteleinstieg, Zitat, Linksammlung                              | –       |
| `01-regressionsgerade.html`         | «Die Regressionsgerade» (Methode der kleinsten Fehlerquadrate, Schwerpunktsatz) | 1.01–1.04 |
| `02-regression-mit-python.html`     | «Regression mit Python» (lineare/nicht-lineare Regression, `curve_fit`) | 1.05–1.12 |
| `03-korrelationskoeffizient.html`   | «Der empirische Korrelationskoeffizient»                          | – |
| `04-herleitung.html`                | «Allgemeine Herleitung»                                            | 1.13–1.19 |

Die Übungen sind durchgehend numeriert wie im Skript (`\thechapter.NN`). Jede
Seite trägt dazu `data-ex-chapter` und `data-ex-offset` auf `<main>`; die
Nummern entstehen daraus automatisch (siehe `chap_svg/README.md` für die
Mechanik). **`data-ex-chapter="1"`**: `chap_modellieren.tex` ist das erste
`\input` sowohl in `am-profila-skript.tex` als auch in
`am-profilb-skript.tex`, also Kapitel 1 in beiden Kursbüchern — anders als bei
`chap_hypothesen/` braucht es darum keine zusätzliche Annahme. Verschiebt
sich das Kapitel in einem der beiden Master-Dokumente, muss die Zahl auf
allen vier Inhaltsseiten angepasst werden.

## Bauen

Alle Lösungsvorschläge kommen aus dem Submodul
`code/gyminf/python/regression/`. `build.py` bündelt sie in
`assets/examples.js` und kopiert das Gauss-Portrait:

```sh
python3 webskript/chap_regression/build.py     # aus dem Wurzelverzeichnis des Hauptrepos
```

Nach jeder Änderung in `code/gyminf/python/regression/` neu ausführen.
`assets/examples.js` und `assets/img/` sind erzeugt — nicht von Hand ändern.

## Anschauen

```sh
python3 -m http.server 8000     # aus dem Wurzelverzeichnis des Submoduls webskript
```

Dann <http://localhost:8000/chap_regression/>. Die Übungstexte funktionieren
auch über `file://`; das **Ausführen** von Python-Code nicht (siehe
`chap_hypothesen/README.md`, Abschnitt Pyodide) — zum Testen der Werkbänke
also über einen Server öffnen und eine Internetverbindung haben.

## Bekannte Abweichungen vom Skript

- **Nur der gedruckte Teil ist umgesetzt.** Der `\iffalse`-Block am Anfang
  von `chap_modellieren.tex` (allgemeine Modellierungs-Einführung,
  Datensammel-Übungen zu Stau/Hautfläche/Büchern/da-Vinci-Proportionen usw.)
  wird nicht kompiliert und steht darum auch hier nicht. Dasselbe gilt für
  den Abschnitt «Der Regressionseffekt» samt der Skisprung-Übung, der im
  `.tex` inzwischen auskommentiert ist (`% \subsection{Der
  Regressionseffekt}` bis `% \end{ex}`, vor «Der empirische
  Korrelationskoeffizient») — `03-korrelationskoeffizient.html` deckt darum
  nur noch den Korrelationskoeffizienten ab und hat keine eigenen Übungen
  mehr.
- **Taschenrechner- und GeoGebra-Anleitungen sind auf einen kurzen Hinweis
  gekürzt.** Das gedruckte Kapitel erklärt die Regressionsgerade in einem
  grossen Beispiel (Körpergrösse/Körpermasse) Schritt für Schritt mit
  Bildschirmfotos sowohl für den TI-30 Pro als auch für den TI-Nspire, dazu
  eine eigene Anleitung für GeoGebra. Diese Webseite konzentriert sich
  konsequent auf Python (das ist schliesslich der Sinn einer Seite mit
  Python-Werkbänken) und verweist stattdessen kurz auf GeoGebra und das im
  Skript verlinkte Taschenrechner-Video.
- **Übungen, die im Skript mit dem Taschenrechner gelöst werden, haben hier
  eine Python-Werkbank.** Betrifft insbesondere die Bremsweg-Alter- und die
  Schaumkronen-Übung in Abschnitt 1 sowie die Zwei-Variablen-Statistik-Übung
  (`ex:zweivar`) in Abschnitt 2: Im Skript wird dort `LinReg`/`ExpReg`/
  `2-Var Stats` des Taschenrechners verwendet, auf der Webseite die
  entsprechende `numpy`-Berechnung. Die Zahlenwerte sind identisch.
- **Die Wetter-Übung ist zusammengeführt.** Im Skript gibt es dazu zwei
  aufeinanderfolgende `ex`-Umgebungen: eine allgemeine Programmieraufgabe
  (die bereits auf die Tabelle der zweiten Übung vorausverweist) und die
  eigentliche Übung mit Tabelle und Zusatzfrage zur Anbaufähigkeit. Diese
  Webseite fasst beide zu einer Übung (1.05) zusammen, um die Dopplung zu
  vermeiden — ähnlich wie bei den vielen einzelnen Spinnwebdiagrammen in
  `chap_bio/`.
- **Ein Diagramm statt einer Aufgabenserie.** Die fünf Punktwolken, die im
  Skript die Eigenschaften des Korrelationskoeffizienten illustrieren
  (`tasks`-Umgebung mit fünf TikZ-Abbildungen), stehen auf der Webseite als
  eine Werkbank mit fünf Teildiagrammen (`03-korrelationskoeffizient.html`).
  Die zugrundeliegenden Datenpunkte sind identisch mit dem Skript.
- **Eine Übung ohne Musterlösung im Skript hat trotzdem eine Werkbank.** Die
  Statistiker-Übung zu Quadrat- vs. Betragskriterium (1.16, im Skript ohne
  `\sol`) hat eine Werkbank zum Experimentieren, aber **keinen**
  «Lösung laden»-Knopf, da im Skript keine Musterlösung existiert — gleiches
  Vorgehen wie bei den entsprechenden Übungen in `chap_bio/`.
- **Der Beweis des Schwerpunktsatzes** (`\begin{proof}` bzw. die
  Bonus-Übung `bex:proofschwerpunkt`) ist eine reine
  Papier-und-Bleistift-Herleitung ohne sinnvolle Python-Übersetzung; die
  Webseite zeigt dafür eine Beweisskizze in Worten statt einer Werkbank.
- Wie bei den anderen Kapiteln: Seitenverweise («Seite 15») werden zu
  direkten Links, und Quellenangaben stehen als Link statt als Fussnote.

## Aufbau

```
webskript/
├── index.html                     Startseite mit Links zu allen Kapiteln
├── assets/                        gemeinsam mit chap_html/, chap_svg/, chap_bio/, chap_hypothesen/
└── chap_regression/
    ├── index.html, 01-…, 02-…, 03-…, 04-…   Inhalt (der Prosatext steht hier)
    ├── build.py                              Bündelt das Submodul
    └── assets/
        ├── examples.js                       erzeugt
        └── img/                               erzeugt
```

`style.css`, `site.js`, `editor.js`, `pyworker.js` und `pyrunner.js` liegen
gemeinsam mit den anderen Kapiteln unter `../assets/` im
Repo-Wurzelverzeichnis des Submoduls — siehe
[`chap_hypothesen/README.md`](../chap_hypothesen/README.md) für die
Python-Werkbank-Konventionen (`data-files="python"`, `data-sol-python`,
Konsole statt Vorschau, Farbschema, Lösungsschalter `?loesungen=1` usw.), die
dieses Kapitel unverändert übernimmt.
