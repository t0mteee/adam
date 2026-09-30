/* Räknelandets servicearbetare — gör att spelet fungerar utan nätverk.
   Höj versionen när spelet ändras, så hämtas det nya vid nästa start. */
const VERSION = "raknelandet-v35";
const SKAL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./apple-touch-icon.png", "./ikon-192.png", "./ikon-512.png"
];

self.addEventListener("install", (e) => {
  /* Hämta skalet från servern, inte ur webbläsarens egen cache – GitHub Pages
     låter sidan ligga kvar i tio minuter, och då blir det gamla sparat på nytt. */
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(SKAL.map(u => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(nycklar => Promise.all(nycklar.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  const typsnitt = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);

  /* Själva spelet hämtas helst färskt, så en ny version slår igenom direkt,
     men faller tillbaka på det sparade när nätet saknas. Klipprösten lista
     likaså, så nya klipp syns utan ny version av spelet. */
  const sida = req.mode === "navigate" || (url.origin === location.origin && url.pathname.endsWith(".html"));
  const klipplista = url.origin === location.origin && /\/ljud\/rost\/index\.json$/.test(url.pathname);
  if(sida || klipplista){
    e.respondWith(
      fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then(svar => {
        const kopia = svar.clone();
        caches.open(VERSION).then(c => c.put(req, kopia));
        return svar;
      }).catch(() => caches.match(req).then(t => t || (sida ? caches.match("./index.html") : Response.error())))
    );
    return;
  }

  /* Typsnitt och bilder: ta det sparade först, hämta och spara annars */
  if(typsnitt || url.origin === location.origin){
    e.respondWith(
      caches.match(req).then(traff => traff || fetch(req).then(svar => {
        if(svar.ok || svar.type === "opaque"){
          const kopia = svar.clone();
          caches.open(VERSION).then(c => c.put(req, kopia));
        }
        return svar;
      }).catch(() => traff))
    );
  }
});
