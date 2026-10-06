import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { TRAM_LINES, lineByRef, banaSomOppnar, oppnaEfter, sidosparEfter, besoktaAlla } from "./hamta.mjs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const fn = namn => {
  const start = html.indexOf(`function ${namn}(`);
  assert.ok(start >= 0, namn);
  return html.slice(start, html.indexOf("\n}", start) + 2);
};
const ren = v => JSON.parse(JSON.stringify(v));
const kart = vm.createContext({});
vm.runInContext(html.match(/const STOP_XY = \{[\s\S]*?\n\};/)[0] + "\n" +
  html.match(/const HELA_NATET = [^\n]*/)[0] + "\n" + fn("natFonster") + "\n" + fn("kartReseLage"), kart);

test("vagnen förflyttas till rätt hållplats i båda riktningar på varje linje", () => {
  for(const l of TRAM_LINES) for(let i = 0; i < l.stops.length - 1; i++){
    const fram = ren(kart.kartReseLage(l, i, i + 1, 1, false));
    const bak = ren(kart.kartReseLage(l, i + 1, i, 0, false));
    assert.equal(fram.x, bak.x); assert.equal(fram.y, bak.y);
    const borjan = ren(kart.kartReseLage(l, i, i + 1, 0, false));
    const slut = ren(kart.kartReseLage(l, i + 1, i, 1, false));
    assert.equal(borjan.x, slut.x); assert.equal(borjan.y, slut.y);
    const mitt = kart.kartReseLage(l, i, i + 1, .5, false);
    assert.equal(mitt.x, (borjan.x + fram.x) / 2);
    assert.equal(mitt.y, (borjan.y + fram.y) / 2);
    assert.deepEqual(ren(kart.kartReseLage(l, i, i + 1, -1, false)), borjan);
    assert.deepEqual(ren(kart.kartReseLage(l, i, i + 1, 2, false)), fram);
  }
});

test("hela nätet förblir utzoomat under hela resan", () => {
  const l = lineByRef("11");
  for(const t of [0,.25,.5,.75,1]) for(const [fran,till] of [[0,1],[1,0]])
    assert.deepEqual(ren(kart.kartReseLage(l, fran, till, t, true).fonster), {x:-65,y:-65,w:1180,h:1180});
});

test("närbildens blick följer färdriktningen även när barnet vänder", () => {
  const c = vm.createContext({STOP_XY:{A:[0,0],B:[100,0],C:[200,0]}});
  vm.runInContext(fn("natFonster"), c);
  const l = {stops:["A","B","C"]};
  const fram = c.natFonster(l,1,1), bak = c.natFonster(l,1,-1);
  assert.equal(fram.x + fram.w / 2, 130);
  assert.equal(bak.x + bak.w / 2, 70);
});

test("kartans nästa sträcka följer riktningen och saknas vid ändstationen", () => {
  kart.TRAM_LINES = TRAM_LINES; kart.INK = "#2E1A66";
  kart.ljusFarg = () => false; kart.natLinjePath = () => "M0 0L1 1";
  vm.runInContext(html.match(/const viewBoxStr = [^\n]*/)[0] + "\n" + fn("natkartaSVG"),kart);
  const l = lineByRef("11");
  const fram = kart.natkartaSVG(l,0,{rikt:1}), bak = kart.natkartaSVG(l,1,{rikt:-1});
  assert.match(fram,/class="nat-etapp" d="M30 895L41 854"/);
  assert.match(bak,/class="nat-etapp" d="M41 854L30 895"/);
  assert.match(fram,/id="natHar"/);
  const slut = kart.natkartaSVG(l,0,{rikt:-1});
  assert.ok(!slut.includes('class="nat-etapp"'));
  assert.ok(!slut.includes("gul sträcka = nästa hållplats"));
  const helt = kart.natkartaSVG(l,1,{rikt:-1,utzoomad:true});
  const text = helt.match(/class="nat-namn har" x="([^"]+)"/);
  assert.ok(Number(text[1]) >= -65,"hållplatsnamnet klipps inte vid vänsterkanten");
});

