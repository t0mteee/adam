import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { buildRound, laggKluring, speechFor, granskaKopia, LEVELS, levelById, SHOWN, standardVagn } from "./hamta.mjs";
import { skapaUtflykt, utflyktHandling } from "../utflykt.mjs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const fn = namn => {
  const start = html.indexOf(`function ${namn}(`);
  assert.ok(start >= 0, namn);
  return html.slice(start, html.indexOf("\n}", start) + 2);
};
const ren = v => JSON.parse(JSON.stringify(v));
const ctx = vm.createContext({ SHOWN, levelById, standardVagn });
vm.runInContext(fn("lagaKluring") + "\n" + html.match(/const matteFraga = [^\n]*/)[0] + "\n" + fn("matteResultat") + "\n" + fn("belonaUtflykt"), ctx);

test("alla sparbara frågetyper behåller frågan och facit efter JSON-laddning", () => {
  const sorter = new Set();
  for(const L of LEVELS.filter(L => L.id > 0)){
    for(let i = 0; i < 12; i++) for(const q of buildRound(L, 10)){
      if(q.fast) continue;
      const p = { kluriga:[] }; laggKluring(p, q);
      assert.equal(p.kluriga.length, 1, q.kind);
      const laddad = ren(p.kluriga[0]);
      assert.equal(speechFor(laddad), speechFor(q), q.kind);
      assert.equal(laddad.answer, q.answer);
      for(const k of ["storst", "lucka", "ner", "tal", "rader", "halv", "form"])
        if(q[k] !== undefined) assert.deepEqual(laddad[k], ren(q[k]), `${q.kind}:${k}`);
      sorter.add(q.kind);
    }
  }
  assert.ok(sorter.has("jamfor") && sorter.has("lucka") && sorter.has("forst"));
});

test("gamla Kluringar repareras när betydelsen kan återställas", () => {
  const q = { kind:"jamfor", niva:38, tal:[3,8,5,6], answer:8 };
  const reparerad = ctx.lagaKluring(q);
  assert.equal(reparerad.storst, true);
  assert.match(speechFor(reparerad), /störst/);
  assert.equal(ctx.lagaKluring({ ...q, answer:5 }), null);
  const lucka = ctx.lagaKluring({ kind:"lucka", niva:39, tal:[11,12,13,14], c:1, answer:12 });
  assert.equal(lucka.lucka, 1);
  assert.match(speechFor(lucka), /11, hmm, 13/);
  assert.equal(ctx.lagaKluring({ kind:"lucka", niva:39, tal:[11,12,13,14], answer:12 }), null);
  assert.equal(q.storst, undefined, "reparationen muterar inte originalet");
});

test("sparad avgångstavla delar inte radobjekt med frågan", () => {
  const q = buildRound(levelById(52), 30).find(q => q.kind === "forst");
  const p = { kluriga:[] }; laggKluring(p, q);
  const fore = p.kluriga[0].rader[0].mot;
  q.rader[0].mot = "Ändrat";
  assert.equal(p.kluriga[0].rader[0].mot, fore);
});

function svarMotor(){
  const calls = [], lyssnare = {};
  let display = null;
  const p = { coins:0, settings:{}, unlocked:10, skill:5 };
  const node = { classList:{add(){}}, getBoundingClientRect:() => ({ left:0, top:0, width:1, height:1 }), querySelectorAll:() => [], querySelector:() => null };
  const g = { q:{kind:"count",count:5,answer:5,utanHjalp:true}, level:{id:-1}, tram:"1", mode:"choice", locked:false, tries:0, streak:2, firstTry:2, bestStreak:2, score:20, results:[], qIndex:2, thing:"apple" };
  const c = vm.createContext({ g, P:() => p, SFX:{wrong(){},correct(){},coin(){}}, varforFel:() => "Försök igen!", speak:text => calls.push({sort:"tal",text}), setBuddy(){}, paintQuestion(){}, scenTips:() => "", escapeHtml:String, laggKluring(){}, kluringUtfall(){}, statSvar(){}, saveProfiles(){}, el:id => id === "display" ? display : null, updateDisplay(){}, visaFacit:() => "5", SCEN:new Set(), answerArea:node, feedback:{innerHTML:"",addEventListener:(namn,fn) => lyssnare[namn] = fn}, qVisual:node, buddy:node, confetti(){}, PRAISE:["Bra"], pick:a => a[0], bumpCoins(){}, later:(fn,ms) => calls.push({sort:"timer",ms,fn}), nextQuestion:() => calls.push({sort:"nasta"}), tystna(){}, aktivSkarm:"game", justeraSkill:(p,x) => calls.push({sort:"skill",x}) });
  vm.runInContext(html.match(/const matteFraga = [^\n]*/)[0] + "\n" + fn("answer") + "\n" + html.match(/feedback.addEventListener\("click", e => \{[\s\S]*?\n\}\);/)[0], c);
  return { c, g, calls, lyssnare, visaDisplay:() => { display = node; } };
}

test("missad fråga bryter sviten och facit väntar på barnets nästa-klick", () => {
  const {c,g,calls,lyssnare} = svarMotor();
  c.answer(0, null); c.answer(1, null);
  assert.equal(g.streak, 0);
  assert.ok(c.feedback.innerHTML.includes("data-next-question"));
  assert.ok(!calls.some(x => x.sort === "timer"), "inget automatiskt byte kapar förklaringen");
  lyssnare.click({target:{closest:() => ({})}});
  assert.equal(g.qIndex, 3);
  assert.equal(calls.filter(x => x.sort === "nasta").length, 1);
  g.locked = false; g.tries = 0;
  c.answer(5, null);
  assert.equal(g.streak, 1);
  assert.equal(g.score, 30, "ingen falsk dubbelbonus");
});

