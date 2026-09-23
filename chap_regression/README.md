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
| `02-python-matplotlib.html`         | «Vorbereitung: Python und Matplotlib» (`plt.plot`/`plt.scatter`; ohne die Unterabschnitte «Python Code ausführen» und «Funktionen», siehe unten) | 1.05 |
| `03-regression-mit-python.html`     | «Regression mit Python» (lineare/nicht-lineare Regression, `curve_fit`) | 1.06–1.12 |
| `04-korrelationskoeffizient.html`   | «Der empirische Korrelationskoeffizient»                          | – |
| `05-herleitung.html`                | «Allgemeine Herleitung»                                            | 1.13–1.19 |

Die Übungen sind durchgehend numeriert wie im Skript (`\thechapter.NN`). Jede
Seite trägt dazu `data-ex-chapter` und `data-ex-offset` auf `<main>`; die
Nummern entstehen daraus automatisch (siehe `chap_svg/README.md` für die
Mechanik). **`data-ex-chapter="1"`**: `chap_modellieren.tex` ist das erste
`\input` sowohl in `am-profila-skript.tex` als auch in
`am-profilb-skript.tex`, also Kapitel 1 in beiden Kursbüchern — anders als bei
`chap_hypothesen/` braucht es darum keine zusätzliche Annahme. Verschiebt
sich das Kapitel in einem der beiden Master-Dokumente, muss die Zahl auf
allen fünf Inhaltsseiten angepasst werden.

