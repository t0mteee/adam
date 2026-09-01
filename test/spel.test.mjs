import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { REGIONS, LEVELS, SHOWN, buildRound, makeOptions, qNyckel, TRAM_LINES, STOP_PHOTOS, TRAM_PHOTOS, vagnFoto,
         THINGS, BAS_SAKER, BUTIK, sakerFor,
         justeraSkill, nivaForSkill, buildStigandeRound,
         HUVUD_MAX, SIDO_START, SIDO_MAX, huvudspar, arLast, oppnaEfter, sidoOppen, nastaBana, blandatLevel, levelById } from "./hamta.mjs";

const rot = join(dirname(fileURLToPath(import.meta.url)), "..");

const OMGANGAR = 400;
const talen = (q) => [q.a, q.b, q.c, q.sum, q.count, q.answer].filter(v => v != null);

test("varje bana hör till ett område och har unikt nummer", () => {
  const sedda = new Set();
  for(const L of LEVELS){
    assert.ok(!sedda.has(L.id), `bana ${L.id} förekommer två gånger`);
    sedda.add(L.id);
    assert.ok(REGIONS[L.r], `bana ${L.id} pekar på område ${L.r} som inte finns`);
    assert.ok(L.kinds.length > 0 && L.opts >= 3, `bana ${L.id} saknar sorter eller alternativ`);
  }
  assert.equal(LEVELS.length, new Set(LEVELS.map(L => L.name)).size, "två banor heter likadant");
});

test("uppgifterna håller sig inom banans tal och blir aldrig negativa", () => {
  for(const L of LEVELS){
    for(let r = 0; r < OMGANGAR; r++){
      for(const q of buildRound(L, 10)){
        assert.ok(q.answer >= 0, `${L.name}: negativt svar ${JSON.stringify(q)}`);
        assert.ok(Math.max(...talen(q)) <= L.max, `${L.name}: ${Math.max(...talen(q))} över taket ${L.max}`);
        if(q.kind === "count" && L.min) assert.ok(q.count >= L.min, `${L.name}: ${q.count} under golvet ${L.min}`);
        if(q.kind === "add")     assert.equal(q.answer, q.a + q.b);
        if(q.kind === "sub")     assert.equal(q.answer, q.a - q.b);
        if(q.kind === "add3")    assert.equal(q.answer, q.a + q.b + q.c);
        if(q.kind === "missing") assert.equal(q.answer, q.sum - q.a);
        if(q.kind === "count")   assert.equal(q.answer, q.count);
      }
    }
  }
});

test("rätt svar finns alltid bland alternativen, utan dubbletter", () => {
  for(const L of LEVELS){
    for(let r = 0; r < OMGANGAR; r++){
      for(const q of buildRound(L, 10)){
        const alt = makeOptions(q, L.opts);
        assert.equal(alt.length, L.opts, `${L.name}: fel antal alternativ`);
        assert.equal(new Set(alt).size, alt.length, `${L.name}: dubblett bland ${alt}`);
        assert.ok(alt.includes(q.answer), `${L.name}: svaret ${q.answer} saknas bland ${alt}`);
        assert.ok(alt.every(v => v >= 0), `${L.name}: negativt alternativ bland ${alt}`);
      }
    }
  }
});

test("samma sorts uppgift kommer aldrig mer än två gånger i rad", () => {
  for(const L of LEVELS.filter(L => L.kinds.length > 1)){
    for(let r = 0; r < OMGANGAR; r++){
      const sorter = buildRound(L, 10).map(q => q.kind);
      let svit = 1;
      for(let i = 1; i < sorter.length; i++){
        svit = sorter[i] === sorter[i - 1] ? svit + 1 : 1;
        assert.ok(svit <= 2, `${L.name}: ${svit} likadana i rad (${sorter.join(",")})`);
      }
    }
  }
});

test("dubbeltal och tiokompisar räknas som den sort de ser ut som", () => {
  assert.equal(SHOWN.double, "add");
  assert.equal(SHOWN.ten, "missing");
});

test("undvik-listan hindrar att förra hållplatsens tal kommer igen", () => {
  const L = LEVELS.find(x => x.name === "Plus och minus till 20");
  for(let r = 0; r < 200; r++){
    const nycklar = buildRound(L, 5).map(qNyckel);
    const andra = buildRound(L, 5, new Set(nycklar));
    const krock = andra.filter(q => nycklar.includes(qNyckel(q)));
    assert.equal(krock.length, 0, `samma tal återkom: ${JSON.stringify(krock)}`);
  }
});

