const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sikr at API-nøglen findes
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
    console.error('ADVARSEL: ANTHROPIC_API_KEY er ikke defineret i .env filen');
}

// API route til at generere historier
app.post('/api/generate-story', async (req, res) => {
    try {
        const {
            animalName,
            geography,
            level,
            textLength,
            style,
            focusAreas
        } = req.body;

        // Valider inputs
        if (!animalName) {
            return res.status(400).json({ error: 'Manglende dyrenavn' });
        }

        console.log('Genererer historie for:', animalName);

        // Byg prompt
        const prompt = `# Sebastian Klein Style Animal Stories Generator

Du skal skrive en faktabaseret dyrehistorie i Sebastian Klein stil på dansk. Følg disse instruktioner nøje for at skabe en passende tekst:

## 1. Skriveniveau
Teksten skal skrives på et ${level} niveau, målt på en skala fra 0 til 10, hvor 0 repræsenterer det laveste LIX-tal egnet til yngre børn (f.eks. børnehaveniveau), og 10 repræsenterer det højeste LIX-tal egnet til ældre børn (f.eks. 8. klasse). Sørg for, at sprogets kompleksitet matcher det angivne niveau.

- **Niveau 0-2**: Meget enkle sætninger, stavelsesdelte ord, basalt ordforråd.
- **Niveau 3-5**: Korte sætninger, letforståeligt sprog, få fagudtryk med forklaring.
- **Niveau 6-8**: Mere komplekse sætninger, flere fagudtryk, dybere forklaringer.
- **Niveau 9-10**: Avanceret sprog, videnskabelige termer, nuancerede beskrivelser.

## 2. Tekstlængde
Teksten skal være ${textLength} tegn lang, inklusive mellemrum. Forsøg at komme så tæt på denne længde som muligt uden at gå på kompromis med indholdet.

## 3. Fokusområder
Her er fokusområderne og deres vigtighed:
${focusAreas}

## 4. Dyrefakta-stil
Teksten skal skrives i Sebastian Klein stil, hvilket betyder:

- **Entusiastisk og engagerende tone**: Brug udråbsord og entusiastiske udtryk.
- **Fascinerende fakta**: Inkluder interessante, overraskende og måske lidt ulækre detaljer, som børn elsker.
- **Humoristisk tilgang**: Brug humor og sjove sammenligninger til at forklare dyrets adfærd.
- **Respektfuld over for dyr**: Vis fascination og respekt for dyrets tilpasningsevner og særlige egenskaber.
- **Direkte henvendelse**: Tal direkte til læseren, som om du fortæller dem en hemmelighed.
- **Balanceret blanding**: Kombiner underholdning med læring, så fakta præsenteres på en spændende måde.

## 5. Dyrespecifikke oplysninger
Inkluder følgende oplysninger om dyret:

- **Dyrets navn**: ${animalName} (både det almindelige navn og det latinske navn hvis passende for niveauet)
- **Habitat/levested**: Beskriv hvor dyret lever og hvordan det har tilpasset sig dette miljø.
- **Fødevaner**: Forklar hvad dyret spiser og hvordan det jager eller finder føde.
- **Særlige egenskaber**: Fremhæv unikke eller fascinerende egenskaber ved dyret.
- **Adfærd**: Beskriv interessant adfærd, f.eks. parring, yngelpleje, flokdynamik.
- **Størrelse og udseende**: Giv en levende beskrivelse af dyrets udseende og størrelse.
- **Overlevelsesstrategier**: Forklar hvordan dyret forsvarer sig mod fjender eller tilpasser sig miljøet.
- **Sjove anekdoter**: Inkluder overraskende fakta eller kuriøse detaljer.

## 6. Yderligere personalisering
Inkluder disse variabler for at gøre historien mere unik:

- **Geografisk placering**: ${geography} (hvor i verden dyret lever)

## 7. Formidlingsstil
Formidlingsstilen skal tilpasses en skala fra ${style} hvor:

**1-3: Nøgtern og faktabaseret**
- Primært informativ med få udråb
- Hovedsageligt saglige beskrivelser
- Begrænset brug af humor
- Direkte faktaformidling
- Rolig og behersket tone

**4-6: Moderat engageret**
- Balanceret mellem fakta og underholdning
- Enkelte udråb og entusiastiske vendinger
- Nogle sjove sammenligninger
- Lettere uformelt sprog
- Involverer læseren med spørgsmål

**7-8: Livlig og engagerende**
- Energisk sprog med flere udråb
- Flere humoristiske indslag
- Overraskende fakta fremhæves
- Aktive verber og levende beskrivelser
- Direkte henvendelser til læseren

**9-10: Fuld Sebastian Klein og Dolph stil**
- Start med en fængende åbning: "Ved du hvad der er SEJERE end en skateboard-konkurrence? En ${animalName}!"
- Brug STORE bogstaver og mange udråbstegn!!!
- Aktive verber og overdrevne beskrivelser: "Den SLUGER byttet i ét GIGANTISK gab!"
- Sjove og overdrevne sammenligninger: "Dens lugtesans er SÅ god, at den kunne finde en hamburger, der er begravet under 100 sofapuder!"
- Slang og børnevenlige udtryk: "Mega-sejt!", "Vildt klamt!", "Helt ærligt - det er da FANTASTISK?"
- Overdrevet entusiasme og fascinerede udråb: "WOW!", "TÆNK lige på det!", "Det er JO VILDT!"
- Afslutning med en overraskende pointe eller spørgsmål: "Og ved du hvad der er det VILDESTE ved ${animalName}? Den kan..."

## 8. Præsentation
Skriv din dyrehistorie inden for <dyrehistorie> tags. Før teksten skal du give en kort forklaring af, hvordan du har adresseret de givne fokusområder og overholdt det specificerede niveau, indkapslet i <forklaring> tags.

Husk at skrive hele teksten på dansk, da det er målsproget for denne opgave.`;

        // Kald Anthropic API
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-3-7-sonnet-20250219',
                max_tokens: 20000,
                temperature: 1,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01',
                    'x-api-key': ANTHROPIC_API_KEY
                }
            }
        );

        console.log('Modtog svar fra Anthropic API');

        // Udtræk indhold
        let forklaring = '';
        let dyrehistorie = '';
        const fullContent = response.data.content[0].text;

        // Udtræk forklaring
        const forklaringMatch = fullContent.match(/<forklaring>([\s\S]*?)<\/forklaring>/);
        if (forklaringMatch && forklaringMatch[1]) {
            forklaring = forklaringMatch[1].trim();
        }

        // Udtræk historie
        const dyrehistorieMatch = fullContent.match(/<dyrehistorie>([\s\S]*?)<\/dyrehistorie>/);
        if (dyrehistorieMatch && dyrehistorieMatch[1]) {
            dyrehistorie = dyrehistorieMatch[1].trim();
        } else {
            dyrehistorie = fullContent;
        }

        res.json({
            forklaring,
            dyrehistorie
        });

    } catch (error) {
        console.error('Fejl ved generering af historie:', error);

        // Send en mere detaljeret fejlmeddelelse 
        const errorMessage = error.response?.data?.error?.message || error.message || 'Ukendt fejl';
        res.status(500).json({
            error: 'Kunne ikke generere historie',
            details: errorMessage
        });
    }
});

// Fallback route til klientsiden
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start serveren
app.listen(PORT, () => {
    console.log(`Server kører på http://localhost:${PORT}`);
});