# Räknelandet

Ett färgglatt mattespel på svenska för barn från ungefär fyra år. Byggt som en
enda HTML-fil utan byggsteg – öppna `index.html` i valfri webbläsare så är det
igång. Fungerar på mobil, surfplatta och dator, och behöver inget internet efter
att sidan laddats en gång.

## Så funkar det

Barnet skapar en egen spelare med namn och kompisfigur, och väljer sedan mellan
två världar högst upp på skärmen: **Räknelandet** eller **Spårvagn**. Båda
öppnar nya banor, så man kan börja i vilken som helst.

### Räknelandet

Femton banor på en slingrande stig genom fem områden, som var och ett ser ut som
sitt namn – blommor på Ängen, granar i Skogen, kristaller och droppstenar i
Grottan, snöklädda toppar på Berget och moln högst upp. En bana i taget låses
upp genom att klaras med minst en stjärna – eller genom en felfri hållplats i
spårvagnsvärlden – och klarade banor går att spela om.

| Område | Banor | Innehåll |
| --- | --- | --- |
| Ängen | 1–3 | Räkna till 5, räkna till 10, plus till 5 |
| Skogen | 4–6 | Plus till 10, minus till 5, plus och minus till 10 |
| Grottan | 7–9 | Dubbelt, tiokompisar, vad fattas |
| Berget | 10–12 | Plus till 20, minus till 20, plus och minus till 20 |
| Molnen | 13–15 | Tre tal, blandat till 20, mästarprovet |
| Stjärnhimlen | 16–19 | Räkna till 25, 50, 75 och 100 |

Varje bana är tio uppgifter och kan spelas på två sätt: **välj svar** (tre eller
fyra rutor att trycka på) eller **skriv svar** (stor knappsats; fysiskt
tangentbord fungerar också).

### Variation i uppgifterna

En omgång lottas inte fram uppgift för uppgift. Sorterna fördelas jämnt över de
tio uppgifterna och läggs sedan i en ordning där samma sorts tal aldrig dyker upp
mer än två gånger i rad. Dubbeltal räknas som plustal i den fördelningen,
eftersom de ser likadana ut på skärmen. Samma uppgift återkommer inte heller inom
en omgång förrän alla möjliga varianter på banan är använda.

### Poäng, stjärnor och märken

Rätt på första försöket ger 10 guldmynt; tre rätt i rad dubblar och sex rätt i
rad tredubblar. Rätt efter ett feltryck ger 5 mynt – aldrig minuspoäng. Efter
varje omgång delas upp till tre stjärnor ut (4 rätt direkt ger en, 7 ger två, 9
ger tre), och minst en stjärna öppnar nästa bana. Totalt finns 57 stjärnor och 19
märken att samla, från *Första stjärnan* och *Ändstation* till *Hela landet*.

## Spårvagn — Göteborgs linjenät

Andra världen i spelet. Barnet väljer en av Göteborgs tolv spårvagnslinjer och
åker från ändstation till ändstation, en hållplats i taget. Varje hållplats
kostar fem uppgifter, och när de är klara rullar vagnen fram till nästa
hållplats på linjekartan medan rösten ropar ut namnet. Utropet föregås av två
mjuka toner, och läses lugnare och i lägre tonläge än matteuppgifterna så att det
låter som ett utrop och inte som en lekkamrat.

- **Riktiga linjer.** Hållplatserna i ordning kommer från OpenStreetMaps
  rutt-relationer och är sedan kontrollerade mot Västtrafiks officiella
  spårvagnskarta (gäller från 2026-06-15) och mot Wikipedias linjeartiklar.
  Skyltdestinationer och linjefärger är hämtade ur Västtrafiks karta: linje 1
  är vit, tvåan gul, trean blå, fyran grön och femman röd, precis som sedan
  1902. Linje 6 har 46 hållplatser, linje 10 bara 13 – bra att veta när man
  väljer hur lång resa det ska bli.
- **Varje hållplats syns.** Alla 132 hållplatser har en egen liten bild, ritad
  efter vad namnet betyder: rymdraket i Bergsjön (Komettorget, Rymdtorget,
  Teleskopgatan), ädelstenar i Tynnered (Opaltorget, Smaragdgatan,
  Briljantgatan), sol och moln i Biskopsgården (Väderilsgatan,
  Vårväderstorget), hav vid Saltholmen, pariserhjul vid Liseberg, vagnhall vid
  Vagnhallen Majorna. Övriga får sin bild av namnets ändelse.
