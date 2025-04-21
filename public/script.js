document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const generateBtn = document.getElementById('generateBtn');
    const animalNameInput = document.getElementById('animalName');
    const geographyInput = document.getElementById('geography');
    const levelSlider = document.getElementById('level');
    const levelValue = document.getElementById('levelValue');
    const lengthSlider = document.getElementById('length');
    const lengthValue = document.getElementById('lengthValue');
    const styleSlider = document.getElementById('style');
    const styleValue = document.getElementById('styleValue');
    const loadingIndicator = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const resultElement = document.getElementById('result');

    // Fokusområde sliders
    const focusSliders = [
        { slider: document.getElementById('factsFocus'), value: document.getElementById('factsValue'), name: 'Fakta om dyret' },
        { slider: document.getElementById('funnyFocus'), value: document.getElementById('funnyValue'), name: 'Sjove anekdoter' },
        { slider: document.getElementById('habitatFocus'), value: document.getElementById('habitatValue'), name: 'Levevis' },
        { slider: document.getElementById('dietFocus'), value: document.getElementById('dietValue'), name: 'Fødevaner' },
        { slider: document.getElementById('specialAbilitiesFocus'), value: document.getElementById('specialAbilitiesValue'), name: 'Særlige egenskaber' },
        { slider: document.getElementById('appearanceFocus'), value: document.getElementById('appearanceValue'), name: 'Udseende' },
        { slider: document.getElementById('survivalFocus'), value: document.getElementById('survivalValue'), name: 'Overlevelsesstrategier' },
        { slider: document.getElementById('behaviorFocus'), value: document.getElementById('behaviorValue'), name: 'Adfærd' }
    ];

    // Update generelle slider værdier
    levelSlider.addEventListener('input', function() {
        levelValue.textContent = this.value;
    });

    lengthSlider.addEventListener('input', function() {
        lengthValue.textContent = this.value;
    });

    styleSlider.addEventListener('input', function() {
        styleValue.textContent = this.value;
    });

    // Opdater fokusslider værdier og stilarter
    focusSliders.forEach(item => {
        item.slider.addEventListener('input', function() {
            item.value.textContent = this.value;
            updateSliderStyle(this);
        });

        // Initialiser sliderstil
        updateSliderStyle(item.slider);
    });

    // Funktion til at opdatere sliderstil baseret på værdi
    function updateSliderStyle(slider) {
        const value = slider.value;
        const percentage = ((value - slider.min) / (slider.max - slider.min)) * 100;

        // Farvegradient baseret på værdi
        let color;
        if (value < 4) {
            color = '#f44336'; // Rød for lav fokus
        } else if (value < 7) {
            color = '#FFC107'; // Gul for medium fokus
        } else {
            color = '#4CAF50'; // Grøn for høj fokus
        }

        slider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #ddd ${percentage}%, #ddd 100%)`;
    }

    // Generate story function
    generateBtn.addEventListener('click', async function() {
        const animalName = animalNameInput.value.trim();
        const geography = geographyInput.value.trim();

        // Validate inputs
        if (!animalName) {
            showError('Indtast venligst et dyrenavn');
            return;
        }

        // Reset UI
        hideError();
        showLoading();
        resultElement.style.display = 'none';

        // Samle fokusområdedata fra sliders
        const focusAreasData = focusSliders.map(item => ({
            name: item.name,
            value: item.slider.value
        }));

        // Prepare request payload
        const requestData = {
            animalName,
            geography,
            level: levelSlider.value,
            textLength: lengthSlider.value,
            style: styleSlider.value,
            focusAreasData
        };

        // Send to server API
        try {
            const response = await fetch('/api/generate-story', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Der opstod en fejl');
            }

            const data = await response.json();
            displayResult(data, animalName);

        } catch (error) {
            console.error('Fejl ved generering af historie:', error);
            showError('Der opstod en fejl: ' + error.message);
        } finally {
            hideLoading();
        }
    });

    // Helper functions
    function showLoading() {
        loadingIndicator.style.display = 'block';
        generateBtn.disabled = true;

        // Opdater tekst til at indikere længere procestid
        document.querySelector('#loading p').textContent =
            'Genererer dyrehistorie... Dette kan tage op til et par minutter, da historien skabes med stort omhu.';
    }

    function hideLoading() {
        loadingIndicator.style.display = 'none';
        generateBtn.disabled = false;
    }

    function showError(message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    function hideError() {
        errorElement.style.display = 'none';
    }

    function displayResult(data, animalName) {
        resultElement.innerHTML = ''; // Clear previous results

        // Create explanation section if available
        if (data.forklaring) {
            const explanationSection = document.createElement('div');
            explanationSection.className = 'explanation';

            const explanationHeader = document.createElement('h2');
            explanationHeader.textContent = 'Om denne historie:';
            explanationSection.appendChild(explanationHeader);

            const explanationText = document.createElement('p');
            explanationText.textContent = data.forklaring;
            explanationSection.appendChild(explanationText);

            resultElement.appendChild(explanationSection);
        }

        // Create story section
        const storySection = document.createElement('div');
        storySection.className = 'story';

        const storyHeader = document.createElement('h2');
        storyHeader.textContent = 'Dyrehistorie:';
        storySection.appendChild(storyHeader);

        // Break paragraphs and create elements
        const paragraphs = data.dyrehistorie.split('\n\n');
        paragraphs.forEach(paragraph => {
            if (paragraph.trim()) {
                const p = document.createElement('p');
                p.textContent = paragraph;
                storySection.appendChild(p);
            }
        });

        resultElement.appendChild(storySection);

        // Add buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'button-container';

        // Add download button
        const downloadButton = document.createElement('button');
        downloadButton.className = 'download-button';
        downloadButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download Historie';
        downloadButton.onclick = function() {
            downloadText(`${animalName} - Dyrehistorie.txt`, data.dyrehistorie);
        };

        // Add copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Kopiér til udklipsholder';
        copyButton.onclick = function() {
            navigator.clipboard.writeText(data.dyrehistorie).then(() => {
                // Midlertidigt skift tekst for at vise, at kopiering lykkedes
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = '✓ Kopieret!';
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                }, 2000);
            });
        };

        // Add generate new button
        const newButton = document.createElement('button');
        newButton.className = 'new-button';
        newButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 12a9 9 0 0 0 6.7 15L13 21"></path><path d="M14 21h6v-6"></path></svg> Generer ny historie';
        newButton.onclick = function() {
            // Scroll tilbage til toppen af formularen
            document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
        };

        // Add buttons to container
        buttonsContainer.appendChild(downloadButton);
        buttonsContainer.appendChild(copyButton);
        buttonsContainer.appendChild(newButton);

        // Add buttons container to result
        resultElement.appendChild(buttonsContainer);

        // Show result
        resultElement.style.display = 'block';

        // Scroll to results
        resultElement.scrollIntoView({ behavior: 'smooth' });
    }

    function downloadText(filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
});