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

    // Update slider values
    levelSlider.addEventListener('input', function() {
        levelValue.textContent = this.value;
    });

    lengthSlider.addEventListener('input', function() {
        lengthValue.textContent = this.value;
    });

    styleSlider.addEventListener('input', function() {
        styleValue.textContent = this.value;
    });

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

        // Collect focus areas
        const focusAreas = [
            `Fakta om dyret: ${document.getElementById('factsFocus').value}`,
            `Sjove anekdoter: ${document.getElementById('funnyFocus').value}`,
            `Levevis: ${document.getElementById('habitatFocus').value}`,
            `Fødevaner: ${document.getElementById('dietFocus').value}`,
            `Særlige egenskaber: ${document.getElementById('specialAbilitiesFocus').value}`,
            `Udseende: ${document.getElementById('appearanceFocus').value}`,
            `Overlevelsesstrategier: ${document.getElementById('survivalFocus').value}`,
            `Adfærd: ${document.getElementById('behaviorFocus').value}`
        ].join(', ');

        // Prepare request payload
        const requestData = {
            animalName,
            geography,
            level: levelSlider.value,
            textLength: lengthSlider.value,
            style: styleSlider.value,
            focusAreas
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

        // Add download button
        const downloadButton = document.createElement('button');
        downloadButton.className = 'download-button';
        downloadButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download Historie';
        downloadButton.onclick = function() {
            downloadText(`${animalName} - Dyrehistorie.txt`, data.dyrehistorie);
        };

        resultElement.appendChild(downloadButton);

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