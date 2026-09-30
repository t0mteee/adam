#!/usr/bin/env node
/* Skriver verktyg/rost-fraser.txt: allt spelet kan säga, som hela meningar där
   de är fasta och som bitar där tal, namn och hållplatser stoppas in. Talen
   0–100, hundratalen och tusentalen är egna klipp. Kör den när spelet fått
   nya repliker, och sedan verktyg/gor-rost.sh på en Mac:

       node verktyg/rost-fraser.mjs

   Varje rad är filnamnet, ett tabbtecken och texten som ska läsas in. Testet
   "klipprösten täcker allt spelet säger" kontrollerar att listan räcker. */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { LEVELS, REGIONS, SPAR, BADGES, SAGOR, SMASPEL, BUTIK, TILLBEHOR, VAGNSAKER, VAGNTYPER, VAGNNAMN,
         distraktorer, klippId, utropAlla } from "../test/hamta.mjs";

const grupper = [];
/* En fras är en text, eller [text som ger filnamnet, text som läses] */
const grupp = (namn, fraser) => grupper.push({ namn, fraser: fraser.filter(Boolean) });

grupp("Tal", [...Array(101).keys()].map(String)
  .concat([200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000].map(String))
  .concat([["00", "noll noll"]]));

grupp("Frågorna", [
  "Hur många ser du?", "Vad är klockan?", "Vilken vagn går först?", "Titta på vagnen! Vilket nummer har den?",
  "Var är vi? Titta på bilden!", "Var är vi?", "Kluring!", ["hmm", "hm"],
  "Vilket tal är störst?", "Vilket tal är minst?", "Vilket tal fattas?", "Vilket tal kommer sen?",
  "Vad blir", "plus", "minus", "plus vad blir", "gånger", "delat med", "Vad är hälften av",
  "Hur många är", "tior och", "ental?", "tior?",
  "Vagnen står på", "och hoppar", "framåt.", "bakåt.", "Var stannar den?", "Hur många hopp är det från", "till",
  "Vi står vid", "Vagnen åker", "hållplatser till.", "Var är vi då?", "För", "hållplatser sedan, var var vi då?",
  "Hur många hållplatser är det kvar till",
  "Vilken klocka visar", "halv", "Klockan visar", "Hur mycket är klockan?", "Klockan är", "mot", "går",
  "Hur länge får vi vänta?", "Vilken bild är"
]);

/* Förklaringarna till felsvaren står i distraktorer() och varforFel(): de
   fasta som hela meningar, och de med tal i som bitarna runt talen */