`02-python-matplotlib.html` ist neu (Stand: Commit "moved matplotlib stuff to
chap_modellieren") — der Abschnitt «Vorbereitung: Python und Matplotlib» kam
ursprünglich aus `chap_bio.tex` (dessen Vorbereitungsseite in `chap_bio/`
seither wieder auf Listen/Iterationen gekürzt wurde, ohne die
Matplotlib-Teile) und steht jetzt im gedruckten Kapitel, direkt vor
«Regression mit Python». Die alten
`02-…`/`03-…`/`04-…` Dateien heissen darum jetzt `03-…`/`04-…`/`05-…`
(`data-ex-offset` von `03-regression-mit-python.html` steigt von 4 auf 5).
Auf den beiden letzten Seiten bleibt `data-ex-offset` trotzdem bei 12: Die
neue Übung 1.05 verschiebt alles um eins nach oben, aber im selben Commit ist
`ex:zweivar` (Übung 1.07 alter Zählung) auskommentiert worden und damit
weggefallen — die beiden Verschiebungen heben sich für alles ab Abschnitt 4
gerade auf. Details dazu bei den Abweichungen unten.

## Bauen

Fast alle Lösungsvorschläge kommen aus dem Submodul
`code/gyminf/python/regression/`. Die eine Ausnahme ist Übung 1.05
(«Vorbereitung: Python und Matplotlib»): deren Lösung ist
`code/gyminf/python/dynamic-systems/matplotlib-example.py` — der Abschnitt
kam ursprünglich aus `chap_bio.tex` (siehe oben), die Lösungsdatei blieb
dabei im `dynamic-systems/`-Ordner des Submoduls, statt nach `regression/`
zu wandern. `build.py` bündelt beides in `assets/examples.js` und kopiert
das Gauss-Portrait sowie die Zielgrafik der Matplotlib-Übung:

```sh
python3 webskript/chap_regression/build.py     # aus dem Wurzelverzeichnis des Hauptrepos
```

Nach jeder Änderung in `code/gyminf/python/regression/` oder an
`code/gyminf/python/dynamic-systems/matplotlib-example.py` neu ausführen.
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
  `.tex` inzwischen auskommentiert ist (`% \section{Der Regressionseffekt}`
  bis `% \end{ex}`, vor «Der empirische Korrelationskoeffizient») —
  `04-korrelationskoeffizient.html` deckt darum nur noch den
  Korrelationskoeffizienten ab und hat keine eigenen Übungen mehr. Ebenso
  auskommentiert (im selben Commit wie der Umzug des Matplotlib-Abschnitts)
  ist die Zwei-Variablen-Statistik-Übung `ex:zweivar` in «Regression mit
  Python» — sie stand früher als Übung 1.07 auf dieser Webseite und wurde
  jetzt entfernt, alle folgenden Übungsnummern rücken entsprechend nach.
- **Taschenrechner- und GeoGebra-Anleitungen sind auf einen kurzen Hinweis
  gekürzt.** Das gedruckte Kapitel erklärt die Regressionsgerade in einem
  grossen Beispiel (Körpergrösse/Körpermasse) Schritt für Schritt mit
  Bildschirmfotos sowohl für den TI-30 Pro als auch für den TI-Nspire, dazu
  eine eigene Anleitung für GeoGebra. Diese Webseite konzentriert sich
  konsequent auf Python (das ist schliesslich der Sinn einer Seite mit
  Python-Werkbänken) und verweist stattdessen kurz auf GeoGebra.
- **Übungen, die im Skript mit dem Taschenrechner gelöst werden, haben hier
  eine Python-Werkbank.** Betrifft insbesondere die Bremsweg-Alter- und die
  Schaumkronen-Übung in Abschnitt 1 sowie die Occasionspreis-, Bremsweg-,
  Koffein-, Kepler- und Wortschatz-Übungen in Abschnitt 3: Im Skript wird
  dort `LinReg`/`QuadReg`/`ExpReg`/`LnReg`/`PwrReg` des Taschenrechners
  verwendet, auf der Webseite die entsprechende `numpy`-Berechnung. Die
  Zahlenwerte sind identisch.
- **Die Wetter-Übung ist zusammengeführt.** Im Skript gibt es dazu zwei
  aufeinanderfolgende `ex`-Umgebungen: eine allgemeine Programmieraufgabe
  (die bereits auf die Tabelle der zweiten Übung vorausverweist) und die
  eigentliche Übung mit Tabelle und Zusatzfrage zur Anbaufähigkeit. Diese
  Webseite fasst beide zu einer Übung (1.06) zusammen, um die Dopplung zu
  vermeiden — ähnlich wie bei den vielen einzelnen Spinnwebdiagrammen in
  `chap_bio/`.
- **Ein Diagramm statt einer Aufgabenserie.** Die fünf Punktwolken, die im
  Skript die Eigenschaften des Korrelationskoeffizienten illustrieren
  (`tasks`-Umgebung mit fünf TikZ-Abbildungen), stehen auf der Webseite als
  eine Werkbank mit fünf Teildiagrammen (`04-korrelationskoeffizient.html`).
  Die zugrundeliegenden Datenpunkte sind identisch mit dem Skript.
- **«Vorbereitung: Python und Matplotlib» lässt den Unterabschnitt «Python
  Code ausführen» ganz weg.** Das gedruckte Kapitel nennt dort drei Wege,
  Python auszuführen — u. a. «Sie finden unter … eine Online Version dieses
  Skripts» (verweist auf genau diese Webseite selbst: auf der Seite, auf der
  man diesen Satz liest, ergibt der Verweis keinen Sinn mehr), dazu die
  lokale Installation und der Online-Runner `matplotlib.codeutility.io`. Da
  auf dieser Webseite ohnehin jedes Codebeispiel direkt in einer Werkbank
  läuft (siehe Box «Anders als im gedruckten Skript» oben), erübrigt sich
  eine Erklärung, *wie* man Python-Code ausführt, komplett — der ganze
  Unterabschnitt entfällt darum, nicht nur der selbstreferenzielle Punkt.
  Gleiches Vorgehen beim entsprechenden Absatz in «Regression mit Python»
  weiter unten.
- **Der Unterabschnitt «Funktionen» steht hier nicht.** `chap_modellieren.tex`
  hat unter «Vorbereitung: Python und Matplotlib» gar keinen
  Funktionen-Unterabschnitt (nur «Python Code ausführen» und «Daten
  visualisieren mit Matplotlib») — diese Webseite hatte ihn früher trotzdem,
  vermutlich ein Überbleibsel aus der Zeit vor der Aufteilung des Kapitels
  (siehe oben, Commit "moved matplotlib stuff to chap_modellieren"). Der
  eigentliche Funktionen-Unterabschnitt gehört zu `chap_bio.tex`
  («Vorbereitung: Listen und Iterationen in Python») und steht darum nur dort,
  in [`chap_bio/01-listen-iterationen.html`](../chap_bio/01-listen-iterationen.html#funktionen).
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
    ├── index.html, 01-…, 02-…, 03-…, 04-…, 05-…   Inhalt (der Prosatext steht hier)
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
