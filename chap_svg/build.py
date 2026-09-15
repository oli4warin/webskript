#!/usr/bin/env python3
"""Buendelt die Code-Beispiele aus dem Submodul in assets/examples.js.

Alle Listings, Beispielbilder und Loesungen der Webseite kommen aus
code/gyminf/svg/. Damit die Seite auch direkt ueber file:// funktioniert
(fetch() ist dort gesperrt), werden die Dateien in ein JavaScript-Objekt
geschrieben, anstatt zur Laufzeit geladen.

Aufruf aus dem Repo-Wurzelverzeichnis:

    python3 chap_svg-web/build.py
"""

import json
import shutil
import sys
from pathlib import Path

WEB = Path(__file__).resolve().parent
REPO = WEB.parent
SRC = REPO / "code" / "gyminf" / "svg"
OUT = WEB / "assets" / "examples.js"
IMG = WEB / "assets" / "img"

# Bilder, welche die Webseite nicht selber rendern kann: das Portrait aus dem
# Kapitel. Alle Grafiken sind SVG und kommen aus dem Submodul; die didaktischen
# Figuren (Koordinatensystem, Kontrollpunkte einer Bezierkurve) stehen als
# Inline-SVG direkt in den Seiten.
#
# images/bezier.jpg fehlt hier absichtlich: Wikimedia Commons hat die Datei am
# 6. August 2024 als Urheberrechtsverletzung geloescht. Fuer die oeffentliche
# Webseite ist sie damit unbrauchbar -- nicht wieder eintragen.
FIGURES = {
    "mandelbrot.jpg": REPO / "images" / "mandelbrot.jpg",
}


def collect():
    if not SRC.is_dir():
        sys.exit(
            f"Fehler: {SRC} fehlt. Submodul initialisieren mit\n"
            "    git submodule update --init --recursive"
        )
    files = {}
    for path in sorted(SRC.rglob("*")):
        if path.is_file() and path.suffix in (".svg", ".html", ".css"):
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
        "/* Automatisch erzeugt von chap_svg-web/build.py -- nicht von Hand\n"
        "   aendern. Quelle: code/gyminf/svg/ (Submodul gyminf) */\n"
        f"window.EXAMPLES = {body};\n",
        encoding="utf-8",
    )

    print(f"{len(files)} Dateien -> {OUT.relative_to(REPO)}")
    if missing_figures:
        print("Warnung: Figuren fehlen: " + ", ".join(missing_figures))


if __name__ == "__main__":
    main()
