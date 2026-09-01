#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bygger en fristående kopia av spelet med hållplatsfotona inbakade.

Vanliga index.html hämtar bilderna ur mappen bilder/ bredvid sig. Det fungerar
när spelet ligger på en webbserver (GitHub Pages), men inte när enbart HTML-filen
delas – då syns bara de tecknade scenerna. Den här kopian bär med sig allt.

    python3 verktyg/bygg-fristaende.py [utfil]

Bilderna skalas ned innan de bakas in, annars blir filen onödigt tung.
"""
import io, os, sys, base64
from PIL import Image

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BILDER = os.path.join(ROT, "bilder")
BREDD, HOJD, KVALITET = 560, 263, 66


def bygg(ut):
    källa = io.open(os.path.join(ROT, "index.html"), encoding="utf-8").read()
    if källa.count("const FOTO_DATA = {};") != 1:
        sys.exit("hittar inte 'const FOTO_DATA = {};' i index.html")

    rader, tot = [], 0
    for namn in sorted(os.listdir(BILDER)):
        if not namn.endswith(".jpg"):
            continue
        bild = Image.open(os.path.join(BILDER, namn)).convert("RGB")
        buf = io.BytesIO()
        bild.resize((BREDD, HOJD), Image.LANCZOS).save(
            buf, "JPEG", quality=KVALITET, optimize=True, progressive=True)
        data = base64.b64encode(buf.getvalue()).decode("ascii")
        tot += buf.tell()
        rader.append(f'"{namn[:-4]}":"data:image/jpeg;base64,{data}"')

    bakad = källa.replace(
        "const FOTO_DATA = {};",
        "const FOTO_DATA = {\n" + ",\n".join(rader) + "\n};")
    io.open(ut, "w", encoding="utf-8").write(bakad)
    print(f"{len(rader)} bilder ({tot/1048576:.2f} MB) inbakade i {ut}")
    print(f"filen blev {os.path.getsize(ut)/1048576:.2f} MB")


if __name__ == "__main__":
    bygg(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROT, "fristaende.html"))
