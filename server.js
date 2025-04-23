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

// API-nøgle fra miljøvariable
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
    console.error('ADVARSEL: ANTHROPIC_API_KEY er ikke defineret i miljøvariablerne');
}

// Debug info
console.log('API-nøgle indlæst: ', ANTHROPIC_API_KEY ? 'Ja (længde: ' + ANTHROPIC_API_KEY.length + ')' : 'Nej');

// API route til at generere historier
app.post('/api/generate-story', async (req, res) => {
    try {
        const {
            animalName,
            geography,
            level,
            textLength,
            style,
            focusAreasData
        } = req.body;

        // Valider inputs
        if (!animalName) {
            return res.status(400).json({ error: 'Manglende dyrenavn' });
        }

        console.log('Genererer historie for:', animalName);

        // Forbered fokusområder i det nye format - sorteret efter værdi
        const sortedFocusAreas = [...focusAreasData].sort((a, b) => b.value - a.value);
        const focusAreasText = sortedFocusAreas
            .map(area => `${area.name} (${area.value}/10)`)
            .join(', ');

        // Forbered slider-værdier
        const sliderValues = focusAreasData.map(area => {
            // Konverter 0-10 skala til -10 til 10 skala
            const convertedValue = (area.value - 5) * 2;
            return `- ${area.name}: ${convertedValue}`;
        }).join('\n');

        console.log('Fokusområder:', focusAreasText);
        console.log('Slider-værdier:', sliderValues);

        // Tilføj specifik vejledning om skriveniveau
        const levelInstructions = `
SÆRLIGT VIGTIGT OM SKRIVENIVEAU ${level}:
${level === 0 ? '- Niveau 0: Brug KUN enstavelsesord med mellemrum mellem ordene. Eksempel: "Se den kat. Den er stor."' : ''}
${level <= 3 ? '- Niveau 1-3: Korte, enkle sætninger med basale ord egnet til begynderlæsere.' : ''}
${level >= 4 && level <= 7 ? '- Niveau 4-7: Gradvist mere komplekse sætninger og ordforråd.' : ''}
${level >= 8 ? '- Niveau 8-10: Avanceret sprog med fagtermer og komplekse sætninger.' : ''}
`;

        // Byg prompt med den nye struktur
        const prompt = `Du er en erfaren dansk forfatter, der specialiserer sig i at skrive faktabaserede dyrehistorier for børn i Sebastian Klein-stil. Din opgave er at skabe en engagerende og informativ historie om et bestemt dyr, der balancerer underholdning og videnskabelig nøjagtighed.

Her er de vigtige oplysninger om dyret og de ønskede parametre for historien:

<dyrenavn>${animalName}</dyrenavn>

<geografi>${geography || 'Ikke specificeret'}</geografi>

<længde>${textLength}</længde>

<niveau>${level}</niveau>

<formidlingsstil>${style}</formidlingsstil>

<fokusområder>${focusAreasText}</fokusområder>

<fokus_sliders>
${sliderValues}
</fokus_sliders>

${levelInstructions}

Før du begynder at skrive historien, skal du analysere og planlægge indholdet grundigt. Udfør følgende trin i <dyrehistorie_planlægning> tags inden i din tænkeblok:

1. Undersøg om det angivne dyr eksisterer. Hvis det ikke gør, giv feedback og foreslå et lignende dyr.
2. Research og list nøglefakta om dyret, inklusiv habitat, fødevaner, særlige egenskaber, adfærd, størrelse, udseende og overlevelsesstrategier.
3. Analyser sliderværdierne og beskriv, hvordan de vil påvirke indholdet og fokus i historien.
4. List de vigtigste punkter for hvert fokusområde, og juster vægtningen baseret på sliderværdierne og fokusområdernes rangering.
5. Brainstorm engagerende måder at præsentere hvert fokusområde på, inklusiv interessante sammenligninger og anekdoter.
6. Lav en detaljeret disposition for historiens struktur, inklusiv ideer til en fængende åbning og en mindeværdig afslutning.
7. Planlæg, hvordan du vil tilpasse sprog og stil til det angivne niveau og formidlingsstil. Giv eksempler på ordvalg og sætningsstruktur, der passer til niveauet.
8. Overvej, hvordan du vil inkorporere alle de nødvendige elementer og balancere videnskabelig nøjagtighed med engagement.
9. Udtænk kreative sammenligninger og anekdoter til at gøre historien mere levende. List mindst tre ideer.
10. Overvej, hvordan du kan moderere brugen af udråb og overentusiastisk sprog, især ved lavere niveauer af formidlingsstil-skalaen.
11. Brainstorm ideer til, hvordan du kan involvere læseren direkte i historien.
12. Opsummer dyrets nøglekarakteristika i punktform.
13. Lav en ordbank med passende ord for det givne niveau.
14. Skitsér, hvordan du vil balancere underholdning og videnskabelig nøjagtighed baseret på formidlingsstil-værdien.
15. Overvej hvordan du kan inkorporere den geografiske information i historien.
16. Plan, hvordan du vil balancere fokusområderne baseret på sliderværdierne.
17. Brainstorm kreative måder at starte og afslutte historien på.

Efter din grundige analyse, præsenter din dyrehistorie i følgende format:

<forklaring>
[Kort forklaring af, hvordan fokusområder og niveau er adresseret]
</forklaring>

<dyrehistorie>
[Din dyrehistorie her]
</dyrehistorie>

Husk at:
- Tilpasse indholdet til det angivne skriveniveau og formidlingsstil.
- Inkludere information om habitat/levested, fødevaner, særlige egenskaber, adfærd, størrelse og udseende, overlevelsesstrategier, samt sjove anekdoter eller overraskende fakta.
- Vise fascination og respekt for dyret.
- Balancere underholdning med læring.
- Bruge aktive verber og levende beskrivelser.
- Involvere læseren direkte.
- Inkludere interessante sammenligninger.
- Sørge for, at teksten på niveau 0 er helt basal læsning med mellemrum og mest enstavelses ord.

Skriv hele teksten på dansk og inkluder kun forklaringen og dyrehistorien i dit endelige output. Dit endelige output bør kun bestå af <forklaring> og <dyrehistorie> sektionerne og bør ikke gentage eller omformulere noget af det arbejde, du gjorde i tænkeblokken.`;

        // Kald Anthropic API med forbedret fejlhåndtering
        try {
            console.log('Sender anmodning til Anthropic API');

            // Forbered request-objektet med korrekte parametre
            const requestBody = {
                model: 'claude-3-7-sonnet-20250219',
                max_tokens: 64000,
                temperature: 1.0,  // Must be 1.0 when thinking is enabled
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                thinking: {
                    type: "enabled",
                    budget_tokens: 6554
                }
                // Removed the betas parameter that was causing errors
            };

            console.log('Request body forberedt');

            const response = await axios.post(
                'https://api.anthropic.com/v1/messages',
                requestBody,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'anthropic-version': '2023-06-01',
                        'x-api-key': ANTHROPIC_API_KEY
                    }
                }
            );

            console.log('Modtog svar fra Anthropic API');

            // Log response structure to debug
            console.log('Response struktur:', JSON.stringify(response.data, null, 2).substring(0, 500) + '...');

            // Udtræk indhold med robust fejlhåndtering
            let forklaring = '';
            let dyrehistorie = '';

            // Sikkerhedskontrol af respons struktur
            if (!response.data || !response.data.content || !Array.isArray(response.data.content)) {
                console.error('Uventet respons format fra API:', response.data);
                dyrehistorie = 'Der opstod en fejl med API-svaret. Formatet var ikke som forventet.';
            } else {
                // Find det tekstindhold i responsen (ikke thinking blokken)
                const textContent = response.data.content.find(item => item.type === 'text');

                if (!textContent || !textContent.text) {
                    console.error('Ingen tekstindhold fundet i respons:', response.data.content);
                    dyrehistorie = 'Der blev ikke modtaget noget tekstindhold fra API.';
                } else {
                    const fullContent = textContent.text;
                    console.log('Indhold modtaget, længde:', fullContent.length);

                    // Udtræk forklaring
                    try {
                        const forklaringMatch = fullContent.match(/<forklaring>([\s\S]*?)<\/forklaring>/);
                        if (forklaringMatch && forklaringMatch[1]) {
                            forklaring = forklaringMatch[1].trim();
                        }
                    } catch (e) {
                        console.error('Fejl ved udtrækning af forklaring:', e);
                    }

                    // Udtræk historie
                    try {
                        const dyrehistorieMatch = fullContent.match(/<dyrehistorie>([\s\S]*?)<\/dyrehistorie>/);
                        if (dyrehistorieMatch && dyrehistorieMatch[1]) {
                            dyrehistorie = dyrehistorieMatch[1].trim();
                        } else {
                            // Hvis tags ikke findes, brug hele indholdet
                            dyrehistorie = fullContent;
                        }
                    } catch (e) {
                        console.error('Fejl ved udtrækning af dyrehistorie:', e);
                        dyrehistorie = fullContent; // Brug hele indholdet som fallback
                    }
                }
            }

            res.json({
                forklaring,
                dyrehistorie
            });

        } catch (error) {
            console.error('Fejl ved API kald til Anthropic:', error);

            // Forbedret fejlhåndtering med fejldetaljer
            const errorDetails = error.response?.data ?
                JSON.stringify(error.response.data, null, 2) :
                error.message;

            console.error('Fejldetaljer:', errorDetails);

            // Bygger en mere brugervenlig fejlbesked
            let userMessage = 'Kunne ikke generere historie';

            if (error.response?.status === 401) {
                userMessage = 'API-nøgle afvist. Kontroller at API-nøglen er gyldig.';
            } else if (error.response?.status === 400) {
                userMessage = 'Ugyldig anmodning. Der kan være et problem med inputværdierne.';
            } else if (error.response?.status === 429) {
                userMessage = 'For mange anmodninger. Prøv igen senere.';
            } else if (error.response?.status >= 500) {
                userMessage = 'Serverfejl hos Anthropic. Prøv igen senere.';
            }

            res.status(500).json({
                error: userMessage,
                details: errorDetails
            });
        }
    } catch (error) {
        console.error('Generel fejl:', error);
        res.status(500).json({ error: 'Der opstod en uventet fejl', details: error.message });
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