- **Kort summering.** När hållplatsen är avklarad visas bara mynten och en enda
  knapp: *Åk vidare!* Sedan rullar vagnen in på nästa hållplats.
- **Svårigheten anpassar sig.** Standardläget **Stigande** håller reda på var
  barnet ligger och flyttar sig: rätt svar höjer, ett feltryck sänker lite, och
  tre fel på samma uppgift sänker mer. Uppgifterna dras från nivån runt det
  läget, så det blir svårare när det går bra och backar tillfälligt när det
  kärvar – tills nivån sitter igen. Rubriken visar var man är just nu, till
  exempel *Stigande · Plus till 10*.
- **Andra lägen finns kvar.** **Blandat** drar ur allt barnet låst upp, med ett
  golv som följer med uppåt så en van spelare slipper 1 + 1. Man kan också låsa
  en enskild bana. Valet görs innan resan och går att ändra med *byt* i toppen.
- **Hur långt man kommit syns.** Varje linje i listan har en mätare i linjens
  egen färg som fylls hållplats för hållplats, och blir grön när hela linjen är
  åkt.
- **Spårvagnen för spelaren framåt.** Fyra rätt av fem på en hållplats, på
  Blandat eller på den svåraste öppna banan, öppnar nästa bana – samma banor som
  i Räknelandet. Man kan alltså börja med spårvagnen och aldrig röra kartan; ett
  barn som bara åker linje 10 går från *Räkna till 5* till *Plus och minus till
  10* på fem hållplatser.
- **Inga upprepningar mellan hållplatserna.** Eftersom en hållplats bara är fem
  uppgifter minns spelet de senaste tjugofyra talen och undviker dem, så två
  hållplatser i rad aldrig känns likadana.

Linje 13 är utelämnad. Västtrafiks karta visar bara linjerna 1–12, och 13 är i
praktiken indragen sedan 2023. Vill du lägga till eller rätta något ligger alla
linjer i listan `TRAM_LINES` högst upp i `index.html`, en rad per linje.

Antalet hållplatser stämmer med Wikipedias uppgift för elva av tolv linjer.
Undantaget är linje 1, där Wikipedias faktaruta säger 29 medan både
OpenStreetMap och Wikipedias egen linjekarta säger 28. Linje 1 har bara en enda
sträcka som ingen annan linje delar, Munkebäckstorget–Härlanda, och Västtrafiks
karta visar ingen hållplats däremellan. 28 gäller.

## Tänkt för små barn

- **Uppgifterna kräver ingen läskunnighet.** Varje fråga läses upp på svenska,
  rösten hälsar med namn vid start och läser även upp de val som betyder mest –
  vilken värld, vilken spårvagnslinje och vilka tal man valt. Hastigheten går att
  ställa i tre steg. Menyerna är däremot text: räkna med att en vuxen hjälper till
  första gången, sedan hittar barnet oftast tillbaka på färg och figur.
- **Prickar att räkna.** Talen visas som saker, fem i rad som i en tiobasram, så
  att `6 + 4` går att räkna sig fram till. Kan stängas av när det sitter.
  Storleken följer antalet: tre saker ritas stora och tydliga, tio krymper lagom
  så att de får plats i två rader om fem. Över tio grupperas de i hela tioramar –
  76 syns som sju fulla ramar och sex lösa, inte som 76 utspridda figurer. Hjälpen
  räcker hela vägen till tjugo, så den finns kvar även på de svåraste talen.
- **Fel svar gör inte ont.** Figuren blir lite ledsen, hjälpprickarna tänds
  automatiskt och barnet får försöka igen. Efter tre försök skrivs svaret in där
  barnet letade efter det – i svarsrutan, på rätt ruta och i själva talet – innan
  spelet går vidare. Uppgiften markeras som klarad med hjälp, inte som
  misslyckad.
- **Stora tryckytor** och knappar som trycks ihop när man rör dem.

## Som app på hemskärmen

Spelet är förberett som webbapp: egen ikon, eget fönster utan webbläsarens
adressfält, och det fungerar utan nätverk när det väl laddats en gång.

