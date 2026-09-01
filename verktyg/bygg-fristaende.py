#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bygger en fristående kopia av spelet med hållplatsfotona inbakade.

Vanliga index.html hämtar bilderna ur mappen bilder/ bredvid sig. Det fungerar
när spelet ligger på en webbserver (GitHub Pages), men inte när enbart HTML-filen
delas – då syns bara de tecknade scenerna. Den här kopian bär med sig allt.

    python3 verktyg/bygg-fristaende.py [utfil]
    python3 verktyg/bygg-fristaende.py --utan-ram [utfil]

Bilderna skalas ned innan de bakas in, annars blir filen onödigt tung.
Med --utan-ram tas dokumentets yttre taggar bort (doctype, html, head, body),
för visare som lägger till sitt eget skal runt innehållet.
"""
import io, os, sys, base64
from PIL import Image

ROT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BILDER = os.path.join(ROT, "bilder")
BREDD, HOJD, KVALITET = 560, 263, 66


def baka_in(källa):
    """Byter den tomma FOTO_DATA mot en med alla bilder som data-URI:er."""
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
        tot += buf.tell()
        rader.append('"%s":"data:image/jpeg;base64,%s"'
                     % (namn[:-4], base64.b64encode(buf.getvalue()).decode("ascii")))
    print(f"{len(rader)} bilder ({tot/1048576:.2f} MB) inbakade")
    return källa.replace("const FOTO_DATA = {};",
                         "const FOTO_DATA = {\n" + ",\n".join(rader) + "\n};")


def ta_bort_ramen(s):
    """Skalar av dokumentets yttre taggar och sidhuvudets app-rader."""
    start = s.index("<title>")
    s = s[start:]
    for tagg in ["</head>\n<body>\n", "</body>\n</html>\n", "</body>\n</html>"]:
        s = s.replace(tagg, "")
    return s


if __name__ == "__main__":
    argv = sys.argv[1:]
    utan_ram = "--utan-ram" in argv
    argv = [a for a in argv if not a.startswith("--")]
    ut = argv[0] if argv else os.path.join(ROT, "fristaende.html")

    s = baka_in(io.open(os.path.join(ROT, "index.html"), encoding="utf-8").read())
    if utan_ram:
        s = ta_bort_ramen(s)
    io.open(ut, "w", encoding="utf-8").write(s)
    print(f"{ut} blev {os.path.getsize(ut)/1048576:.2f} MB")
