// KBCS Quiz Platform Script v2.4 - THEMATIC ROUNDS FINAL

const socket = io();

// Get DOM elements
const curtain = document.getElementById('curtain');
const answerOverlay = document.getElementById('answerOverlay');
const leaderboardList = document.getElementById('leaderboardList');
const optionsContainer = document.getElementById('optionsContainer');
const roundIndicator = document.getElementById('roundIndicator');
const questionText = document.getElementById('questionText');
const answerText = document.getElementById('answerText');
const timerText = document.getElementById('timerText');
const questionImage = document.getElementById('questionImage'); // The new image element

// The main listener that redraws the screen
socket.on('updateState', (state) => {
    renderLeaderboard(state.teams);
    roundIndicator.textContent = `Round ${state.gameState.currentRound}`;
    curtain.classList.toggle('visible', !state.gameState.isScreenActive);
    curtain.classList.toggle('hidden', state.gameState.isScreenActive);

    if (state.gameState.isScreenActive) {
        renderQuestion(state.currentQuestion);
    } else {
        questionText.textContent = "The Quiz will begin shortly...";
        optionsContainer.innerHTML = '';
        questionImage.classList.add('hidden'); // Ensure image is hidden between questions
    }
});

// Other socket listeners (showAnswer, hideAnswer, etc.) are unchanged
socket.on('showAnswer', (correctAnswer) => { /* ... */ });
socket.on('hideAnswer', () => { /* ... */ });
socket.on('lifeline:5050', (optionsToHide) => { /* ... */ });
socket.on('startTimer', () => { /* ... */ });


// --- UI RENDERING FUNCTIONS ---

function renderQuestion(questionData) {
    if (!questionData) {
        questionText.textContent = "Waiting for the next question...";
        optionsContainer.innerHTML = '';
        questionImage.classList.add('hidden');
        return;
    }

    answerOverlay.classList.add('hidden');
    questionText.textContent = questionData.question;
    optionsContainer.innerHTML = '';

    // --- CRITICAL LOGIC FOR THEMATIC ROUNDS ---
    if (questionData.image) {
        questionImage.src = questionData.image;
        questionImage.classList.remove('hidden');
    } else {
        questionImage.classList.add('hidden');
        questionImage.src = '';
    }
    // ------------------------------------------

    const prefixes = ['A', 'B', 'C', 'D'];
    questionData.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option-item';
        optionElement.dataset.option = option;
        optionElement.innerHTML = `<span class="option-prefix">${prefixes[index]}</span><span class="option-text">${option}</span>`;
        optionsContainer.appendChild(optionElement);
    });
}

function renderLeaderboard(teams) { /* ... Unchanged ... */ }

// --- UNCHANGED HELPER CODE (to make the file complete) ---
function renderLeaderboard(teams) { if (!teams) return; leaderboardList.innerHTML = ''; const sortedTeams = [...teams].sort((a, b) => b.score - a.score); sortedTeams.forEach(team => { const listItem = document.createElement('li'); listItem.innerHTML = `<span>${team.name}</span><span>${team.score}</span>`; leaderboardList.appendChild(listItem); }); }
socket.on('showAnswer', (correctAnswer) => { answerOverlay.classList.remove('hidden'); answerText.textContent = correctAnswer; const allOptions = optionsContainer.querySelectorAll('.option-item'); allOptions.forEach(optionEl => { if (optionEl.dataset.option === correctAnswer) { optionEl.classList.add('correct'); } }); });
socket.on('hideAnswer', () => { answerOverlay.classList.add('hidden'); });
socket.on('lifeline:5050', (optionsToHide) => { const allOptions = optionsContainer.querySelectorAll('.option-item'); allOptions.forEach(optionEl => { if (optionsToHide.includes(optionEl.dataset.option)) { optionEl.classList.add('hidden-5050'); } }); });
socket.on('startTimer', () => { let time = 30; timerText.textContent = time; if (window.countdownInterval) { clearInterval(window.countdownInterval); } window.countdownInterval = setInterval(() => { time--; timerText.textContent = time; if (time <= 0) { clearInterval(window.countdownInterval); timerText.textContent = "0"; } }, 1000); });