function reseMotor(rikt = 1, resmal = false){
  const calls = [], l = lineByRef("11"), p = {id:"prov", coins:50, unlocked:1, stars:{}, tramLevel:1,
    resa:{ref:l.ref,pos:l.stops[rikt === 1 ? 0 : 1],rikt}, besokta:{}};
  if(resmal) p.uppdrag = {mal:l.stops[1],beloning:30};
  const g = {queue:Array.from({length:5},()=>({kind:"count"})),results:Array(5).fill("first"),level:{id:1},len:5,score:50,nyaKort:["521"]};
  const c = vm.createContext({g,lineByRef,oppnaEfter,sidosparEfter,banaSomOppnar,besoktaAlla,
    riktOrdning:(l,r) => r === 1 ? l.stops.slice() : l.stops.slice().reverse(),
    besoktaPa:(p,ref) => p.besokta[ref] || [],linjeKlar:()=>false,
    newBadges:()=>["provmarke"],justeraSkill:()=>calls.push("skill"),
    saveProfiles:()=>calls.push("spara"),openTrip:a=>calls.push(["trip",a]),SFX:{win:()=>calls.push("ljud")}});
  vm.runInContext(html.match(/const matteFraga = [^\n]*/)[0] + "\n" + fn("matteResultat") + "\n" + fn("resLage") + "\n" + fn("finishTramStop"),c);
  return {c,p,g,calls,l};
}

test("färdig hållplats sparar progression och återvänder direkt till kartresan", () => {
  for(const rikt of [1,-1]){
    const {c,p,calls,l} = reseMotor(rikt);
    c.finishTramStop(p,5);
    assert.equal(p.resa.pos,l.stops[rikt === 1 ? 1 : 0]);
    assert.equal(p.unlocked,2); assert.equal(p.stopsRidden,1); assert.equal(p.tramPerfect,1);
    assert.deepEqual(ren(p.besokta[l.ref]).sort(), l.stops.slice(0,2).sort());
    assert.deepEqual(calls,["spara",["trip",true],"ljud"]);
    assert.equal(c.reseBeloning.mynt,50);
    assert.deepEqual(ren(c.reseBeloning.kort),["521"]);
    assert.deepEqual(ren(c.reseBeloning.marken),["provmarke"]);
    assert.equal(p.uppdrag,undefined,"fri resa skapar inget automatiskt resmål");
  }
});

test("resmålets belöning bevaras utan att ett nytt mål tvingas på barnet", () => {
  const {c,p} = reseMotor(1,true);
  c.finishTramStop(p,5);
  assert.equal(p.coins,80); assert.equal(p.uppdrag,null); assert.equal(p.uppdragKlara,1);
  assert.equal(c.reseBeloning.resmal.beloning,30);
});

test("sena kartbilder kan inte slutföra en resa efter att skärmen lämnats", () => {
  let frame, klar = 0, skrivet = 0, avbrutet = 0;
  const c = vm.createContext({kartAnimation:0,kartRaf:null,natUtzoomad:false,aktivSkarm:"trip",
    el:id=>id === "natSvg" ? {isConnected:true,setAttribute(){skrivet++;}} : {setAttribute(){skrivet++;}},
    performance:{now:()=>0},requestAnimationFrame:f=>{frame=f;return 1;},cancelAnimationFrame:()=>avbrutet++,
    kartReseLage:()=>({x:1,y:2,fonster:{}}),viewBoxStr:()=>"0 0 10 10"});
  vm.runInContext(fn("stoppaKartAnimation") + "\n" + fn("animeraNatkarta"),c);
  c.animeraNatkarta({},0,1,2400,()=>klar++);
  const gammal = frame;
  c.stoppaKartAnimation(); gammal(2400);
  assert.equal(klar,0); assert.equal(skrivet,0); assert.equal(avbrutet,1);
  c.animeraNatkarta({},0,1,2400,()=>klar++);
  c.aktivSkarm = "lines"; frame(2400);
  assert.equal(klar,0); assert.equal(skrivet,0);
  c.aktivSkarm = "trip";
  c.animeraNatkarta({},0,1,2400,()=>klar++); frame(2400);
  assert.equal(klar,1); assert.equal(skrivet,2);
});

test("resevyn placerar kartan och åk-knappen före sidoval och belöningar", () => {
  const trip = html.slice(html.indexOf('<section id="screen-trip"'),html.indexOf('<section id="screen-game"'));
  const ids = ["tripStatus","natkarta","goBtn","reseBeloning","uppdrag","hallplatsBild","allaStopp"].map(id=>trip.indexOf(`id="${id}"`));
  assert.ok(ids.every(i=>i >= 0));
  assert.deepEqual(ids,ids.slice().sort((a,b)=>a-b));
  assert.ok(!html.includes('id="resa"'),"ingen fristående resescen täcker kartan");
  const start = fn("renderStart");
  assert.ok(start.includes("data-borja-aka") && start.includes("data-fortsatt"));
  assert.ok(!start.includes("data-utflykt") && !start.includes("data-quiz"));
});
