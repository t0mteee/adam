/* Utflyktens regler är separata från vyerna och kan testas utan webbläsare. */
export function skapaUtflykt(lage = "liten", slump = Math.random){
  const tal = (a, b) => a + Math.min(b - a, Math.max(0, Math.floor(slump() * (b - a + 1))));
  const stor = lage === "stor";
  const innan = stor ? tal(5, 9) : tal(2, 4), pa = stor ? tal(3, 6) : tal(2, 3);
  const resenarer = innan + pa, biljetter = tal(1, Math.max(1, resenarer - 2));
  const rals = stor ? tal(6, 10) : tal(3, 5), saknas = stor ? tal(3, 6) : tal(2, 4);
  const steg = [
    { sort:"passagerare", plats:"Depån", innan, mal:resenarer, fler:pa,
      rubrik:"Alla ska få följa med!", fraga:`${innan} kompisar sitter i vagnen. Släpp på ${pa} till. Hur många åker sedan?`,
      handling:"Släpp på en kompis", klart:"Klara för avgång?", vinst:"Alla är ombord. Nu åker vi till biljettkiosken!" },
    { sort:"biljetter", plats:"Biljettkiosken", innan:biljetter, mal:resenarer, fler:resenarer - biljetter,
      rubrik:"En biljett till varje kompis", fraga:`${resenarer} kompisar behöver varsin biljett. ${biljetter} är klara. Hur många fler behövs?`,
      handling:"Stämpla en biljett", klart:"Har alla en biljett?", vinst:"En biljett var! Nästa stopp är utflyktsbron." },
    { sort:"rals", plats:"Utflyktsbron", innan:rals, mal:rals + saknas, fler:saknas,
      rubrik:"Vi lagar vägen tillsammans", fraga:`Bron behöver ${rals + saknas} rälsbitar. ${rals} finns redan. Hur många saknas?`,
      handling:"Lägg en rälsbit", klart:"Är bron klar?", vinst:"Bron är hel och vagnen kan köra över. Utflykten är räddad!" }
  ];
  return { steg, index:0, antal:innan, status:"spela", hjalp:false, meddelande:"" };
}

export function utflyktHandling(s, handling){
  if(s.status === "klar") return s;
  const q = s.steg[s.index];
  if(handling === "nasta" && s.status === "lost"){
    const index = s.index + 1;
    return index === s.steg.length ? { ...s, status:"klar" }
      : { ...s, index, antal:s.steg[index].innan, status:"spela", hjalp:false, meddelande:"" };
  }
  if(s.status !== "spela") return s;
  if(handling === "plus") return { ...s, antal:Math.min(q.mal + 2, s.antal + 1), meddelande:"" };
  if(handling === "minus") return { ...s, antal:Math.max(q.innan, s.antal - 1), meddelande:"" };
  if(handling === "hjalp") return { ...s, hjalp:true, meddelande:`Börja med ${q.innan}. Lägg till ${q.fler}, så blir det ${q.mal}. Du kan räkna fem platser i varje rad.` };
  if(handling === "kolla"){
    if(s.antal === q.mal) return { ...s, status:"lost", meddelande:q.vinst };
    const skillnad = q.mal - s.antal;
    return { ...s, hjalp:true, meddelande:skillnad > 0
      ? `Nästan! Vi har ${s.antal} och behöver ${q.mal}. Lägg till ${skillnad} till.`
      : `Det blev ${-skillnad} för många. Tryck Ångra en, så hjälps vi åt.` };
  }
  return s;
}