**Lägg upp spelet på en egen adress.** På GitHub: *Settings → Pages → Source:
Deploy from a branch*, välj den här grenen och mappen `/ (root)`, spara. Efter en
minut ligger spelet på `https://<användarnamn>.github.io/adam/`. Vilken statisk
webbserver som helst fungerar lika bra – det är bara filer.

**Lägg till på iPhone eller iPad.** Öppna adressen i **Safari** (det måste vara
Safari, inte Chrome), tryck på dela-ikonen och välj *Lägg till på hemskärmen*.
Ikonen dyker upp bland apparna och spelet startar i helskärm.

Tre saker värda att veta:

- **Lägg till på hemskärmen först, spela sedan.** iOS ger hemskärmsappen ett eget
  minne, skilt från Safari. Stjärnor och mynt som samlats i Safari följer inte med
  in i appen.
- **Framstegen ligger kvar i webbläsarens minne på den enheten.** De synkas inte
  mellan telefon och platta, och rensar man webbläsardata försvinner de.
- **Efter en ändring i spelet**: höj `VERSION` i `sw.js`, annars fortsätter appen
  visa den sparade versionen.

## För vuxna

Kugghjulet uppe till höger: ljud, uppläsning, rösthastighet, prickar, byt
kompisfigur, byt spelare och ta bort spelare. Inställningarna hör till spelaren,
så syskon kan ha olika.

Flera spelare får plats. Allt sparas lokalt i webbläsaren (`localStorage`) –
ingenting skickas någonstans. Rensas webbläsardata försvinner även framstegen.

## Figurerna

Bloppy, Zippy, Toffe, Stella, Bip och Måns är egna figurer, ritade i SVG direkt i
filen. De är gjorda i samma glada stil som barn känner igen från tv, men är inte
kopior av några befintliga figurer. Vill du byta ut dem ligger de i arrayen
`CHARACTERS`, en post per figur.

## Källor

Hållplatsernas ordning kommer från OpenStreetMaps rutt-relationer för Göteborgs
spårväg via OSM:s API, © OpenStreetMap-bidragsgivare,
[ODbL](https://opendatacommons.org/licenses/odbl/1-0/).

Datan är sedan kontrollerad mot två oberoende källor: Västtrafiks officiella
spårvagnskarta som gäller från 2026-06-15, och Wikipedias artiklar om varje
linje. Kontrollen gav fyra rättelser – Korsvägen saknades i OSM på linje 4, 6
och 8, och fyra hållplatser stavades annorlunda än hos Västtrafik
(Axel Dahlströms Torg, Dr. Fries Torg, Dr. Sydows Gata, Jaegerdorffsplatsen).

Hela nätet är dessutom korsvaliderat internt: av 319 hållplatspar bekräftas 276
av minst en annan linje som kör samma sträcka, och ingen linje motsäger en
annan. Alla 132 hållplatsnamn återfinns ordagrant på Västtrafiks karta.

Ingen kartbild eller bild på hållplatserna är hämtad någonstans ifrån – allt är
ritat i SVG i den här filen.

## Tester

`node --test` kör tolv tester som plockar ut spelets rena funktioner direkt
ur `index.html`, så att de aldrig testar en kopia som glidit isär från källan. De
täcker att uppgifterna håller sig inom banans tal och aldrig blir negativa, att
rätt svar alltid finns bland alternativen, att samma sorts tal aldrig kommer mer
än två gånger i rad, att undvik-listan hindrar upprepning mellan hållplatser, och
att ingen spårvagnslinje motsäger en annan om hållplatsernas ordning. Tre av dem
gäller det stigande läget: att skickligheten höjs och sänks men stannar inom det
upplåsta, att uppgifter bara dras från öppnade banor, och att ingen uppgift
upprepas inom samma omgång ens när en lätt banas förråd tar slut.

## Teknik

En fil, inga beroenden, inget byggsteg. Ljudeffekterna genereras med Web Audio
API, uppläsningen sker med webbläsarens `SpeechSynthesis`, konfettin ritas på en
canvas och figurerna är handritad SVG. Typsnitten hämtas från Google Fonts med
rundade systemtypsnitt som reserv om sidan är offline.

Uppläsningen använder enhetens svenska röst. Saknas den blir spelet tyst –
prickar och siffror fungerar ändå.
