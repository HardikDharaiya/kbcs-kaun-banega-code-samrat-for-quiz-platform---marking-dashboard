// KBCS Quiz Platform Script v2.3 - Final Stable Version

const socket = io();

// --- Get all DOM elements once for efficiency ---
// Containers and Overlays
const curtain = document.getElementById('curtain');
const answerOverlay = document.getElementById('answerOverlay');
const leaderboardList = document.getElementById('leaderboardList');
const optionsContainer = document.getElementById('optionsContainer');

// Text Elements
const roundIndicator = document.getElementById('roundIndicator');
const questionText = document.getElementById('questionText');
const answerText = document.getElementById('answerText');
const timerText = document.getElementById('timerText');

// --- Socket Listeners: Handle communication from the server ---

// This is the main listener that redraws the entire screen based on the server's state
socket.on('updateState', (state) => {
    // console.log('Quiz platform received state update:', state); // Uncomment for debugging

    renderLeaderboard(state.teams);

    // CRITICAL FIX: Update the round indicator text every time state is received.
    roundIndicator.textContent = `Round ${state.gameState.currentRound}`;

    // Show the "curtain" if the screen is not active, otherwise show the question.
    curtain.classList.toggle('visible', !state.gameState.isScreenActive);
    curtain.classList.toggle('hidden', state.gameState.isScreenActive);

    if (state.gameState.isScreenActive) {
        renderQuestion(state.currentQuestion);
    } else {
        // If the screen is not active, display a waiting message.
        questionText.textContent = "The Quiz will begin shortly...";
        optionsContainer.innerHTML = '';
    }
});

// Listens for the command to reveal the correct answer.
socket.on('showAnswer', (correctAnswer) => {
    answerOverlay.classList.remove('hidden');
    answerText.textContent = correctAnswer;

    // Highlight the correct option visually.
    const allOptions = optionsContainer.querySelectorAll('.option-item');
    allOptions.forEach(optionEl => {
        if (optionEl.dataset.option === correctAnswer) {
            optionEl.classList.add('correct');
        }
    });
});

// Listens for the command to hide the answer overlay.
socket.on('hideAnswer', () => {
    answerOverlay.classList.add('hidden');
});

// Listens for the 50:50 lifeline and hides two incorrect options.
socket.on('lifeline:5050', (optionsToHide) => {
    const allOptions = optionsContainer.querySelectorAll('.option-item');
    allOptions.forEach(optionEl => {
        if (optionsToHide.includes(optionEl.dataset.option)) {
            optionEl.classList.add('hidden-5050');
        }
    });
});

// Listens for the timer start command and begins a 30-second countdown.
socket.on('startTimer', () => {
    let time = 30;
    timerText.textContent = time;

    // Clear any previous timer to prevent multiple timers running at once.
    if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
    }

    window.countdownInterval = setInterval(() => {
        time--;
        timerText.textContent = time;
        if (time <= 0) {
            clearInterval(window.countdownInterval);
            timerText.textContent = "0";
        }
    }, 1000); // Updates once per second.
});


// --- UI Rendering Functions: Draw what the user sees ---

/**
 * Renders the leaderboard with team names and scores.
 * @param {Array} teams - The array of team objects from the server.
 */
function renderLeaderboard(teams) {
    if (!teams) return;
    leaderboardList.innerHTML = '';
    const sortedTeams = [...teams].sort((a, b) => b.score - a.score); // Sort by score
    sortedTeams.forEach(team => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span>${team.name}</span><span>${team.score}</span>`;
        leaderboardList.appendChild(listItem);
    });
}

/**
 * Renders the current question and its multiple-choice options.
 * @param {Object} questionData - The current question object from the server.
 */
function renderQuestion(questionData) {
    if (!questionData) {
        questionText.textContent = "Waiting for the next question...";
        optionsContainer.innerHTML = '';
        return;
    }

    answerOverlay.classList.add('hidden'); // Ensure answer is hidden initially.
    questionText.textContent = questionData.question;
    optionsContainer.innerHTML = ''; // Clear old options.

    const prefixes = ['A', 'B', 'C', 'D'];
    questionData.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option-item';
        optionElement.dataset.option = option;
        optionElement.innerHTML = `
            <span class="option-prefix">${prefixes[index]}</span>
            <span class="option-text">${option}</span>
        `;
        optionsContainer.appendChild(optionElement);
    });
}