const felKalla = distraktorer.toString();
const felTexter = [...new Set((felKalla.match(/"([^"]+[!?.])"/g) || []).map(s => s.slice(1, -1)))];
for(const mall of felKalla.match(/`[^`]*`/g) || []) for(const del of mall.slice(1, -1).split(/\$\{[^}]*\}/))
  for(const mening of del.match(/[^.!?]+[.!?]?/g) || []){ const bit = mening.replace(/^[\s.,!?:]+/, "").trim(); if(bit) felTexter.push(bit); }
grupp("Svaren och felen", [
  "Svaret är", "en halvtimme", "en timme", "en och en halv timme", "två timmar", "minuter", "linje",
  "Lite för mycket!", "Lite för lite!", "För mycket!", "För lite!", ...felTexter
]);

grupp("Omgången", [
  "rätt i rad!", "Helt fantastiskt!", "Tre stjärnor!", "Fint jobbat!", "Du fick", "en stjärna!", "stjärnor!",
  "Bra kämpat!", "Vi provar igen.", "Nu är en ny bana öppen!", "Alla rätt!", "Du kan din stad!", "Bra kikat!", "rätt av",
  "Uppdrag klart!", "Du kom till", "mynt extra!", "Bra åkt!", "Ny bana öppen:", "mynt.", "Nytt märke!", "Nytt rekord!",
  "passagerare!", "poäng!"
]);

grupp("Kompisen", [
  "Hej!", "Hej igen!", "Välkommen till Räknelandet!", "Kul att du är tillbaka!", "Ska vi räkna?", "Ska vi räkna? Ett, två, tre!",
  "Du har", "stjärnor. Wow!", "Vi tar en stjärna tillsammans!", "Nästa bana är", "Du har klarat hela kartan!",
  "Visste du att spårvagn 318 heter Bebben?", "Linje 6 är längst i Göteborg. 46 hållplatser!", "M34 är 45 meter lång. Längst i hela stan!",
  "Tio tior är hundra!", "Dubbelt så mycket som fem är tio!", "Tut tut! Här kommer spårvagnen!", "mynt i skattkistan!",
  "Mynten hamnar i skattkistan!", "Jag gillar siffran", "Du är bäst!", "Sju plus tre är tio. Tiokompisar!"
]);

grupp("Kartan och inställningarna", [
  "Den här banan är låst. Klara banan innan så öppnas den!", ...Object.values(SPAR).map(s => s.last),
  "Bana", "Stigande", "Blandat", "Spårvagn", "Räknelandet", "Skriv siffran!", "Välj bland rutorna!", "Nu läser jag frågorna igen!",
  "Nu står allt still.", "Nu rör sig allt igen!", "Så här fort pratar jag nu.", "Nu talar jag med klippen!", "Nu talar jag med plattans röst.",
  "Du köpte", "Tryck på Spela.", "Snyggt!", "Titta på din vagn under Spårvagn.", "Den står bredvid dig när du räknar.",
  "Du behöver", "mynt till.", "Din vagn", "går på", "Nytt vagnkort!", "Vagn", "En museivagn!",
  ...SMASPEL.map(s => s.name), ...SMASPEL.map(s => s.hur), ...BUTIK.map(s => s.ord), ...TILLBEHOR.map(s => s.ord), ...VAGNSAKER.map(s => s.ord),
  ...VAGNTYPER.map(t => t.typ), ...VAGNTYPER.map(t => t.smek), ...VAGNTYPER.map(t => t.om), ...Object.values(VAGNNAMN).map(v => v[0]),
  ...LEVELS.map(L => L.name), ...REGIONS.map(r => r.name), ...BADGES.map(b => b.name)
]);

grupp("Spårvagnen", [
  ...utropAlla(), "Spårarbete! Den vagnen går inte härifrån.", "Nytt uppdrag!", "Ta dig till", "Men det är spårarbete mellan", "och",
  "så du måste hitta en annan väg.", "Hållplats",
  "Stanna vid", "Det är nästa hållplats.", "Det är", "hållplatser bort.", "Perfekt stopp!", "Bra stopp!", "Nästan!",
  "Det här är", "inte", "Oj, du körde förbi"
]);

/* Räknesagorna: mallarna körs med ett märke i varje lucka, och bitarna
   emellan blir klipp – hela meningar där luckorna inte bryter dem */
const sagoBitar = [];
for(const sort of Object.keys(SAGOR)) for(const mall of SAGOR[sort]){
  const text = mall({ a: "§", b: "§", stopp: "§", ref: "§", mot: "§" });
  for(const del of text.split("§")) for(const mening of del.match(/[^.!?]+[.!?]?/g) || []){
    const bit = mening.replace(/^[\s.,!?:]+/, "").trim();
    if(bit) sagoBitar.push(bit);
  }
}
grupp("Räknesagorna", sagoBitar);

/* Samma filnamn två gånger: den första texten gäller */
const sedda = new Set();
const rader = ["# Räknelandets klippröst: fraser att läsa in. Skapad av verktyg/rost-fraser.mjs, ändra inte för hand.", "# filnamn<tabb>text"];
let antal = 0;
for(const g of grupper){
  rader.push("", "# " + g.namn);
  for(const f of g.fraser){
    const [nyckel, text] = Array.isArray(f) ? f : [f, f];
    const id = klippId(nyckel);
    if(!id || sedda.has(id)) continue;
    sedda.add(id); antal++;
    rader.push(id + "\t" + String(text).replace(/\s+/g, " ").trim());
  }
}
const ut = join(dirname(fileURLToPath(import.meta.url)), "rost-fraser.txt");
writeFileSync(ut, rader.join("\n") + "\n");
console.log(`${antal} fraser i ${ut}`);
