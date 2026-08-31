# Räknelandet

Ett färgglatt mattespel för barn från ungefär 4 år, på svenska. Byggt som en enda
HTML-fil utan byggsteg – öppna `index.html` i valfri webbläsare så är det igång.
Fungerar lika bra på mobil, surfplatta och dator, och behöver inget internet efter
att sidan laddats en gång.

## Så spelar man

Barnet väljer tre saker på startsidan – en kompis, en nivå och ett spelsätt – och
trycker på **Spela!**. En omgång är tio uppgifter.

### Fem nivåer

| Nivå | Innehåll | Exempel |
| --- | --- | --- |
| 1 | Räkna saker, 1–10 | *Hur många äpplen?* |
| 2 | Plus upp till 5 | `3 + 1` |
| 3 | Plus upp till 10 | `6 + 4` |
| 4 | Plus och minus upp till 10 | `9 − 3` |
| 5 | Plus och minus upp till 20, samt vad som fattas | `15 − 8`, `4 + ? = 9` |

### Två spelsätt

- **Välj svar** – tre alternativ på nivå 1–2, fyra på nivå 3–5.
- **Skriv svar** – stor knappsats med siffror. Fysiskt tangentbord fungerar också
  (siffror, backsteg, enter).

### Poäng

Rätt svar på första försöket ger 10 guldmynt. Tre rätt i rad dubblar poängen, sex
rätt i rad tredubblar dem. Rätt svar efter ett feltryck ger 5 mynt – aldrig
minuspoäng. Efter tio uppgifter delas det ut upp till tre stjärnor, och mynten
läggs i skattkistan som sparas mellan gångerna.

## Tänkt för små barn

- **Ingen läskunnighet krävs.** Varje fråga läses upp på svenska, och det går att
  höra den igen med knappen *Hör frågan*.
- **Prickar att räkna.** Talen visas som saker – fem i rad, som i en tiobasram –
  så att `6 + 4` går att räkna sig fram till. Kan stängas av när det sitter i
  huvudet.
- **Fel svar gör inte ont.** Figuren blir lite ledsen, hjälpprickarna tänds
  automatiskt och barnet får försöka igen. Efter tre försök visas svaret vänligt
  och spelet går vidare.
- **Stora tryckytor** och knappar som trycks ihop när man rör dem.

## För vuxna

Tre reglage längst ner på startsidan: **Ljud**, **Läs upp frågan** och
**Visa prickar**. Val, rekord och skattkista sparas lokalt i webbläsaren
(`localStorage`) – ingenting skickas någonstans.

## Figurerna

Bloppy, Zippy, Toffe, Stella, Bip och Måns är egna figurer, ritade i SVG direkt i
filen. De är gjorda i samma glada stil som barn känner igen från tv, men är inte
kopior av några befintliga figurer.

## Teknik

En fil, inga beroenden, inget byggsteg. Ljudeffekterna genereras med Web Audio API,
uppläsningen sker med webbläsarens `SpeechSynthesis`, konfettin ritas på en canvas
och figurerna är handritad SVG. Typsnitten hämtas från Google Fonts med rundade
systemtypsnitt som reserv om sidan är offline.
