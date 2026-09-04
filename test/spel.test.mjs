import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { REGIONS, LEVELS, SHOWN, buildRound, makeOptions, distraktorer, varforFel, laggKluring, kluringUtfall, kluringarFor, blandaInKluring,
         gorSaga, blandaInSaga, natAvstand, valjUppdrag, uppdragTips, ALLA_STOPP, qNyckel, TRAM_LINES, STOP_PHOTOS, TRAM_PHOTOS, vagnFoto,
         THINGS, BAS_SAKER, BUTIK, TILLBEHOR, sakerFor,
         justeraSkill, nivaForSkill, buildStigandeRound,
         HUVUD_MAX, SIDO_START, SIDO_MAX, GANGER_START, GANGER_MAX, TALRAD_START, TALRAD_MAX, huvudspar, arLast, oppnaEfter, sidoOppen, gangerOppen, talradOppen, sidosparEfter, datumNyckel, statSvar, statTid, MAKE, SMASPEL, SPELMOTOR, spelKopt, LEK_W, LEK_H, synligaBanor, maxStars, nastaBana, blandatLevel, levelById,
         SPAR, sparOppen, linjeOppen, klockaOppen, LINJE_START, LINJE_MAX, KLOCKA_START, KLOCKA_MAX, timme12, tidKod, tidOrd, kodTid, vantetidOrd, svarText,
         hallFraga, tavlaHar, avgangar, VAGNAR, vagnFragaFor, rostPoang, rostNamn, bastaRost } from "./hamta.mjs";

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
        if(q.kind === "jamfor")  assert.equal(q.answer, q.storst ? Math.max(...q.tal) : Math.min(...q.tal));
        if(q.kind === "lucka")   assert.equal(q.answer, q.tal[q.lucka]);
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
  const med = sakerFor({ kopta: ["tram", "moon", "keps"] });
  assert.equal(med.length, BAS_SAKER.length + 2, "en hatt är ingen räknesak");
  assert.ok(med.includes("tram") && med.includes("moon") && !med.includes("keps"));
  const hattpriser = TILLBEHOR.map(t => t.pris);
  for(const t of TILLBEHOR){
    assert.ok(t.rita && t.name && t.ord && t.pris > 0, `${t.id} saknar bild, namn eller pris`);
    assert.ok(!THINGS[t.id] && BAS_SAKER.indexOf(t.id) === -1, `${t.id} krockar med en räknesak`);
  }
  assert.equal(new Set(hattpriser).size, hattpriser.length, "två hattar kostar lika mycket");
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
  /* Gånger har flyttat till sitt eget spår; kvar i Vagnhallen är talföljder och hälften */
  assert.ok(serier > 50 && halvor > 50 && ganger === 0,
    `fel blandning: talföljd ${serier}, gånger ${ganger}, hälften ${halvor}`);
});

