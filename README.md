# Räknelandet

Ett färgglatt mattespel på svenska för barn från ungefär fyra år. Byggt som en
enda HTML-fil utan byggsteg – öppna `index.html` i valfri webbläsare så är det
igång. Fungerar på mobil, surfplatta och dator, och behöver inget internet efter
att sidan laddats en gång.

## Så funkar det

Barnet skapar en egen spelare med namn och kompisfigur. Sedan öppnas kartan över
Räknelandet: femton banor på en slingrande stig genom fem områden. En bana i
taget låses upp, men alla klarade banor går att spela om hur många gånger som
helst.

### Kartan

| Område | Banor | Innehåll |
| --- | --- | --- |
| Ängen | 1–3 | Räkna till 5, räkna till 10, plus till 5 |
| Skogen | 4–6 | Plus till 10, minus till 5, plus och minus till 10 |
| Grottan | 7–9 | Dubbelt, tiokompisar, vad fattas |
| Berget | 10–12 | Plus till 20, minus till 20, plus och minus till 20 |
| Molnen | 13–15 | Tre tal, blandat till 20, mästarprovet |

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
ger tre), och minst en stjärna öppnar nästa bana. Totalt finns 45 stjärnor och 13
märken att samla, från *Första stjärnan* till *Hela landet*.

## Tänkt för små barn

- **Ingen läskunnighet krävs.** Varje fråga läses upp på svenska, och rösten
  hälsar med namn vid start. Hastigheten går att ställa i tre steg.
- **Prickar att räkna.** Talen visas som saker, fem i rad som i en tiobasram, så
  att `6 + 4` går att räkna sig fram till. Kan stängas av när det sitter.
- **Fel svar gör inte ont.** Figuren blir lite ledsen, hjälpprickarna tänds
  automatiskt och barnet får försöka igen. Efter tre försök visas svaret vänligt
  och spelet går vidare. Banan markeras då som klarad med hjälp, inte som
  misslyckad.
- **Stora tryckytor** och knappar som trycks ihop när man rör dem.

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

## Teknik

En fil, inga beroenden, inget byggsteg. Ljudeffekterna genereras med Web Audio
API, uppläsningen sker med webbläsarens `SpeechSynthesis`, konfettin ritas på en
canvas och figurerna är handritad SVG. Typsnitten hämtas från Google Fonts med
rundade systemtypsnitt som reserv om sidan är offline.

Uppläsningen använder enhetens svenska röst. Saknas den blir spelet tyst –
prickar och siffror fungerar ändå.
