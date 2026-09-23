#!/usr/bin/env python3
"""Buendelt die Python-Beispiele aus dem Submodul in assets/examples.js.

Alle Loesungsvorschlaege der Werkbaenke kommen aus
code/gyminf/python/dynamic-systems/. Damit die Seite auch direkt ueber
file:// funktioniert (fetch() ist dort gesperrt), werden die Dateien in ein
JavaScript-Objekt geschrieben, anstatt zur Laufzeit geladen. (Die
Python-Werkbaenke selbst brauchen fuer die Code-*Ausfuehrung* trotzdem eine
Internetverbindung -- siehe ../chap_hypothesen/README.md, Abschnitt Pyodide.)

Aufruf aus dem Wurzelverzeichnis des Hauptrepos (nicht des Submoduls
webskript):

    python3 webskript/chap_bio/build.py
"""

import json
import shutil
import sys
from pathlib import Path

WEB = Path(__file__).resolve().parent
REPO = WEB.parent.parent
SRC = REPO / "code" / "gyminf" / "python"
OUT = WEB / "assets" / "examples.js"
IMG = WEB / "assets" / "img"

# Bilder, die die Webseite nicht selber rendern kann (kein LaTeX-Bibsystem
# hier): das Feigenbaum-Portrait, das statische Feigenbaumdiagramm (siehe
# README, Abschnitt "Bekannte Abweichungen") und das Hudson's-Bay-Foto.
#
# images/lotka.jpg fehlt hier absichtlich: Laut sources/people-pics.bib
# (Eintrag pic:lotka) ist dieses Bild nur "Fair use" lizenziert -- das
# erlaubt keine Weiterverbreitung auf einer oeffentlichen Webseite. Fuer
# dieselbe Abbildung im Skript zeigt die Webseite darum nur noch Volterras
# Portrait (Public Domain). Nicht wieder eintragen.
#
# matplotlib-example.svg (Zielgrafik der frueheren Matplotlib-Uebung) wird
# hier nicht mehr gebraucht: Der Abschnitt "Vorbereitung: Python und
# Matplotlib" samt dieser Uebung wurde ins Kapitel Regression verschoben
# (siehe chap_regression/build.py). Nicht wieder eintragen.
FIGURES = {
    "wolfram.jpg": REPO / "images" / "wolfram.jpg",
    "volterra.jpg": REPO / "images" / "volterra.jpg",
    "feigenbaum.jpg": REPO / "images" / "feigenbaum.jpg",
    "feigenbaum-diagram.png": REPO / "images" / "feigenbaum-diagram.png",
    "hudson.jpg": REPO / "images" / "hudson.jpg",
}


def collect():
    if not SRC.is_dir():
        sys.exit(
            f"Fehler: {SRC} fehlt. Submodul initialisieren mit\n"
            "    git submodule update --init --recursive"
        )
    files = {}
    for path in sorted((SRC / "dynamic-systems").rglob("*")):
        if path.is_file() and path.suffix == ".py":
            key = path.relative_to(SRC).as_posix()
            files[key] = path.read_text(encoding="utf-8")
    return files


def copy_figures():
    IMG.mkdir(parents=True, exist_ok=True)
    missing = []
    for name, src in FIGURES.items():
        if src.is_file():
            shutil.copyfile(src, IMG / name)
        else:
            missing.append(str(src.relative_to(REPO)))
    return missing


def main():
    files = collect()
    missing_figures = copy_figures()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    body = json.dumps(files, ensure_ascii=False, indent=1, sort_keys=True)
    OUT.write_text(
        "/* Automatisch erzeugt von chap_bio/build.py -- nicht von Hand\n"
        "   aendern. Quelle: code/gyminf/python/dynamic-systems/ (Submodul gyminf) */\n"
        f"window.EXAMPLES = {body};\n",
        encoding="utf-8",
    )

    print(f"{len(files)} Dateien -> {OUT.relative_to(REPO)}")
    if missing_figures:
        print("Warnung: Figuren fehlen: " + ", ".join(missing_figures))


if __name__ == "__main__":
    main()