test("banorna med hjälpbilder behåller dem, räknebanorna sina figurer", () => {
  for(const L of LEVELS){
    const q = buildRound(L, 10)[0];
    if(L.id <= 9 || REGIONS[L.r].name === "Stjärnhimlen") assert.ok(!q.utanHjalp, `${L.name} ska ha hjälpbilder`);
    else if(!REGIONS[L.r].sidospar) assert.ok(q.utanHjalp, `${L.name} ska sakna hjälpbilder`);
    else assert.equal(!!q.utanHjalp, !!L.utanHjalp, `${L.name} följer inte sin egen regel`);
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

test("gånger och delat: rätt tabeller, jämna delningar, eget spår som går att stänga av", () => {
  const banor = LEVELS.filter(L => L.spar === "ganger");
  assert.equal(banor.length, 6);
  assert.ok(!banor[0].utanHjalp && !banor[2].utanHjalp, "de första gånger- och delatbanorna ska ha bilder");
  for(const L of banor){
    for(let i = 0; i < 120; i++){
      for(const q of buildRound(L, 10)){
        assert.ok(q.answer >= 0 && q.answer <= L.max, `${q.kind} gav ${q.answer} på ${L.name}`);
        if(q.kind === "mul"){
          assert.equal(q.a * q.b, q.answer);
          if(L.tabeller) assert.ok(L.tabeller.includes(q.a), `${q.a}:ans tabell hör inte hemma på ${L.name}`);
        }
        if(q.kind === "div"){
          assert.equal(q.a, q.b * q.answer, `${q.a} / ${q.b} går inte jämnt ut`);
          assert.ok(q.answer >= 1 && q.answer <= 10);
          if(L.tabeller) assert.ok(L.tabeller.includes(q.b), `delat med ${q.b} hör inte hemma på ${L.name}`);
        }
        const alt = makeOptions(q, 4);
        assert.ok(alt.includes(q.answer)); assert.equal(new Set(alt).size, 4);
      }
    }
  }
  /* Spåret öppnas av Mästarprovet, och försvinner helt när det är avstängt */
  const p = { unlocked: 20, stars: { 15: 0 }, settings: { ganger: true } };
  assert.ok(arLast(p, levelById(GANGER_START)), "stängt tills Mästarprovet är klarat");
  p.stars[15] = 1;
  assert.equal(sidosparEfter(p, levelById(15)).id, GANGER_START);
  assert.ok(!arLast(p, levelById(GANGER_START)) && arLast(p, levelById(GANGER_START + 1)));
  assert.equal(oppnaEfter(p, levelById(GANGER_START)).id, GANGER_START + 1);
  assert.equal(synligaBanor(p).length, LEVELS.length);
  assert.equal(maxStars(p), LEVELS.length * 3);
  const av = { unlocked: 20, stars: { 15: 3 }, settings: { ganger: false } };
  assert.ok(arLast(av, levelById(GANGER_START)), "avstängt spår är låst");
  assert.equal(synligaBanor(av).length, LEVELS.length - 6);
  assert.equal(maxStars(av), (LEVELS.length - 6) * 3);
  assert.equal(sidosparEfter(av, levelById(15)), null);
});

test("sex rutor från Vagnhallen, två försök från Berget och en förklaring till varje felsvar", () => {
  for(const L of LEVELS){
    if(L.id >= 16 && L.id <= 27) assert.equal(L.opts, 6, `${L.name} ska ha sex rutor`);
    if(L.id <= 9) assert.equal(L.opts <= 4 && !L.utanHjalp, true, `${L.name} ska vara snäll`);
    for(let i = 0; i < 20; i++){
      for(const q of buildRound(L, 10)){
        const alt = makeOptions(q, L.opts);
        assert.equal(alt.length, L.opts);
        assert.ok(alt.includes(q.answer));
        assert.equal(new Set(alt).size, L.opts, `dubblett bland rutorna för ${q.kind}`);
        for(const d of distraktorer(q))
          assert.ok(d.v !== q.answer && d.v >= 0 && Number.isInteger(d.v) && d.varfor.length > 3, `${q.kind}: felsvar ${d.v} utan förklaring`);
        for(const v of alt) if(v !== q.answer) assert.ok(varforFel(q, v).length > 3, `${q.kind}: ${v} saknar förklaring`);
        /* I skrivläget kan vad som helst knappas in */
        assert.ok(varforFel(q, q.answer + 40).length > 3 && varforFel(q, q.answer + 1).length > 3);
        /* Provbanorna bestämmer själva antalet rutor */
        if(L.pool) assert.equal(q.opts, L.opts);
      }
    }
  }
  /* De vanligaste feltankarna får sina egna ord */
  assert.equal(varforFel({ kind:"add", a:7, b:5, answer:12 }, 2), "Det blev minus, inte plus!");
  assert.equal(varforFel({ kind:"sub", a:9, b:4, answer:5 }, 13), "Det blev plus, inte minus!");
  assert.equal(varforFel({ kind:"tiotal", tior:4, ental:7, count:47, answer:47 }, 74), "Tvärtom! Tiorna först.");
  assert.equal(varforFel({ kind:"mul", a:2, b:6, answer:12 }, 8), "Det blev plus, inte gånger!");
  assert.equal(varforFel({ kind:"saga", op:"sub", a:8, b:3, answer:5 }, 11), "Det blev plus, inte minus!");
  assert.equal(varforFel({ kind:"flera", tal:[12, 5, 29], answer:46 }, 17), "Sista talet glömdes bort!");
  assert.match(varforFel({ kind:"add", a:7, b:5, answer:12 }, 13), /för mycket/i);
  assert.match(varforFel({ kind:"add", a:7, b:5, answer:12 }, 3), /för lite/i);
  /* Hela tiotal får felsvar som också är hela tiotal, annars syns svaret på ändelsen */
  const tior = makeOptions({ kind:"add", a:30, b:40, answer:70 }, 6);
  assert.ok(tior.filter(v => v % 10 === 0).length >= 4, `hela tiotal: ${tior}`);
});

test("räknesagor räknar rätt, handlar om resan och följer banans tal", () => {
  const plats = { stopp:"Valand", ref:"5", mot:"Länsmansgården" };
  for(const L of LEVELS){
    for(let i = 0; i < 40; i++){
      const q = gorSaga(L, plats);
      assert.equal(q.kind, "saga");
      const facit = q.op === "add" ? q.a + q.b : q.op === "sub" ? q.a - q.b : q.op === "mul" ? q.a * q.b : q.a / q.b;
      assert.equal(q.answer, facit, `${q.text} → ${q.answer}`);
      assert.ok(q.answer >= 0 && Number.isInteger(q.answer));
      assert.ok(q.text.endsWith("?") && q.text.includes(String(q.a)) && q.text.includes(String(q.b)), q.text);
      assert.ok(/Valand|Länsmansgården|Linje 5|Vagnhallen/.test(q.text), q.text);
      if(L.spar === "ganger") assert.ok(["mul", "div"].includes(q.op), `${L.name}: ${q.op}`);
      else if(L.kinds.includes("count") || L.kinds.includes("tiotal")) assert.ok(Math.max(q.a, q.b, q.answer) <= 10, "räknebanorna får små sagor");
      else assert.ok(Math.max(q.a, q.answer) <= L.max, `${L.name}: ${q.text}`);
      assert.equal(q.niva, L.id);
      assert.equal(q.opts, L.opts);
      assert.equal(!!q.utanHjalp, !!L.utanHjalp);
      const alt = makeOptions(q, L.opts);
      assert.ok(alt.includes(q.answer));
      assert.equal(new Set(alt).size, L.opts);
    }
  }
  /* Sagan tar en plats i omgången, men aldrig kluringens */
  const queue = buildRound(levelById(4), 10);
  queue[3] = Object.assign({}, queue[3], { kluring:true });
  for(let i = 0; i < 30; i++){
    const kopia = queue.slice();
    blandaInSaga({}, levelById(4), kopia, plats);
    assert.equal(kopia.filter(q => q.kind === "saga").length, 1);
    assert.ok(kopia[3].kluring);
  }
});

test("kluringar sparas hos spelaren, kommer tillbaka på rätt spår och försvinner när de klaras", () => {
  const p = { unlocked: 14, stars: {}, skill: 11, kluriga: [] };
  const q = buildRound(levelById(10), 1)[0];
  assert.equal(q.niva, 10, "uppgiften vet vilken bana den kom från");
  laggKluring(p, q);
  assert.equal(p.kluriga.length, 1);
  assert.equal(p.kluriga[0].niva, 10);
  assert.ok(!("kluring" in p.kluriga[0]));
  laggKluring(p, q);   /* samma tal två gånger ger inte två kluringar */
  assert.equal(p.kluriga.length, 1);
  assert.equal(kluringarFor(p, levelById(12)).length, 1, "passar en svårare bana på samma spår");
  assert.equal(kluringarFor(p, levelById(5)).length, 0, "aldrig på en lättare bana");
  assert.equal(kluringarFor(p, levelById(28)).length, 0, "aldrig på ett annat spår");
  assert.equal(kluringarFor(p, { id:-1, kinds:[] }).length, 1, "Stigande tar den när nivån räcker");
  assert.equal(kluringarFor({ ...p, skill: 5 }, { id:-1, kinds:[] }).length, 0);
  assert.equal(kluringarFor(p, { id:0, pool:[10, 11, 12] }).length, 1, "Blandat tar den ur sina banor");
  assert.equal(kluringarFor(p, { id:0, pool:[4, 5, 6] }).length, 0);
  let insatt = 0;
  for(let i = 0; i < 60; i++){
    const queue = buildRound(levelById(12), 10);
    blandaInKluring(p, levelById(12), queue);
    const k = queue.findIndex(x => x.kluring);
    if(k >= 0){ insatt++; assert.ok(k > 0, "aldrig först i omgången"); assert.equal(queue[k].answer, q.answer); }
  }
  assert.ok(insatt > 10 && insatt < 60, `kluringen kom ${insatt} av 60 gånger`);
  kluringUtfall(p, q, false);
  assert.equal(p.kluriga.length, 1, "fel igen – ligger kvar");
  kluringUtfall(p, q, true);
  assert.equal(p.kluriga.length, 0, "klarad direkt – borta");
  assert.equal(p.kluringarKlarade, 1);
  /* Listan är kort: de senaste tjugo */
  for(let i = 0; i < 40; i++) laggKluring(p, { kind:"add", a:i, b:1, answer:i + 1, niva:10 });
  assert.equal(p.kluriga.length, 20);
  assert.equal(p.kluriga[19].a, 39);
});

test("uppdrag: nätet hänger ihop, målet ligger några hållplatser bort och tipset tar en närmare", () => {
  const dist = natAvstand("Brunnsparken");
  assert.equal(dist.size, ALLA_STOPP.length, "alla hållplatser ska gå att nå från Brunnsparken");
  assert.equal(dist.get("Brunnsparken"), 0);
  assert.equal(dist.get("Drottningtorget"), 1);
  /* Den som är ny får ett mål tre hållplatser bort, helst en med foto */
  const p = { uppdragKlara: 0, besokta: {} };
  const kand = [...natAvstand("Saltholmen")].filter(([, d]) => d === 3).map(([n]) => n);
  const helst = kand.filter(n => STOP_PHOTOS[n]);
  for(let i = 0; i < 40; i++){
    const u = valjUppdrag(p, "Saltholmen");
    assert.ok(u && u.hopp === 3 && u.beloning === 60 && kand.includes(u.mal), JSON.stringify(u));
    if(helst.length) assert.ok(helst.includes(u.mal), `${u.mal} har inget foto fast ${helst} har`);
  }
  const van = { uppdragKlara: 12, besokta: {} };
  const hopp = new Set();
  for(let i = 0; i < 80; i++){ const u = valjUppdrag(van, "Brunnsparken"); hopp.add(u.hopp); assert.ok(u.hopp >= 3 && u.hopp <= 8); }
  assert.ok(hopp.size > 2, "längre uppdrag efter hand");
  /* Tipset: sitt kvar, vänd eller byt – och det som föreslås tar en faktiskt närmare */
  let byten = 0, vand = 0, kvar = 0;
  for(let i = 0; i < 200; i++){
    const l = TRAM_LINES[i % TRAM_LINES.length];
    const at = Math.floor(Math.random() * l.stops.length);
    const pos = l.stops[at], rikt = Math.random() < 0.5 ? 1 : -1;
    const mal = ALLA_STOPP[Math.floor(Math.random() * ALLA_STOPP.length)];
    if(mal === pos) continue;
    const t = uppdragTips({ uppdrag:{ mal }, resa:{ pos, ref:l.ref, rikt } });
    assert.equal(t.kvar, natAvstand(mal).get(pos));
    assert.ok(t.val.some(a => a.narmare), `ingen vagn närmare ${mal} från ${pos}`);
    const samma = t.val.find(a => a.ref === l.ref && a.rikt === rikt);
    const motsatt = t.val.find(a => a.ref === l.ref && a.rikt !== rikt);
    if(t.text === "Sitt kvar!"){ kvar++; assert.ok(samma && samma.narmare); }
    else if(t.text.startsWith("Vänd")){ vand++; assert.ok(motsatt && motsatt.narmare && !(samma && samma.narmare)); }
    else {
      byten++;
      const m = t.text.match(/^Byt till linje (\S+) mot /);
      assert.ok(m, t.text);
      assert.ok(t.val.find(a => a.ref === m[1] && a.narmare && a.ref !== l.ref));
    }
  }
  assert.ok(byten > 0 && vand > 0 && kvar > 0, `byt ${byten}, vänd ${vand}, kvar ${kvar}`);
  assert.equal(uppdragTips({ uppdrag:{ mal:"Valand" }, resa:{ pos:"Valand", ref:"5", rikt:1 } }).kvar, 0);
});

test("Talraden: störst och minst, luckor och baklänges på ett eget spår som öppnas efter Skogen", () => {
  const banor = LEVELS.filter(L => L.spar === "talrad");
  assert.deepEqual(banor.map(L => L.id), [38, 39, 40, 41, 42]);
  assert.equal(TALRAD_START, 38); assert.equal(TALRAD_MAX, 42);
  assert.equal(REGIONS[9].spar, "talrad");
  const p = { unlocked: 5, stars: {}, best: {} };
  assert.ok(arLast(p, levelById(38)), "stängt innan Skogen är klar");
  assert.equal(sidosparEfter(p, levelById(6)), null, "utan stjärna på bana 6 öppnas inget");
  p.stars[6] = 1;
  assert.equal(sidosparEfter(p, levelById(6)).id, 38, "Skogen klar öppnar Talraden");
  assert.ok(!arLast(p, levelById(38)) && arLast(p, levelById(39)));
  assert.equal(oppnaEfter(p, levelById(38)).id, 39);
  assert.equal(oppnaEfter(p, levelById(38)), null, "bara den senast öppnade banan öppnar nästa");
  for(const id of [39, 40, 41]) assert.equal(oppnaEfter(p, levelById(id)).id, id + 1);
  assert.equal(oppnaEfter(p, levelById(42)), null);
  assert.equal(nastaBana(levelById(42)), null);
  assert.equal(nastaBana(levelById(41)).id, 42);
  assert.equal(p.unlocked, 5, "huvudspåret rörs inte");
  assert.equal(synligaBanor(p).length, LEVELS.length);
  /* Störst eller minst: lika många olika tal som rutor, och rutorna är talen */
  let omkastade = 0;
  for(let i = 0; i < 300; i++){
    const L = i % 2 ? levelById(38) : levelById(41);
    const q = MAKE.jamfor(L);
    assert.equal(q.tal.length, L.opts);
    assert.equal(new Set(q.tal).size, q.tal.length, "talen ska vara olika");
    assert.ok(Math.max(...q.tal) <= L.max && Math.min(...q.tal) >= 1);
    assert.equal(q.answer, q.storst ? Math.max(...q.tal) : Math.min(...q.tal));
    assert.deepEqual(makeOptions(q, L.opts).slice().sort((a, b) => a - b), q.tal.slice().sort((a, b) => a - b));
    if(L.id === 41 && q.tal.some(v => v >= 10 && v % 10 && q.tal.includes((v % 10) * 10 + Math.floor(v / 10)))) omkastade++;
    for(const v of q.tal) if(v !== q.answer) assert.match(varforFel(q, v), /större|mindre/);
  }
  assert.ok(omkastade > 30, `omkastade siffror ska dyka upp, kom ${omkastade} gånger av 150`);
  /* Luckan sitter mitt i raden, och Baklänges går nedåt */
  for(let i = 0; i < 200; i++){
    const q = MAKE.lucka(levelById(39));
    assert.ok(q.lucka === 1 || q.lucka === 2);
    assert.equal(q.answer, q.tal[q.lucka]);
    for(let k = 1; k < 4; k++) assert.equal(q.tal[k] - q.tal[k - 1], 1);
    assert.ok(q.tal[0] >= 1 && q.tal[3] <= 30);
    const b = MAKE.serie(levelById(40));
    assert.equal(b.steg, 1); assert.ok(!b.upp);
    assert.equal(b.answer, b.tal[2] - 1);
    assert.ok(b.answer >= 0 && b.tal[0] <= 30);
  }
  const ner = Array.from({ length: 60 }, () => MAKE.lucka(levelById(40)));
  assert.ok(ner.some(q => q.ner) && ner.some(q => !q.ner));
  assert.ok(ner.every(q => q.ner ? q.tal[0] > q.tal[1] : q.tal[0] < q.tal[1]));
  /* Sagorna på Talraden är vanliga plus- och minussagor */
  const s = gorSaga(levelById(41), { stopp:"Valand", ref:"5", mot:"Länsmansgården" });
  assert.ok(["add", "sub"].includes(s.op));
});

test("så går det: bokför per sort och per dag, trettio dagar bakåt, aldrig en timme i taget", () => {
  const p = { name:"Adam" };
  statSvar(p, { kind:"add", a:3, b:4, answer:7 }, "forsta", "2026-09-01");
  statSvar(p, { kind:"add", a:8, b:9, answer:17 }, "visat", "2026-09-01");
  statSvar(p, { kind:"saga", op:"sub", a:8, b:3, answer:5 }, "hjalp", "2026-09-02");
  statSvar(p, { kind:"double", a:4, b:4, answer:8 }, "forsta", "2026-09-02");
  assert.deepEqual(p.stat.sorter.add, { tal:2, forsta:1, visat:1 });
  assert.deepEqual(p.stat.sorter.saga, { tal:1, forsta:0, visat:0 });
  assert.deepEqual(p.stat.sorter.double, { tal:1, forsta:1, visat:0 });
  assert.deepEqual(p.stat.dagar["2026-09-01"], { tal:2, forsta:1, sek:0 });
  assert.deepEqual(p.stat.dagar["2026-09-02"], { tal:2, forsta:1, sek:0 });
  statTid(p, 90, "2026-09-02");
  statTid(p, 99999, "2026-09-02");
  assert.equal(p.stat.dagar["2026-09-02"].sek, 90 + 15 * 60, "en bortglömd flik räknas som högst en kvart");
  statTid(p, -5, "2026-09-02"); statTid(p, NaN, "2026-09-02");
  assert.equal(p.stat.dagar["2026-09-02"].sek, 90 + 15 * 60);
  for(let i = 1; i <= 40; i++) statTid(p, 10, "2026-07-" + String(i).padStart(2, "0"));
  assert.equal(Object.keys(p.stat.dagar).length, 30);
  assert.ok(p.stat.dagar["2026-09-02"] && p.stat.dagar["2026-09-01"], "de senaste dagarna finns kvar");
  assert.ok(!p.stat.dagar["2026-07-01"], "de äldsta rensas");
  assert.equal(datumNyckel(new Date(2026, 8, 2)), "2026-09-02");
});

test("småspelen: motorerna räknar poäng, tar slut i tid och klarar sig utan skärm", () => {
  assert.deepEqual(SMASPEL.map(v => v.id), ["race", "bil", "berg"]);
  assert.ok(SMASPEL.every(v => v.pris > 0 && v.hur.length > 20 && v.enhet));
  assert.ok(spelKopt({ spel:["race"] }, "race") && !spelKopt({ spel:[] }, "race") && !spelKopt(null, "race"));
  const tyst = () => {};
  const DT = 1 / 60;

  /* Spårvagnsracet: tre spår, tryck på ett spår eller stega med pilarna */
  const race = SPELMOTOR.race(LEK_W, LEK_H, tyst);
  assert.equal(race.s.spar, 1, "börjar i mitten");
  race.tap(10); assert.equal(race.s.spar, 0, "tryck till vänster: vänstra spåret");
  race.tap(LEK_W - 10); assert.equal(race.s.spar, 2, "tryck till höger: högra spåret, direkt");
  race.tap(); assert.equal(race.s.spar, 2, "ett tryck utan plats gör inget");
  race.styr(1); assert.equal(race.s.spar, 2, "aldrig utanför spåren");
  race.styr(-1); race.styr(-1); race.styr(-1); assert.equal(race.s.spar, 0);
  for(let i = 0; i < 40 * 60; i++){ if(i % 37 === 0) race.styr(i % 74 ? 1 : -1); race.update(DT); }
  assert.ok(race.poang() > 5, `racet gav bara ${race.poang()} passagerare`);
  const r2 = SPELMOTOR.race(LEK_W, LEK_H, tyst);
  r2.s.saker.push({ y: r2.s.y - 200, spar: 1, typ: "pass", farg: "#fff" });
  r2.s.saker.push({ y: r2.s.y - 200, spar: 0, typ: "stopp", farg: "#fff" });
  r2.s.nasta = 99;
  for(let i = 0; i < 90; i++) r2.update(DT);
  assert.equal(r2.poang(), 1, "passageraren på det egna spåret plockas upp");
  assert.equal(r2.s.brom, 0, "skylten på ett annat spår rör oss inte");
  const r3 = SPELMOTOR.race(LEK_W, LEK_H, tyst);
  r3.styr(-1);
  r3.s.saker.push({ y: r3.s.y - 200, spar: 0, typ: "stopp", farg: "#fff" });
  r3.s.nasta = 99;
  for(let i = 0; i < 90; i++) r3.update(DT);
  assert.ok(r3.s.brom > 0 || r3.s.oj > 0, "skylten på det egna spåret bromsar");
  assert.equal(r3.poang(), 0);
  /* Det finns alltid ett fritt spår: aldrig skyltar på alla tre samtidigt */
  const r4 = SPELMOTOR.race(LEK_W, LEK_H, tyst);
  for(let i = 0; i < 40 * 60; i++){
    r4.update(DT);
    const skyltar = r4.s.saker.filter(o => o.typ === "stopp" && !o.tagen && Math.abs(o.y - r4.s.y) < 40).map(o => o.spar);
    assert.ok(new Set(skyltar).size < 3, "tre skyltar i bredd");
  }

  /* Bilracet: tjuvstart ger noll, tryck på grönt ger poäng, fem starter sedan slut */
  const bil = SPELMOTOR.bil(LEK_W, LEK_H, tyst);
  bil.start();
  assert.equal(bil.s.heat, 1);
  bil.tap();
  assert.ok(bil.s.tjuv && bil.poang() === 0 && /Tjuvstart/.test(bil.s.text));
  for(let i = 0; i < 2 * 60; i++) bil.update(DT);
  assert.equal(bil.s.heat, 2, "efter tjuvstarten kommer nästa start av sig själv");
  /* vänta ut lamporna och grönt, tryck efter 0,3 s */
  let varv = 0;
  while(bil.s.fas !== "gront" && varv++ < 60 * 10) bil.update(DT);
  assert.equal(bil.s.fas, "gront");
  for(let i = 0; i < 18; i++) bil.update(DT);
  bil.tap();
  assert.ok(bil.poang() >= 80, `snabb reaktion ska ge mycket, gav ${bil.poang()}`);
  assert.match(bil.s.text, /snabb/i);
  /* resten av starterna: låt dem gå ut i tid */
  for(let i = 0; i < 60 * 40 && !bil.slut(); i++) bil.update(DT);
  assert.ok(bil.slut(), "fem starter och sedan slut");
  assert.equal(bil.s.heat, 5);
  assert.match(bil.status(), /5\/5/);

  /* Bergochdalbanan: vagnen följer rälsen, hoppar vid tryck och landar igen */
  const berg = SPELMOTOR.berg(LEK_W, LEK_H, tyst);
  berg.update(DT);
  assert.ok(Math.abs(berg.s.y - berg.bana(berg.s.x + 110)) < 0.01, "på rälsen");
  berg.tap();
  assert.ok(berg.s.luft && berg.s.vy < 0);
  berg.tap();   /* ett tryck i luften gör inget */
  let hoppTid = 0;
  while(berg.s.luft && hoppTid < 5){ berg.update(DT); hoppTid += DT; }
  assert.ok(!berg.s.luft && hoppTid > 0.3 && hoppTid < 2, `hoppet tog ${hoppTid.toFixed(2)} s`);
  let bast = 0;
  for(let k = 0; k < 5; k++){
    const b = SPELMOTOR.berg(LEK_W, LEK_H, tyst);
    for(let i = 0; i < 40 * 60; i++){ if(i % 45 === 0) b.tap(); b.update(DT); }
    bast = Math.max(bast, b.poang());
  }
  assert.ok(bast > 5, `bergochdalbanan gav bara ${bast} stjärnor`);
});

test("Tallinjen och Klockan: två nya sidospår, öppnade av Grottan och Blandat till 20", () => {
  assert.deepEqual(LEVELS.filter(L => L.spar === "linje").map(L => L.id), [43, 44, 45, 46, 47]);
  assert.deepEqual(LEVELS.filter(L => L.spar === "klocka").map(L => L.id), [48, 49, 50, 51, 52]);
  assert.equal(LINJE_START, 43); assert.equal(LINJE_MAX, 47); assert.equal(KLOCKA_START, 48); assert.equal(KLOCKA_MAX, 52);
  assert.equal(REGIONS[10].spar, "linje"); assert.equal(REGIONS[11].spar, "klocka");
  for(const spar of Object.keys(SPAR)){
    const s = SPAR[spar];
    assert.equal(levelById(s.start).spar, spar === "rakna" ? undefined : spar);
    const nasta = levelById(s.max + 1);
    assert.ok(!nasta || nasta.spar !== levelById(s.max).spar, spar + " slutar där nästa spår börjar");
    assert.ok(huvudspar(levelById(s.efter)), spar + " öppnas av en bana på huvudspåret");
  }
  const p = { unlocked: 9, stars: {}, best: {}, settings: {} };
  assert.ok(arLast(p, levelById(43)) && arLast(p, levelById(48)));
  assert.equal(sidosparEfter(p, levelById(9)), null);
  p.stars[9] = 1;
  assert.equal(sidosparEfter(p, levelById(9)).id, 43, "Grottan klar öppnar Tallinjen");
  assert.equal(linjeOppen(p), 43);
  assert.ok(!arLast(p, levelById(43)) && arLast(p, levelById(44)));
  for(const id of [43, 44, 45, 46]) assert.equal(oppnaEfter(p, levelById(id)).id, id + 1);
  assert.equal(oppnaEfter(p, levelById(47)), null);
  assert.equal(nastaBana(levelById(47)), null);
  assert.equal(nastaBana(levelById(46)).id, 47);
  p.stars[14] = 2;
  assert.equal(sidosparEfter(p, levelById(14)).id, 48, "Blandat till 20 öppnar Klockan");
  assert.equal(klockaOppen(p), 48);
  assert.equal(sidosparEfter(p, levelById(14)), null, "bara första gången");
  /* Klockan går att stänga av – då syns den inte och öppnas inte */
  const q = { unlocked: 15, stars: { 14: 1 }, best: {}, settings: { klocka: false } };
  assert.equal(klockaOppen(q), 0);
  assert.equal(sidosparEfter(q, levelById(14)), null);
  assert.ok(!synligaBanor(q).some(L => L.spar === "klocka"));
  assert.equal(synligaBanor(q).length, LEVELS.length - 5);
  assert.equal(maxStars({ settings: {} }), LEVELS.length * 3);
  assert.equal(p.unlocked, 9, "huvudspåret rörs inte");
  /* De gamla spåren fungerar som förut */
  const r = { unlocked: 13, stars: { 6:1, 12:1 }, best: {}, settings: {} };
  assert.equal(talradOppen(r), 38); assert.equal(sidoOppen(r), 28); assert.equal(gangerOppen(r), 0);
  assert.equal(sparOppen(r, "talrad"), 38);
});

test("Tallinjen: hopp framåt är plus, bakåt minus, och avståndet är antalet hopp", () => {
  for(let i = 0; i < 300; i++){
    const f = MAKE.linje(levelById(43));
    assert.ok(f.upp && f.answer === f.a + f.b && f.answer <= 20 && f.a >= 0 && f.b >= 1 && f.b <= 6, JSON.stringify(f));
    const b = MAKE.linje(levelById(44));
    assert.ok(!b.upp && b.answer === b.a - b.b && b.answer >= 0 && b.a <= 20, JSON.stringify(b));
    const h = MAKE.hopp(levelById(45));
    assert.equal(h.answer, Math.abs(h.b - h.a));
    assert.ok(h.answer >= 1 && h.answer <= 9 && Math.max(h.a, h.b) <= 20 && Math.min(h.a, h.b) >= 0);
    /* Felsvaren: åt andra hållet, ett hopp för långt eller kort */
    const d = distraktorer(f).map(x => x.v);
    assert.ok(f.a - f.b < 0 || d.includes(f.a - f.b), "åt andra hållet");
    assert.ok(d.includes(f.answer + 1) && (f.answer === 0 || d.includes(f.answer - 1)));
    assert.match(varforFel(h, h.answer + 1), /hopp/i);
    if(f.a - f.b >= 0) assert.match(varforFel(f, f.a - f.b), /andra hållet/);
    assert.match(varforFel(b, b.a + b.b), /andra hållet/);
  }
  const bada = Array.from({ length: 80 }, () => MAKE.linje(levelById(46)));
  assert.ok(bada.some(q => q.upp) && bada.some(q => !q.upp), "Fram och tillbaka går åt båda håll");
  /* Nyckeln skiljer på framåt och bakåt med samma tal */
  assert.notEqual(qNyckel({ kind:"linje", a:7, b:3, c:1 }), qNyckel({ kind:"linje", a:7, b:3, c:0 }));
});

test("hållplatsen som tallinje: framåt, bakåt och kvar på en riktig linje, med namn i rutorna", () => {
  const namn = TRAM_LINES.find(x => x.ref === "8").stops;
  for(let i = 0; i < 300; i++){
    const k = 1 + (i % (namn.length - 2));
    const h = hallFraga("hall", namn, k);
    if(h.kind === "hall"){
      assert.equal(h.answer, k + h.n); assert.ok(h.n >= 2 && h.n <= 6 && h.answer <= namn.length - 1);
      assert.equal(svarText(h), namn[h.answer]);
      const alt = makeOptions(h, 4);
      assert.equal(alt.length, 4); assert.equal(new Set(alt).size, 4);
      assert.ok(alt.includes(h.answer) && alt.every(v => v >= 0 && v <= namn.length - 1), "alla rutor är hållplatser på linjen");
      assert.match(varforFel(h, k), /står/);
    }
    const b = hallFraga("bak", namn, k);
    if(b.kind === "bak"){ assert.equal(b.answer, k - b.n); assert.ok(b.answer >= 0); assert.equal(svarText(b), namn[b.answer]); }
    const v = hallFraga("kvar", namn, k);
    assert.equal(v.kind, "kvar"); assert.equal(v.answer, v.mal - k);
    assert.ok(v.answer >= 1 && v.answer <= 8 && v.mal <= namn.length - 1, JSON.stringify({ k, mal:v.mal }));
    assert.equal(svarText(v), String(v.answer));
    assert.ok([h, b, v].every(q => q.fast), "resefrågor är fasta i omgången");
    assert.ok(!v.svarNamn && (h.kind !== "hall" || h.svarNamn) && (b.kind !== "bak" || b.svarNamn), "bara var-frågorna svaras med namn");
  }
  /* Vid första hållplatsen går det inte bakåt, vid näst sista inte framåt */
  assert.notEqual(hallFraga("bak", namn, 0).kind, "bak");
  assert.notEqual(hallFraga("hall", namn, namn.length - 2).kind, "hall");
  /* ... och de blir aldrig kluringar, för de hör till resan */
  const p = { kluriga: [] };
  laggKluring(p, Object.assign(hallFraga("hall", namn, 3), { niva: 43 }));
  assert.equal(p.kluriga.length, 0);
});

test("Klockan: hel och halv timme, urtavlor, digital tid och avgångstavlan", () => {
  assert.equal(tidOrd(tidKod(2, true)), "halv 3"); assert.equal(tidOrd(tidKod(14, true)), "halv 3");
  assert.equal(tidOrd(tidKod(11, true)), "halv 12"); assert.equal(tidOrd(tidKod(0, false)), "12");
  assert.equal(tidOrd(tidKod(23, true)), "halv 12"); assert.equal(tidOrd(tidKod(12, false)), "12");
  assert.equal(kodTid(29), "14:30"); assert.equal(kodTid(12), "06:00");
  assert.equal(timme12(0), 12); assert.equal(timme12(13), 1); assert.equal(timme12(-1), 11);
  assert.equal(vantetidOrd(30), "en halvtimme"); assert.equal(vantetidOrd(90), "en och en halv timme");
  for(let i = 0; i < 300; i++){
    const hel = MAKE.klocka(levelById(48));
    assert.ok(!hel.halv && hel.answer === timme12(hel.a) && hel.answer >= 1 && hel.answer <= 12);
    assert.equal(svarText(hel), String(hel.answer));
    const halv = MAKE.klocka(levelById(49));
    if(halv.halv){
      assert.equal(halv.answer, timme12(halv.a + 1)); assert.equal(svarText(halv), "halv " + halv.answer); assert.equal(halv.form, "halv");
      assert.match(varforFel(halv, timme12(halv.a)), /förbi/);
    }
    for(const q of [hel, halv]){ const alt = makeOptions(q, 4); assert.equal(new Set(alt).size, 4); assert.ok(alt.every(v => v >= 1 && v <= 12) && alt.includes(q.answer)); }
    const u = MAKE.urtavla(levelById(50));
    assert.ok(u.answer >= 0 && u.answer <= 23 && u.form === "urtavla");
    const alt = makeOptions(u, 4); assert.ok(alt.every(v => v >= 0 && v <= 23) && new Set(alt).size === 4 && alt.includes(u.answer));
    const d = MAKE.digital(levelById(51));
    assert.equal(d.answer, tidKod(d.a % 12, d.halv)); assert.ok(d.a >= 6 && d.a <= 21);
    assert.equal(svarText(d), tidOrd(d.answer));
    if(d.halv) assert.match(varforFel(d, (tidKod(d.a % 12, false) + 23) % 24), /på väg mot/);
    const v = MAKE.vanta(levelById(52));
    assert.ok([30, 60, 90, 120].includes(v.answer) && v.b - v.a === v.answer / 30);
    assert.deepEqual(makeOptions(v, 4).slice().sort((x, y) => x - y), [30, 60, 90, 120]);
    assert.equal(svarText(v), vantetidOrd(v.answer));
    const f = MAKE.forst(levelById(52));
    assert.equal(f.rader.length, 4);
    const forst = f.rader.reduce((a, r) => r.kod < a.kod ? r : a, f.rader[0]);
    assert.equal(f.answer, Number(forst.ref));
    assert.equal(new Set(f.rader.map(r => r.kod)).size, 4, "alla tider olika");
    assert.deepEqual(makeOptions(f, 4).slice().sort((x, y) => x - y), f.rader.map(r => Number(r.ref)).sort((x, y) => x - y));
    assert.equal(svarText(f), "linje " + f.answer);
  }
  /* 14:30 är halv tre – och felsvaren är de klassiska misstagen */
  const d = { kind:"digital", a:14, halv:true, answer:tidKod(2, true), form:"ord", lagst:0, hogst:23 };
  const fel = distraktorer(d);
  assert.ok(fel.some(x => x.v === tidKod(1, true)), "halv två finns som felsvar");
  assert.ok(fel.some(x => x.v === tidKod(2, false)) && fel.some(x => x.v === tidKod(3, false)));
  /* Tavlan i spårvagnen visar vagnar som verkligen går från hållplatsen */
  const har = avgangar("Brunnsparken");
  assert.ok(har.length >= 4);
  const v = tavlaHar(MAKE.vanta(levelById(52)), "Brunnsparken");
  assert.ok(har.some(a => a.ref === v.ref && a.mot === v.mot));
  const f = tavlaHar(MAKE.forst(levelById(52)), "Brunnsparken");
  assert.ok(f.rader.every(r => har.some(a => a.ref === r.ref && a.mot === r.mot)));
  assert.equal(f.answer, Number(f.rader.reduce((a, r) => r.kod < a.kod ? r : a, f.rader[0]).ref));
  assert.deepEqual(f.val.slice().sort(), f.rader.map(r => Number(r.ref)).sort());
});

test("vagnsnumren: varje märkt foto finns, numret är tresiffrigt och rutorna är siffrorna i andra ordningar", () => {
  const filer = new Set(Object.values(STOP_PHOTOS).map(f => f.f).concat(TRAM_PHOTOS.map(f => f.f)));
  assert.ok(Object.keys(VAGNAR).length >= 15);
  for(const [f, v] of Object.entries(VAGNAR)){
    assert.ok(filer.has(f), f + " är inte ett foto i spelet");
    assert.ok(existsSync(join(rot, "bilder", f + ".jpg")), f + ".jpg saknas");
    assert.ok(v.nr >= 100 && v.nr <= 999);
    assert.ok(v.x > 0 && v.x < 1 && v.y > 0 && v.y < 1 && v.w > 0 && v.w < 0.3 && v.h > 0 && v.h < 0.3);
    const q = vagnFragaFor(f);
    assert.equal(q.answer, v.nr); assert.ok(q.fast && q.opts === 6);
    const alt = makeOptions(q, 6);
    assert.equal(alt.length, 6); assert.equal(new Set(alt).size, 6); assert.ok(alt.includes(v.nr));
    const sif = String(v.nr).split("").sort().join("");
    const perm = alt.filter(a => String(a).split("").sort().join("") === sif);
    const olika = new Set(String(v.nr)).size;
    assert.ok(perm.length >= (olika === 3 ? 4 : 2), `rutorna för ${v.nr} ska mest vara omkastade siffror: ${alt}`);
    const bak = Number(String(v.nr).split("").reverse().join(""));
    if(bak !== v.nr) assert.match(varforFel(q, bak), /Tvärtom|ordning/);
  }
  assert.equal(vagnFragaFor("almedal"), null);
  const p = { kluriga: [] };
  laggKluring(p, Object.assign(vagnFragaFor("chalmers"), { niva: 5 }));
  assert.equal(p.kluriga.length, 0, "vagnsfrågan blir ingen kluring");
});

test("rösten: premium före förbättrad före nätröst före vanlig, och namnen städas", () => {
  const roster = [
    { name:"Alva", lang:"sv-SE", voiceURI:"com.apple.voice.compact.sv-SE.Alva", localService:true, default:true },
    { name:"Google svenska", lang:"sv-SE", voiceURI:"Google svenska", localService:false },
    { name:"Alva (Enhanced)", lang:"sv-SE", voiceURI:"com.apple.voice.enhanced.sv-SE.Alva", localService:true },
    { name:"Alva (Premium)", lang:"sv-SE", voiceURI:"com.apple.voice.premium.sv-SE.Alva", localService:true },
    { name:"Microsoft Sofie Online (Natural) - Swedish (Sweden)", lang:"sv-SE", voiceURI:"x", localService:false }
  ];
  assert.deepEqual(roster.map(rostPoang), [1, 2, 3, 4, 3]);
  assert.equal(bastaRost(roster).name, "Alva (Premium)");
  assert.equal(bastaRost(roster.slice(0, 2)).name, "Google svenska");
  assert.equal(bastaRost(roster.slice(0, 1)).name, "Alva");
  assert.equal(bastaRost([]), null);
  assert.equal(rostNamn(roster[4]), "Sofie Online (Natural)");
  assert.equal(rostNamn(roster[1]), "svenska");
  assert.equal(rostNamn(roster[3]), "Alva (Premium)");
});