const person = (farg) => `<svg viewBox="0 0 36 44" aria-hidden="true"><circle cx="18" cy="11" r="8" fill="#FFE2C5" stroke="#2E1A66" stroke-width="2.5"/><path d="M6 39V28a12 12 0 0 1 24 0v11" fill="${farg}" stroke="#2E1A66" stroke-width="2.5"/><circle cx="15" cy="10" r="1"/><circle cx="21" cy="10" r="1"/><path d="M15 14q3 3 6 0" fill="none" stroke="#2E1A66" stroke-width="1.5"/></svg>`;
const biljett = `<svg viewBox="0 0 44 32" aria-hidden="true"><path d="M4 4h36v8a4 4 0 0 0 0 8v8H4v-8a4 4 0 0 0 0-8z" fill="#FFC42E" stroke="#2E1A66" stroke-width="2.5"/><path d="m14 16 5 5 11-11" fill="none" stroke="#2E1A66" stroke-width="3" stroke-linecap="round"/></svg>`;

function scen(s, vagn){
  const q = s.steg[s.index], storlek = Math.ceil((q.mal + 2) / 5) * 5;
  const celler = Array.from({ length:storlek }, (_, i) => {
    const fylld = i < s.antal;
    const bild = q.sort === "passagerare" ? person(i < q.innan ? "#62CDF2" : "#FF8AD0")
      : q.sort === "biljetter" ? biljett : `<span class="utf-ralsbit"></span>`;
    return `<span class="utf-cell ${fylld ? "fylld" : "tom"} ${i >= q.mal ? "extra" : ""}" aria-hidden="true">${fylld ? bild : ""}</span>`;
  }).join("");
  const ord = q.sort === "passagerare" ? "kompisar ombord" : q.sort === "biljetter" ? "biljetter klara" : "rälsbitar på plats";
  return `<div class="utf-scen ${q.sort} ${s.status === "lost" ? "lost" : ""}">
    <div class="utf-skylt">${q.plats}</div><div class="utf-vagn">${vagn()}</div>
    <div class="utf-celler" role="img" aria-label="${s.antal} ${ord}, grupperade fem i varje rad">${celler}</div>
    <p class="utf-antal">${s.antal} ${ord}</p>
  </div>`;
}

