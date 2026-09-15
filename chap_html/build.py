#!/usr/bin/env python3
"""Bündelt die Code-Beispiele aus dem Submodul in assets/examples.js.

Alle Listings und Lösungen der Webseite kommen aus code/gyminf/html/. Damit die
Seite auch direkt über file:// funktioniert (fetch() ist dort gesperrt), werden
die Dateien in ein JavaScript-Objekt geschrieben, anstatt zur Laufzeit geladen.

Aufruf aus dem Repo-Wurzelverzeichnis:

    python3 web/build.py
"""

import json
import shutil
import sys
from pathlib import Path

WEB = Path(__file__).resolve().parent
REPO = WEB.parent
SRC = REPO / "code" / "gyminf" / "html"
OUT = WEB / "assets" / "examples.js"
IMG = WEB / "assets" / "img"

# Figuren, die die Webseite nicht selber rendern kann: Zieldarstellungen, welche
# die Schueler nachbauen sollen, und das Box-Modell-Diagramm.
FIGURES = {
    "boxmodell.svg": REPO / "images" / "boxmodell.svg",
    "navbar.png": REPO / "images" / "navbar.png",
    "smileywebsite.png": REPO / "images" / "smileywebsite.png",
    "grid-exercise.png": REPO / "screenshots" / "20240622-144953-screenshot.png",
    "flexbox-reverse.png": REPO / "screenshots" / "20240619-105635-screenshot.png",
}


def collect():
    if not SRC.is_dir():
        sys.exit(
            f"Fehler: {SRC} fehlt. Submodul initialisieren mit\n"
            "    git submodule update --init --recursive"
        )
    files = {}
    for path in sorted(SRC.rglob("*")):
        if path.is_file() and path.suffix in (".html", ".css"):
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
        "/* Automatisch erzeugt von web/build.py -- nicht von Hand aendern.\n"
        "   Quelle: code/gyminf/html/ (Submodul gyminf) */\n"
        f"window.EXAMPLES = {body};\n",
        encoding="utf-8",
    )

    print(f"{len(files)} Dateien -> {OUT.relative_to(REPO)}")
    if missing_figures:
        print("Warnung: Figuren fehlen: " + ", ".join(missing_figures))


if __name__ == "__main__":
    main()
