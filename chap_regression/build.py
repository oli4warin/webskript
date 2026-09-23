#!/usr/bin/env python3
"""Bündelt die Python-Beispiele aus dem Submodul in assets/examples.js.

Alle Lösungsvorschläge der Werkbänke kommen aus
code/gyminf/python/regression/, bis auf die Übung 1.05
(«Vorbereitung: Python und Matplotlib»): deren Lösung ist
code/gyminf/python/dynamic-systems/matplotlib-example.py (der Abschnitt kam
ursprünglich aus chap_bio.tex, siehe chap_modellieren.tex-Commit "moved
matplotlib stuff to chap_modellieren" -- die Lösungsdatei blieb dabei im
dynamic-systems/-Ordner, statt nach regression/ zu wandern). Damit die Seite
auch direkt über file:// funktioniert
(fetch() ist dort gesperrt), werden die Dateien in ein JavaScript-Objekt
geschrieben, anstatt zur Laufzeit geladen. (Die Python-Werkbänke selbst
brauchen für die Code-*Ausführung* trotzdem eine Internetverbindung -- siehe
../chap_hypothesen/README.md, Abschnitt Pyodide.)

Aufruf aus dem Wurzelverzeichnis des Hauptrepos (nicht des Submoduls
webskript):

    python3 webskript/chap_regression/build.py
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
# hier): das Gauss-Portrait (laut sources/people-pics.bib, Eintrag pic:gauss,
# public domain) und die Zielgrafik der Matplotlib-Übung 1.05 (selbst
# erzeugt, kein Urheberrecht Dritter).
FIGURES = {
    "gauss.jpg": REPO / "images" / "gauss.jpg",
    "matplotlib-example.svg": REPO / "images" / "matplotlib-example.svg",
}

# Einzelne Dateien aus anderen Unterordnern von code/gyminf/python/, die
# dieses Kapitel zusätzlich zu allem aus regression/ braucht. Siehe
# Modul-Docstring oben.
EXTRA_FILES = [
    Path("dynamic-systems") / "matplotlib-example.py",
]


def collect():
    if not SRC.is_dir():
        sys.exit(
            f"Fehler: {SRC} fehlt. Submodul initialisieren mit\n"
            "    git submodule update --init --recursive"
        )
    files = {}
    for path in sorted((SRC / "regression").rglob("*")):
        if path.is_file() and path.suffix == ".py":
            key = path.relative_to(SRC).as_posix()
            files[key] = path.read_text(encoding="utf-8")
    for rel in EXTRA_FILES:
        path = SRC / rel
        if not path.is_file():
            sys.exit(f"Fehler: {path} fehlt.")
        files[rel.as_posix()] = path.read_text(encoding="utf-8")
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
        "/* Automatisch erzeugt von chap_regression/build.py -- nicht von Hand\n"
        "   aendern. Quelle: code/gyminf/python/regression/ (Submodul gyminf) */\n"
        f"window.EXAMPLES = {body};\n",
        encoding="utf-8",
    )

    print(f"{len(files)} Dateien -> {OUT.relative_to(REPO)}")
    if missing_figures:
        print("Warnung: Figuren fehlen: " + ", ".join(missing_figures))


if __name__ == "__main__":
    main()