export function startUtflykt(rot, { vagn, kompis, sag, ljud, belona, lamna }){
  let state = null, lage = "liten", beloning = null, avslutad = false;
  const intro = () => {
    rot.innerHTML = `<div class="utf-top"><button class="btn utf-back" data-utf="hem">Till menyn</button><span>Kort äventyr · utan tidspress</span></div>
      <div class="panel utf-panel"><p class="utf-kicker">Ditt första uppdrag som konduktör</p><h1 tabindex="-1">Konduktörens utflykt</h1>
      <p>Kompisarna vill åka på utflykt. Släpp på dem, ordna biljetter och laga bron!</p>
      <div class="utf-hero"><div>${vagn()}</div><span>${kompis()}</span></div>
      <ol class="utf-plan"><li>Kompisar ombord</li><li>Biljetter till alla</li><li>En hel bro</li></ol>
      <p class="utf-kicker">Välj tal som känns lagom</p><div class="utf-val"><button class="btn" data-utf="liten" aria-pressed="${lage === "liten"}">Små tal</button><button class="btn" data-utf="stor" aria-pressed="${lage === "stor"}">Lite större tal</button></div>
      <button class="btn btn-big utf-primary" data-utf="borja">Börja utflykten!</button>
      <p class="utf-note">Första utflykten ger en guldstjärna på din vagn och 30 mynt. Du kan få hjälp och försöka igen hur många gånger du vill.</p></div>`;
  };
  const render = (flyttaFokus = false) => {
    if(!state){ intro(); return; }
    if(state.status === "klar"){
      rot.innerHTML = `<div class="panel utf-panel utf-slut"><p class="utf-kicker">Du hjälpte hela gänget!</p><h1 tabindex="-1">Utflykten är räddad!</h1><div class="utf-hero"><div>${vagn()}</div><span>${kompis()}</span></div>
      <p>Alla kompisar kom med, fick biljetter och kom över bron.</p><p class="utf-beloning">${beloning.first ? "Guldstjärnan sitter nu på din egen vagn. +30 mynt!" : "Din guldstjärna är kvar på vagnen. Tack för ännu en fin utflykt!"}</p>
      <button class="btn btn-big utf-primary" data-utf="hem">Till menyn</button><button class="btn" data-utf="igen">Gör en ny utflykt</button></div>`;
    }else{
      const q = state.steg[state.index], lost = state.status === "lost";
      const ekvation = q.sort === "passagerare" ? `${q.innan} + ${q.fler} = ${lost ? q.mal : "?"}` : `${q.innan} + ${lost ? q.fler : "?"} = ${q.mal}`;
      rot.innerHTML = `<div class="utf-top"><button class="btn utf-back" data-utf="hem">Till menyn</button><span>Stopp ${state.index + 1} av 3</span></div>
      <ol class="utf-rutt" aria-label="Utflyktens hållplatser">${state.steg.map((x,i) => `<li ${i === state.index ? 'aria-current="step"' : ""} class="${i < state.index ? "klar" : ""}">${i + 1}<span>${x.plats}</span></li>`).join("")}</ol>
      <div class="panel utf-panel utf-work"><h1 tabindex="-1">${q.rubrik}</h1><p class="utf-fraga">${q.fraga}</p>
      <button class="btn utf-lyssna" data-utf="lyssna">Hör uppdraget</button>${scen(state, vagn)}
      <div class="utf-matte">${ekvation}</div>
      <div class="utf-feedback ${lost ? "bra" : ""}" role="status">${state.meddelande || "Tryck på knappen och se vad som händer i scenen."}</div>
      ${lost ? `<button class="btn btn-big utf-primary" data-utf="nasta">${state.index === 2 ? "Åk över bron!" : "Åk till nästa stopp!"}</button>`
        : `<div class="utf-actions"><button class="btn utf-primary" data-utf="plus" ${state.antal >= q.mal + 2 ? "disabled" : ""}>${q.handling}</button><button class="btn" data-utf="minus" ${state.antal <= q.innan ? "disabled" : ""}>Ångra en</button><button class="btn utf-check" data-utf="kolla">${q.klart}</button></div><button class="btn utf-help" data-utf="hjalp">Visa hur jag kan tänka</button>`}</div>`;
    }
    if(flyttaFokus){ window.scrollTo({top:0,behavior:"auto"}); rot.querySelector("h1").focus({ preventScroll:true }); }
  };
  const klick = e => {
    const knapp = e.target.closest("[data-utf]"); if(!knapp || avslutad) return;
    const h = knapp.dataset.utf;
    if(h === "hem"){ lamna(); return; }
    if(h === "liten" || h === "stor"){ lage = h; intro(); rot.querySelector(`[data-utf="${h}"]`).focus({ preventScroll:true }); return; }
    if(h === "igen"){ state = null; intro(); rot.querySelector("h1").focus(); return; }
    if(h === "borja"){ state = skapaUtflykt(lage); render(true); sag(state.steg[0].fraga); return; }
    if(h === "lyssna"){ sag(state.steg[state.index].fraga, true); return; }
    const fore = state;
    state = utflyktHandling(state, h);
    if(state.status === "klar" && fore.status !== "klar"){ beloning = belona(); ljud("win"); }
    else if(state.status === "lost" && fore.status !== "lost"){ ljud("correct"); sag(state.meddelande); }
    else if(h === "kolla" || h === "hjalp") sag(state.meddelande);
    else if(h === "nasta") sag(state.steg[state.index].fraga);
    else ljud("tap");
    render(h === "nasta");
    const fokus = rot.querySelector(`[data-utf="${h}"]:not([disabled])`) || rot.querySelector('[data-utf="nasta"]');
    if(fokus && h !== "nasta") fokus.focus({ preventScroll:true });
  };
  rot.addEventListener("click", klick); intro();
  return () => { avslutad = true; rot.removeEventListener("click", klick); rot.innerHTML = ""; };
}
