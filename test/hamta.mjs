/* Plockar ut spelets rena funktioner ur index.html så att testerna alltid
   kör mot den riktiga källkoden, inte mot en kopia som kan glida isär. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rot = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(rot, "index.html"), "utf8");
const js = html.match(/<script>\n([\s\S]*)\n<\/script>/)[1];

function block(re, namn){
  const m = js.match(re);
  if(!m) throw new Error("hittade inte " + namn + " i index.html");
  return m[0];
}

const kalla = [
  block(/const rnd  = [\s\S]*?\nfunction shuffle[\s\S]*?\n/, "slumpfunktioner"),
  block(/const REGIONS = \[[\s\S]*?\n\];/, "REGIONS"),
  block(/const LEVELS = \[[\s\S]*?\n\];/, "LEVELS"),
  block(/const MAKE = \{[\s\S]*?\n\};/, "MAKE"),
  block(/const SHOWN = \{[\s\S]*?\};/, "SHOWN"),
  block(/function arrangeKinds\(kinds\)\{[\s\S]*?\n\}/, "arrangeKinds"),
  block(/function buildRound\(L, count, undvik\)\{[\s\S]*?\n  return out;\n\}/, "buildRound"),
  block(/function makeOptions\(q, n\)\{[\s\S]*?\n\}/, "makeOptions"),
  block(/const qNyckel = [^\n]*/, "qNyckel"),
  block(/const TRAM_LINES = \[[\s\S]*?\n\];/, "TRAM_LINES"),
].join("\n");

const modul = await import(
  "data:text/javascript;base64," +
  Buffer.from(kalla + "\nexport { REGIONS, LEVELS, MAKE, SHOWN, buildRound, makeOptions, qNyckel, TRAM_LINES };").toString("base64")
);
export const { REGIONS, LEVELS, MAKE, SHOWN, buildRound, makeOptions, qNyckel, TRAM_LINES } = modul;
