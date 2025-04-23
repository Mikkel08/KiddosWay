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


// Når du skal bruge API-nøglen
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

        // Byg prompt med den nye struktur
        const prompt = `Du er en erfaren dansk forfatter, der specialiserer sig i at skrive faktabaserede dyrehistorier for børn i Sebastian Klein-stil. Din opgave er at skabe en engagerende og informativ historie om et bestemt dyr, der balancerer underholdning og videnskabelig nøjagtighed.\\n\\nHer er de vigtige oplysninger om dyret og de ønskede parametre for historien:\\n\\nØnsket tekstlængde (antal tegn, inklusive mellemrum):\\n<længde>\\n{{LÆNGDE}}\\n</længde>\\n\\nDyret, du skal skrive om:\\n<dyrenavn>\\n{{DYRENAVN}}\\n</dyrenavn>\\n\\nDyrets geografiske område:\\n<geografi>\\n{{GEOGRAFI}}\\n</geografi>\\n\\nSkriveniveau (0-10, hvor 0 er egnet til børnehavebørn, og 10 er egnet til 8. klasse):\\n<niveau>\\n{{NIVEAU}}\\n</niveau>\\n\\nFormidlingsstil (0-10, hvor 0 er meget nøgtern og videnskabelig, og 10 er fuld Sebastian Klein-stil med høj entusiasme):\\n<formidlingsstil>\\n{{FORMIDLINGSSTIL}}\\n</formidlingsstil>\\n\\nFokusområder for historien (rangeret efter vigtighed):\\n<fokusområder>\\n{{FOKUSOMRÅDER}}\\n</fokusområder>\\n\\nFokusområder med sliderværdier (fra -10 til 10):\\n<fokus_sliders>\\n- Fakta om dyret: {{FAKTA_SLIDER}}\\n- Sjove anekdoter: {{SJOVE_SLIDER}}\\n- Levevis: {{LEVEVIS_SLIDER}}\\n- Fødevaner: {{FØDEVANER_SLIDER}}\\n- Særlige egenskaber: {{SÆRLIGE_EGENSKABER_SLIDER}}\\n- Udseende: {{UDSEENDE_SLIDER}}\\n- Overlevelsesstrategier: {{OVERLEVELSE_SLIDER}}\\n- Adfærd: {{ADFÆRD_SLIDER}}\\n</fokus_sliders>\\n\\nFør du begynder at skrive historien, skal du planlægge og forberede indholdet grundigt. Udfør følgende trin inden for <dyrehistorie_analyse> tags i din tænkeblok:\\n\\n1. Research og list nøglefakta om dyret, inklusiv habitat, fødevaner, særlige egenskaber, adfærd, størrelse, udseende og overlevelsesstrategier.\\n2. Analyser sliderværdierne og beskriv, hvordan de vil påvirke indholdet og fokus i historien.\\n3. Liste de vigtigste punkter for hvert fokusområde, og juster vægtningen baseret på sliderværdierne og fokusområdernes rangering.\\n4. Brainstorm engagerende måder at præsentere hvert fokusområde på, inklusiv interessante sammenligninger og anekdoter.\\n5. Lav en detaljeret disposition for historiens struktur, inklusiv ideer til en fængende åbning og en mindeværdig afslutning.\\n6. Planlæg, hvordan du vil tilpasse sprog og stil til det angivne niveau og formidlingsstil. Giv eksempler på ordvalg og sætningsstruktur, der passer til niveauet. Vær særligt opmærksom på niveau 0, hvor du skal bruge mest enstavelsesord med mellemrum mellem ordene.\\n7. Overvej, hvordan du vil inkorporere alle de nødvendige elementer og balancere videnskabelig nøjagtighed med engagement.\\n8. Udtænk kreative sammenligninger og anekdoter til at gøre historien mere levende. List mindst tre ideer.\\n9. Overvej, hvordan du kan moderere brugen af udråb og overentusiastisk sprog, især ved lavere niveauer af formidlingsstil-skalaen. Giv eksempler på, hvordan du vil justere tonen.\\n10. Brainstorm ideer til, hvordan du kan involvere læseren direkte i historien.\\n11. Opsummer dyrets nøglekarakteristika i punktform.\\n12. Lav en ordbank med passende ord for det givne niveau.\\n13. Skitsér, hvordan du vil balancere underholdning og videnskabelig nøjagtighed baseret på formidlingsstil-værdien.\\n\\nEfter din grundige analyse, præsenter din dyrehistorie i følgende format:\\n\\n<forklaring>\\n[Kort forklaring af, hvordan fokusområder og niveau er adresseret]\\n</forklaring>\\n\\n<dyrehistorie>\\n[Din dyrehistorie her]\\n</dyrehistorie>\\n\\nHusk at:\\n- Tilpasse indholdet til det angivne skriveniveau og formidlingsstil.\\n- Inkludere information om habitat/levested, fødevaner, særlige egenskaber, adfærd, størrelse og udseende, overlevelsesstrategier, samt sjove anekdoter eller overraskende fakta.\\n- Vise fascination og respekt for dyret.\\n- Balancere underholdning med læring.\\n- Bruge aktive verber og levende beskrivelser.\\n- Involvere læseren direkte.\\n- Inkludere interessante sammenligninger.\\n- Sørge for, at teksten på niveau 0 er helt basal læsning med mellemrum og mest enstavelses ord.\\n\\nSkriv hele teksten på dansk og inkluder kun forklaringen og dyrehistorien i dit endelige output. Dit endelige output bør kun bestå af forklaringen og dyrehistorien og bør ikke gentage eller omformulere noget af det arbejde, du udførte i tænkeblokken."
               
Her er de vigtige oplysninger om dyret og de ønskede parametre for historien:

Dyret, du skal skrive om:
<dyrenavn>
${animalName}
</dyrenavn>

Dyrets geografiske område:
<geografi>
${geography || 'Ikke specificeret'}
</geografi>

Fokusområder for historien (rangeret efter vigtighed):
<fokusområder>
${focusAreasText}
</fokusområder>

Skriveniveau (0-10, hvor 0 er egnet til børnehavebørn, og 10 er egnet til 8. klasse):
<niveau>
${level}
</niveau>

Ønsket tekstlængde (antal tegn, inklusive mellemrum):
<længde>
${textLength}
</længde>

Formidlingsstil (0-10, hvor 0 er meget nøgtern og videnskabelig, og 10 er fuld Sebastian Klein-stil med høj entusiasme):
<formidlingsstil>
${style}
</formidlingsstil>

Fokusområder med sliderværdier (fra -10 til 10):
<fokus_sliders>
${sliderValues}
</fokus_sliders>

Før du begynder at skrive historien, skal du planlægge og forberede indholdet grundigt. Udfør følgende trin inden for <dyrehistorie_planlægning> tags:

1. Research og list nøglefakta om dyret, inklusiv habitat, fødevaner, særlige egenskaber, adfærd, størrelse, udseende og overlevelsesstrategier.
2. Analyser sliderværdierne og beskriv, hvordan de vil påvirke indholdet og fokus i historien.
3. Liste de vigtigste punkter for hvert fokusområde, og juster vægtningen baseret på sliderværdierne og fokusområdernes rangering.
4. Brainstorm engagerende måder at præsentere hvert fokusområde på, inklusiv interessante sammenligninger og anekdoter.
5. Lav en detaljeret disposition for historiens struktur, inklusiv ideer til en fængende åbning og en mindeværdig afslutning.
6. Planlæg, hvordan du vil tilpasse sprog og stil til det angivne niveau og formidlingsstil. Giv eksempler på ordvalg og sætningsstruktur, der passer til niveauet.
7. Overvej, hvordan du vil inkorporere alle de nødvendige elementer og balancere videnskabelig nøjagtighed med engagement.
8. Udtænk kreative sammenligninger og anekdoter til at gøre historien mere levende. List mindst tre ideer.
9. Overvej, hvordan du kan moderere brugen af udråb og overentusiastisk sprog, især ved lavere niveauer af formidlingsstil-skalaen. Giv eksempler på, hvordan du vil justere tonen.
10. Brainstorm ideer til, hvordan du kan involvere læseren direkte i historien.

Efter din grundige planlægning, præsenter din dyrehistorie i følgende format:

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

Skriv hele teksten på dansk og inkluder kun forklaringen og dyrehistorien i dit endelige output.`;

        // Kald Anthropic API med forbedret fejlhåndtering
        try {
            console.log('Sender anmodning til Anthropic API');

            // Forbered request-objektet - fjernet beta parameter
            const requestBody = {
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 8192,
                temperature: 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    },
                   {
                        role: 'assistant',
                        content: [
                            {
                                type: 'text',
                                text: '<dyrehistorie_planlægning>'
                            }
                        ]
                    }
                ]
            };

            console.log('Request body forberedt uden beta parameter');

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