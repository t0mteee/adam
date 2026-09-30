#!/bin/bash
# Läser in Räknelandets röst som ljudfiler på en Mac, med Alva Premium.
#
#     ./verktyg/gor-rost.sh [--namn Adam] [--takt 165] [--rost "Alva (Premium)"] [--wav]
#
# Varje rad i verktyg/rost-fraser.txt (och verktyg/rost-egna.txt om den finns)
# blir en fil ljud/rost/<filnamn>.m4a, och ljud/rost/index.json listar dem.
# --namn läser in ett spelarnamn så att hälsningarna får med det (går att
# upprepa). --takt är ord i minuten, --rost en annan röst ur "say -v ?",
# --wav skriver okomprimerade filer. Lägg sedan mappen i spelet:
#
#     git add ljud/rost && git commit -m "Klippröst" && git push
set -euo pipefail
cd "$(dirname "$0")/.."

TAKT=165; ROST=""; FORMAT="m4a"; NAMN=()
while [ $# -gt 0 ]; do
  case "$1" in
    --namn) NAMN+=("$2"); shift 2;;
    --takt) TAKT="$2"; shift 2;;
    --rost) ROST="$2"; shift 2;;
    --wav)  FORMAT="wav"; shift;;
    -h|--help) sed -n '2,13p' "$0"; exit 0;;
    *) echo "Okänt val: $1"; exit 1;;
  esac
done

if ! command -v say >/dev/null 2>&1; then
  echo "Det här skriptet behöver macOS: kommandot say saknas."; exit 1
fi

# Rösten: Premium före Förbättrad före den lilla, om ingen pekats ut
rostnamn(){ sed -E 's/[[:space:]]+(sv_SE|sv-SE).*$//; s/[[:space:]]+$//' | head -1; }
if [ -z "$ROST" ]; then
  LISTA=$(say -v '?' | grep -i '^Alva' || true)
  ROST=$(printf '%s\n' "$LISTA" | grep -i 'premium' | rostnamn || true)
  [ -z "$ROST" ] && ROST=$(printf '%s\n' "$LISTA" | grep -iE 'enhanced|förbättrad' | rostnamn || true)
  [ -z "$ROST" ] && ROST=$(printf '%s\n' "$LISTA" | rostnamn || true)
  if [ -z "$ROST" ]; then
    echo "Ingen svensk röst Alva hittades. Ladda ner den under Systeminställningar → Hjälpmedel →"
    echo "Uppläst innehåll → Systemröst → Hantera röster → Svenska → Alva (Premium), och kör igen."
    exit 1
  fi
fi
case "$ROST" in *remium*) ;; *) echo "Obs: rösten är \"$ROST\", inte Premium. Ladda ner Alva (Premium) för bästa ljud.";; esac

# Filnamnet för en egen fras: samma regler som spelets klippId
slug(){
  printf '%s' "$1" | perl -CS -pe '$_ = lc; s/å/aa/g; s/ä/ae/g; s/ö/oe/g; s/é/e/g; s/ü/u/g; s/[^a-z0-9 ]//g; s/ +/-/g; s/^-|-$//g' 2>/dev/null \
    || printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g; s/  */-/g'
}

mkdir -p ljud/rost
rm -f ljud/rost/*.m4a ljud/rost/*.wav ljud/rost/index.json
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
IDS=(); antal=0

las(){ # filnamn text
  local id="$1" text="$2" ut="ljud/rost/$1.$FORMAT"
  if [ "$FORMAT" = "wav" ]; then
    say -v "$ROST" -r "$TAKT" --data-format=LEI16@22050 -o "$ut" "$text"
  else
    say -v "$ROST" -r "$TAKT" -o "$TMP/klipp.aiff" "$text"
    afconvert -f m4af -d aac -b 48000 "$TMP/klipp.aiff" "$ut" >/dev/null
  fi
  IDS+=("$id"); antal=$((antal + 1))
  printf '\r%4d  %-60.60s' "$antal" "$id"
}

echo "Läser in med \"$ROST\", $TAKT ord i minuten, som $FORMAT."
while IFS=$'\t' read -r id text; do
  [ -z "$id" ] && continue
  case "$id" in \#*) continue;; esac
  las "$id" "$text"
done < verktyg/rost-fraser.txt

if [ -f verktyg/rost-egna.txt ]; then
  while IFS=$'\t' read -r a b; do
    [ -z "$a" ] && continue
    case "$a" in \#*) continue;; esac
    if [ -n "${b:-}" ]; then las "$a" "$b"; else las "$(slug "$a")" "$a"; fi
  done < verktyg/rost-egna.txt
fi
for n in "${NAMN[@]:-}"; do [ -n "$n" ] && las "$(slug "$n")" "$n"; done

{
  printf '{\n  "rost": "%s",\n  "takt": %s,\n  "format": "%s",\n  "datum": "%s",\n  "klipp": [' "$ROST" "$TAKT" "$FORMAT" "$(date +%F)"
  forsta=1
  for id in "${IDS[@]}"; do
    if [ $forsta = 1 ]; then forsta=0; else printf ','; fi
    printf '\n    "%s"' "$id"
  done
  printf '\n  ]\n}\n'
} > ljud/rost/index.json

printf '\r%-70s\n' "$antal klipp i ljud/rost ($(du -sh ljud/rost | cut -f1))."
echo "Lägg dem i spelet med:  git add ljud/rost && git commit -m \"Klippröst\" && git push"