test("spårvagnslinjerna har giltiga hållplatser och färger", () => {
  assert.ok(TRAM_LINES.length >= 12);
  for(const l of TRAM_LINES){
    assert.match(l.col, /^#[0-9A-F]{6}$/, `linje ${l.ref} har ogiltig färg ${l.col}`);
    assert.ok(l.stops.length >= 10, `linje ${l.ref} har bara ${l.stops.length} hållplatser`);
    assert.ok(l.a && l.b, `linje ${l.ref} saknar skyltdestination`);
    for(let i = 1; i < l.stops.length; i++){
      assert.notEqual(l.stops[i], l.stops[i - 1], `linje ${l.ref}: ${l.stops[i]} står två gånger i rad`);
    }
    assert.equal(new Set(l.stops).size, l.stops.length, `linje ${l.ref} passerar samma hållplats två gånger`);
  }
});

test("ingen linje motsäger en annan om hållplatsernas ordning", () => {
  const fel = [];
  for(const l of TRAM_LINES){
    for(let k = 0; k < l.stops.length - 1; k++){
      const [a, b] = [l.stops[k], l.stops[k + 1]];
      for(const l2 of TRAM_LINES){
        if(l2 === l) continue;
        const i = l2.stops.indexOf(a), j = l2.stops.indexOf(b);
        if(i < 0 || j < 0) continue;
        if(Math.abs(i - j) > 1){
          fel.push(`linje ${l.ref}: ${a}→${b}, men linje ${l2.ref} har ${l2.stops.slice(Math.min(i,j)+1, Math.max(i,j))} emellan`);
        }
      }
    }
  }
  assert.deepEqual(fel, [], fel.join("\n"));
});

test("stigande svårighet höjs vid rätt och sänks vid fel, inom det upplåsta", () => {
  const p = { unlocked: 10, skill: 5 };
  for(let i = 0; i < 5; i++) justeraSkill(p, "ratt");
  assert.ok(p.skill > 5, "skickligheten steg inte vid rätt svar");
  const topp = p.skill;
  for(let i = 0; i < 5; i++) justeraSkill(p, "ned");
  assert.ok(p.skill < topp, "skickligheten sjönk inte vid fel svar");
  assert.ok(p.skill >= 1, "skickligheten föll under lägsta banan");

  for(let i = 0; i < 200; i++) justeraSkill(p, "ratt");
  assert.equal(p.skill, 10, "skickligheten stannade inte vid den svåraste upplåsta banan");
  for(let i = 0; i < 200; i++) justeraSkill(p, "ned");
  assert.equal(p.skill, 1, "skickligheten gick under bana ett");
});

test("stigande drar bara uppgifter från upplåsta banor", () => {
  for(const unlocked of [1, 3, 7, 12, 19]){
    const p = { unlocked, skill: unlocked };
    for(let r = 0; r < 300; r++){
      const L = nivaForSkill(p);
      assert.ok(L.id >= 1 && L.id <= unlocked, `nivå ${L.id} utanför 1–${unlocked}`);
    }
  }
});

test("ingen uppgift upprepas inom samma stigande omgång", () => {
  for(const skill of [2, 5, 7, 9, 14]){
    const p = { unlocked: 15, skill };
    for(let r = 0; r < 300; r++){
      const tidigare = new Set(buildStigandeRound(p, 5).map(qNyckel));
      const omgang = buildStigandeRound(p, 5, tidigare);
      const nycklar = omgang.map(qNyckel);
      assert.equal(new Set(nycklar).size, nycklar.length,
        `skicklighet ${skill}: dubblett i omgången ${nycklar.join(" | ")}`);
      for(const q of omgang){
        assert.ok(q.answer >= 0 && q.opts >= 3, `ogiltig uppgift ${JSON.stringify(q)}`);
      }
    }
  }
});


test("varje hållplatsfoto hör till en riktig hållplats och filen finns", () => {
  const hallplatser = new Set(TRAM_LINES.flatMap(l => l.stops));
  const filer = new Set();
  for(const [namn, foto] of Object.entries(STOP_PHOTOS)){
    assert.ok(hallplatser.has(namn), `${namn} finns inte på någon linje`);
    assert.ok(existsSync(join(rot, "bilder", foto.f + ".jpg")),
      `bilden bilder/${foto.f}.jpg saknas för ${namn}`);
    assert.ok(!filer.has(foto.f), `bilden ${foto.f} används till två hållplatser`);
    filer.add(foto.f);
    assert.ok(foto.by && foto.lic, `${namn} saknar fotograf eller licens`);
  }
});

test("skattkistans saker går att rita, kostar olika och läggs till spelarens", () => {
  for(const nyckel of BAS_SAKER) assert.ok(THINGS[nyckel], `räknesaken ${nyckel} saknar bild`);
  const priser = [];
  for(const v of BUTIK){
    assert.ok(THINGS[v.id], `${v.id} går inte att rita`);
    assert.ok(BAS_SAKER.indexOf(v.id) === -1, `${v.id} finns redan från start`);
    assert.ok(v.pris > 0 && v.name && v.ord && v.flera, `${v.id} saknar pris eller namn`);
    priser.push(v.pris);
  }
  assert.deepEqual(priser, [...priser].sort((a, b) => a - b), "priserna ska stiga");
  assert.deepEqual(sakerFor(null), BAS_SAKER);
  assert.deepEqual(sakerFor({ kopta: [] }), BAS_SAKER);
  const med = sakerFor({ kopta: ["tram", "moon"] });
  assert.equal(med.length, BAS_SAKER.length + 2);
  assert.ok(med.includes("tram") && med.includes("moon"));
});

test("tiotalsuppgifter delar upp talet i tior och ental", () => {
  const bana = LEVELS.find(l => l.name === "Räkna till 100");
  assert.ok(bana.kinds.includes("tiotal"), "Räkna till 100 ska ha tiotalsuppgifter");
  let sedda = 0;
  for(let i = 0; i < 300; i++){
    for(const q of buildRound(bana, 10)){
      if(q.kind !== "tiotal") continue;
      sedda++;
      assert.equal(q.tior * 10 + q.ental, q.answer, `${q.tior} tior och ${q.ental} ental blir inte ${q.answer}`);
      assert.ok(q.ental >= 0 && q.ental <= 9, `ental utanför 0–9: ${q.ental}`);
      assert.ok(q.answer >= bana.min && q.answer <= bana.max, `${q.answer} utanför banans tal`);
      const alt = makeOptions(q, 4);
      assert.ok(alt.includes(q.answer), "rätt svar saknas bland alternativen");
      assert.equal(new Set(alt).size, 4, "dubblett bland alternativen");
    }
  }
  assert.ok(sedda > 100, `såg bara ${sedda} tiotalsuppgifter`);
});

test("Vagnhallens sorter räknar rätt och håller sig inom banans tal", () => {
  const banor = LEVELS.filter(L => REGIONS[L.r].name === "Vagnhallen");
  assert.equal(banor.length, 8, "Vagnhallen ska ha åtta banor");
  let serier = 0, ganger = 0, halvor = 0;
  for(const L of banor){
    assert.ok(L.utanHjalp, `${L.name} ska sakna hjälpbilder`);
    for(let i = 0; i < 120; i++){
      for(const q of buildRound(L, 10)){
        assert.ok(q.utanHjalp, "uppgiften ska bära banans regel om hjälpbilder");
        assert.ok(q.answer >= 0 && q.answer <= L.max, `${q.kind} gav ${q.answer} på ${L.name}`);
        if(q.kind === "add")   assert.equal(q.a + q.b, q.answer);
        if(q.kind === "sub"){  assert.equal(q.a - q.b, q.answer); assert.ok(q.b < q.a); }
        if(q.kind === "mul"){  assert.equal(q.a * q.b, q.answer); ganger++;
                               assert.ok([2, 5, 10].includes(q.a)); }
        if(q.kind === "half"){ assert.equal(q.a, q.answer * 2); halvor++; }
        if(q.kind === "serie"){
          serier++;
          assert.equal(q.tal.length, 3, "tre tal ska synas");
          const steg = q.upp ? q.steg : -q.steg;
          assert.equal(q.tal[1] - q.tal[0], steg);
          assert.equal(q.tal[2] - q.tal[1], steg);
          assert.equal(q.tal[2] + steg, q.answer);
          assert.ok(q.tal.every(t => t >= 0), `negativt tal i följden ${q.tal}`);
        }
        const alt = makeOptions(q, 4);
        assert.ok(alt.includes(q.answer), `rätt svar saknas för ${q.kind}`);
        assert.equal(new Set(alt).size, 4, `dubblett bland alternativen för ${q.kind}`);
      }
    }
  }
  assert.ok(serier > 50 && ganger > 50 && halvor > 50,
    `för få av någon sort: talföljd ${serier}, gånger ${ganger}, hälften ${halvor}`);
});

test("banorna med hjälpbilder behåller dem, räknebanorna sina figurer", () => {
  for(const L of LEVELS){
    const q = buildRound(L, 10)[0];
    if(L.id <= 9 || REGIONS[L.r].sidospar) assert.ok(!q.utanHjalp, `${L.name} ska ha hjälpbilder`);
    else assert.ok(q.utanHjalp, `${L.name} ska sakna hjälpbilder`);
  }
});

test("hållplatser utan eget foto får samma spårvagn varje gång", () => {
  assert.ok(TRAM_PHOTOS.length >= 8, "för få spårvagnsbilder att välja bland");
  for(const v of TRAM_PHOTOS){
    assert.ok(existsSync(join(rot, "bilder", v.f + ".jpg")), `bilder/${v.f}.jpg saknas`);
    assert.ok(v.by && v.lic, `${v.f} saknar fotograf eller licens`);
  }
  const utan = [...new Set(TRAM_LINES.flatMap(l => l.stops))].filter(n => !STOP_PHOTOS[n]);
  assert.ok(utan.length > 0, "testet förutsätter att någon hållplats saknar foto");
  for(const namn of utan){
    const a = vagnFoto(namn), b = vagnFoto(namn);
    assert.ok(a && a.f, `${namn} fick ingen spårvagn`);
    assert.equal(a.f, b.f, `${namn} bytte spårvagn mellan besöken`);
  }
  const spridning = new Set(utan.map(n => vagnFoto(n).f));
  assert.ok(spridning.size >= Math.min(6, TRAM_PHOTOS.length),
    `bara ${spridning.size} olika vagnar över ${utan.length} hållplatser`);
});

test("Ändstationens tal är stora nog och summerar rätt", () => {
  const banor = LEVELS.filter(L => REGIONS[L.r].name === "Ändstationen");
  assert.equal(banor.length, 4, "Ändstationen ska ha fyra banor");
  for(const L of banor){
    assert.ok(L.utanHjalp, `${L.name} ska sakna hjälpbilder`);
    const summor = [];
    for(let i = 0; i < 150; i++){
      for(const q of buildRound(L, 10)){
        assert.ok(q.answer >= 0 && q.answer <= L.max, `${q.kind} gav ${q.answer} på ${L.name}`);
        if(q.kind === "add"){
          assert.equal(q.a + q.b, q.answer);
          assert.ok(Math.min(q.a, q.b) >= L.minDel,
            `${q.a} + ${q.b}: minsta talet under ${L.minDel} på ${L.name}`);
        }
        if(q.kind === "sub"){
          assert.equal(q.a - q.b, q.answer);
          assert.ok(q.b >= L.minDel && q.answer >= L.minDel,
            `${q.a} − ${q.b}: för litet led på ${L.name}`);
        }
        if(q.kind === "flera"){
          assert.equal(q.tal.length, L.termer, `${L.name} ska ha ${L.termer} tal`);
          assert.equal(q.tal.reduce((n, t) => n + t, 0), q.answer);
          assert.ok(q.tal.every(t => t >= 2), `för litet tal i ${q.tal}`);
          assert.ok(q.tal.some(t => t >= 10), `bara småtal i ${q.tal}`);
        }
        summor.push(q.answer);
        const alt = makeOptions(q, 4);
        assert.ok(alt.includes(q.answer), `rätt svar saknas för ${q.kind}`);
        assert.equal(new Set(alt).size, 4, `dubblett bland alternativen för ${q.kind}`);
      }
    }
    /* Uppgifterna ska spänna över banans tal, inte klumpa ihop sig vid taket */
    const snitt = summor.reduce((n, v) => n + v, 0) / summor.length;
    assert.ok(snitt > L.max * 0.25 && snitt < L.max * 0.85,
      `${L.name}: svaren ligger i snitt på ${Math.round(snitt)} av ${L.max}`);
  }
});
