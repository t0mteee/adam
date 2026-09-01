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
  block(/const MAX_STARS = [^\n]*\nconst levelById = [^\n]*/, "levelById"),
  block(/const MAKE = \{[\s\S]*?\n\};/, "MAKE"),
  block(/const SHOWN = \{[\s\S]*?\};/, "SHOWN"),
  block(/function arrangeKinds\(kinds\)\{[\s\S]*?\n\}/, "arrangeKinds"),
  block(/function buildRound\(L, count, undvik\)\{[\s\S]*?\n  return out;\n\}/, "buildRound"),
  block(/function makeOptions\(q, n\)\{[\s\S]*?\n\}/, "makeOptions"),
  block(/const qNyckel = [^\n]*/, "qNyckel"),
  block(/const SKILL_UPP = [^\n]*/, "skill-konstanter"),
  block(/function skillNu\(p\)\{[\s\S]*?\n\}/, "skillNu"),
  block(/function justeraSkill\(p, utfall\)\{[\s\S]*?\n\}/, "justeraSkill"),
  block(/function nivaForSkill\(p\)\{[\s\S]*?\n\}/, "nivaForSkill"),
  block(/function buildStigandeRound\(p, count, undvik\)\{[\s\S]*?\n  return out;\n\}/, "buildStigandeRound"),
  block(/const TRAM_LINES = \[[\s\S]*?\n\];/, "TRAM_LINES"),
  block(/const STOP_PHOTOS = \{[\s\S]*?\n\};/, "STOP_PHOTOS"),
  block(/const TRAM_PHOTOS = \[[\s\S]*?\n\];[\s\S]*?\nconst vagnFoto = [^\n]*/, "TRAM_PHOTOS"),
  block(/const THINGS = \{[\s\S]*?\n\};/, "THINGS"),
  block(/const BAS_SAKER = [^\n]*\nconst BUTIK = \[[\s\S]*?\n\];[\s\S]*?\nconst sakerFor = [^\n]*/, "butiken"),
].join("\n");

const modul = await import(
  "data:text/javascript;base64," +
  Buffer.from(kalla + "\nexport { REGIONS, LEVELS, MAKE, SHOWN, buildRound, makeOptions, qNyckel, TRAM_LINES, STOP_PHOTOS, TRAM_PHOTOS, vagnFoto, THINGS, BAS_SAKER, BUTIK, sakerFor, skillNu, justeraSkill, nivaForSkill, buildStigandeRound };").toString("base64")
);
export const { REGIONS, LEVELS, MAKE, SHOWN, buildRound, makeOptions, qNyckel, TRAM_LINES, STOP_PHOTOS, TRAM_PHOTOS, vagnFoto,
  THINGS, BAS_SAKER, BUTIK, sakerFor,
  skillNu, justeraSkill, nivaForSkill, buildStigandeRound } = modul;