test("foto- och vagnbonusar ändrar inte matteförmågan vid rätt eller fel", () => {
  for(const kind of ["fotobild", "fotonamn", "vagn"]){
    const {c,g,calls} = svarMotor();
    g.q = {kind,answer:1,utanHjalp:true}; g.nyaKort = [];
    c.VAGNNAMN = {}; c.vagnkortFor = () => null;
    c.answer(1, null);
    assert.ok(!calls.some(x => x.sort === "skill"));
    g.locked = false; g.tries = 0;
    c.answer(2, null); c.answer(3, null);
    assert.ok(!calls.some(x => x.sort === "skill"));
  }
  const {c,calls} = svarMotor(); c.answer(5, null);
  assert.ok(calls.some(x => x.sort === "skill" && x.x === "ratt"));
});

test("sena suddningstimers rör varken visat facit eller nästa fråga", () => {
  const {c,g,calls,visaDisplay} = svarMotor();
  visaDisplay(); g.mode = "type"; g.typed = "9";
  c.answer(9, null);
  const sudda = calls.find(x => x.sort === "timer").fn;
  c.answer(9, null); assert.equal(g.typed, "5");
  sudda(); assert.equal(g.typed, "5", "facit ligger kvar");
  g.q = {kind:"count",count:2,answer:2}; g.locked = false; g.typed = "2";
  sudda(); assert.equal(g.typed, "2", "nästa svar ligger kvar");
});

test("upplåsning och perfektbonus bygger bara på mattefrågorna", () => {
  const queue = [{kind:"count"},{kind:"add"},{kind:"sub"},{kind:"fotobild"},{kind:"vagn"}];
  assert.deepEqual(ren(ctx.matteResultat(queue, ["first","first","first","help","help"])), {antal:3,ratt:3,perfekt:true,oppnar:true});
  assert.equal(ctx.matteResultat(queue, ["first","help","first","first","first"]).oppnar, false);
  assert.equal(ctx.matteResultat([{kind:"fotobild"}], ["first"]).oppnar, false);
});

test("backup avvisar trasiga typer och orimliga nivåer utan att mutera indata", () => {
  const giltig = {raknelandet:1,version:"36",profiles:[{id:"p",name:"Test",coins:5,stars:{1:3},badges:[],settings:{rate:1,rost:null,rorelse:"auto"},vagn:{typ:"M33",nr:503,linje:"6",mot:"b",utflyktstjarna:true}}]};
  assert.equal(granskaKopia(giltig), giltig);
  for(const fel of [{badges:"broken"},{stars:[]},{coins:-100},{unlocked:10000},{settings:{rate:3}},{stat:{sorter:[]}},{resa:{pos:"<img>",ref:"6",rikt:1}}]){
    const kopia = {...giltig,profiles:[{...giltig.profiles[0],...fel}]}, fore = JSON.stringify(kopia);
    assert.equal(granskaKopia(kopia), null, JSON.stringify(fel));
    assert.equal(JSON.stringify(kopia), fore);
  }
  assert.equal(granskaKopia({...giltig,version:"999"}), null);
  assert.equal(granskaKopia({...giltig,profiles:[giltig.profiles[0],giltig.profiles[0]]}), null);
  const forgiftad = JSON.parse('{"raknelandet":1,"profiles":[{"id":"p","name":"Test","settings":{"__proto__":{}}}]}');
  assert.equal(granskaKopia(forgiftad), null);
});

test("utflykter i båda talnivåerna har sammanhängande och rimliga uppgifter", () => {
  for(const lage of ["liten", "stor"]) for(let i = 0; i < 200; i++){
    const s = skapaUtflykt(lage);
    assert.equal(s.steg.length, 3);
    for(const q of s.steg){ assert.equal(q.innan + q.fler, q.mal); assert.ok(q.fler > 0); assert.ok(q.mal <= (lage === "liten" ? 9 : 16)); }
    assert.equal(s.steg[0].mal, s.steg[1].mal, "samma passagerare får biljetter");
  }
});

test("utflyktens fel, hjälp, ångra och nästa är säkra och utan straff", () => {
  let s = skapaUtflykt("liten", () => 0), fore = ren(s);
  s = utflyktHandling(s, "minus"); assert.deepEqual(s, fore);
  s = utflyktHandling(s, "kolla"); assert.equal(s.status, "spela"); assert.match(s.meddelande, /Nästan/);
  s = utflyktHandling(s, "nasta"); assert.equal(s.index, 0);
  s = utflyktHandling(s, "hjalp"); assert.ok(s.hjalp);
  for(let i = 0; i < 3; i++){
    while(s.antal < s.steg[s.index].mal) s = utflyktHandling(s, "plus");
    s = utflyktHandling(s, "kolla"); assert.equal(s.status, "lost");
    const lost = s; assert.equal(utflyktHandling(s, "plus"), lost);
    s = utflyktHandling(s, "nasta");
  }
  assert.equal(s.status, "klar");
  assert.equal(utflyktHandling(s, "nasta"), s, "ett färdigt äventyr är terminalt");
  assert.deepEqual(fore, skapaUtflykt("liten", () => 0), "ursprungsstaten muteras inte");
});

test("utflyktens belöning sparas på vagnen och delas inte ut igen", () => {
  const p = {coins:5};
  assert.equal(ctx.belonaUtflykt(p).first, true);
  assert.equal(p.coins, 35); assert.equal(p.vagn.utflyktstjarna, true);
  const laddad = ren(p);
  assert.equal(ctx.belonaUtflykt(laddad).first, false);
  assert.equal(laddad.coins, 35); assert.equal(laddad.utflykter, 2);
});
