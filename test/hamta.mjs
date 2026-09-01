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
  block(/const HUVUD_MAX = [^\n]*\nconst huvudspar = [^\n]*\nconst gangerPa = [^\n]*\n[^\n]*\nconst synligaBanor = [^\n]*\nconst maxStars = [^\n]*/, "spåren"),
  block(/const MAX_STARS = [^\n]*\nconst levelById = [^\n]*/, "levelById"),
  block(/LEVELS\.filter\(L => L\.pool\)\.forEach[\s\S]*?\n\}\);/, "provbanornas sorter"),
  block(/function plusTal\(L\)\{[\s\S]*?\n\}\nfunction minusTal\(L\)\{[\s\S]*?\n\}/, "plus och minus"),
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
  block(/function buildStigandeRound\(p, count, undvik\)\{[\s\S]*?\n  return out;\n\}/, "buildStigandeRound och buildFranNivaer"),
  block(/function sidoOppen\(p\)\{[\s\S]*?\nfunction nextLevelId\(p\)\{[\s\S]*?\n\}/, "upplåsningen"),
  block(/function blandatLevel\(p\)\{[\s\S]*?\n\}/, "blandatLevel"),
  block(/const TRAM_LINES = \[[\s\S]*?\n\];/, "TRAM_LINES"),
  block(/const STOP_PHOTOS = \{[\s\S]*?\n\};/, "STOP_PHOTOS"),
  block(/const TRAM_PHOTOS = \[[\s\S]*?\n\];[\s\S]*?\nconst vagnFoto = [^\n]*/, "TRAM_PHOTOS"),
  block(/const THINGS = \{[\s\S]*?\n\};/, "THINGS"),
  block(/const BAS_SAKER = [^\n]*\n[\s\S]*?const BUTIK = \[[\s\S]*?\n\];[\s\S]*?\nconst sakerFor = [^\n]*/, "butiken"),
  block(/const HJASSA = [^\n]*\nconst TILLBEHOR = \[[\s\S]*?\n\];\nconst tillbehorAv = [^\n]*/, "hattarna"),
].join("\n");

const modul = await import(
  "data:text/javascript;base64," +
  Buffer.from(kalla + "\nexport { REGIONS, LEVELS, MAKE, SHOWN, buildRound, makeOptions, qNyckel, TRAM_LINES, STOP_PHOTOS, TRAM_PHOTOS, vagnFoto, THINGS, BAS_SAKER, BUTIK, TILLBEHOR, sakerFor, skillNu, justeraSkill, nivaForSkill, buildStigandeRound, HUVUD_MAX, SIDO_START, SIDO_MAX, GANGER_START, GANGER_MAX, huvudspar, arLast, oppnaEfter, sidoOppen, gangerOppen, sidosparEfter, synligaBanor, maxStars, nastaBana, blandatLevel, levelById };").toString("base64")
);
export const { REGIONS, LEVELS, MAKE, SHOWN, buildRound, makeOptions, qNyckel, TRAM_LINES, STOP_PHOTOS, TRAM_PHOTOS, vagnFoto,
  THINGS, BAS_SAKER, BUTIK, TILLBEHOR, sakerFor,
  skillNu, justeraSkill, nivaForSkill, buildStigandeRound,
  HUVUD_MAX, SIDO_START, SIDO_MAX, GANGER_START, GANGER_MAX, huvudspar, arLast, oppnaEfter, sidoOppen, gangerOppen, sidosparEfter, synligaBanor, maxStars, nastaBana, blandatLevel, levelById } = modul;
