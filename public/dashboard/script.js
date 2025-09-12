// KBCS Dashboard Script v2.3 - Final Stable Version

const socket = io();

// --- Get all DOM elements once for efficiency ---
const statusText = document.getElementById('statusText');
const statusDot = document.querySelector('.status-indicator .dot');
const teamContainer = document.getElementById('teamContainer');
const previewQuestion = document.getElementById('previewQuestion');
const previewAnswerText = document.getElementById('previewAnswerText');

// Game Flow Buttons
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const toggleAnswerBtn = document.getElementById('toggleAnswerBtn');
const clearScreenBtn = document.getElementById('clearScreenBtn');
const startTimerBtn = document.getElementById('startTimerBtn');

// Round Progression Buttons
const setRound1Btn = document.getElementById('setRound1Btn');
const setRound2Btn = document.getElementById('setRound2Btn');
const setRound3Btn = document.getElementById('setRound3Btn');

// Lifeline Buttons
const lifeline5050Btn = document.getElementById('lifeline5050Btn');
const lifelineSwapBtn = document.getElementById('lifelineSwapBtn');

// Reset Buttons
const resetScoresBtn = document.getElementById('resetScoresBtn');
const clearTeamsBtn = document.getElementById('clearTeamsBtn');
const resetGameBtn = document.getElementById('resetGameBtn');

// --- Socket Listeners: Handle communication from the server ---

socket.on('connect', () => {
    statusText.textContent = 'Connected';
    statusDot.classList.remove('disconnected');
    statusDot.classList.add('connected');
});

socket.on('disconnect', () => {
    statusText.textContent = 'Disconnected';
    statusDot.classList.remove('connected');
    statusDot.classList.add('disconnected');
});

// The main listener that updates the entire dashboard based on the server's state
socket.on('updateState', (state) => {
    // console.log('Received state update from server:', state); // Uncomment for debugging
    renderTeams(state.teams);
    // CRITICAL FIX: Pass both the question AND the screen status to the render function
    renderPreview(state.currentQuestion, state.gameState.isScreenActive);
});

// --- UI Rendering Functions: Draw what the user sees ---

/**
 * Renders the list of team cards with their scores and buttons.
 * @param {Array} teams - The array of team objects from the server.
 */
function renderTeams(teams) {
    if (!teams) return;
    teamContainer.innerHTML = '';
    if (teams.length === 0) {
        teamContainer.innerHTML = '<p class="placeholder-text">No teams found. Add teams in the setup page.</p>';
        return;
    }
    teams.forEach(team => {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        teamCard.innerHTML = `
            <div class="team-info">
                <span class="team-name">${team.name}</span>
                <span class="team-score">${team.score}</span>
            </div>
            <div class="score-controls">
                <button class="add" data-team-id="${team.id}" data-points="10">+10</button>
                <button class="add" data-team-id="${team.id}" data-points="20">+20</button>
                <button class="add" data-team-id="${team.id}" data-points="50">+50</button>
                <button class="subtract" data-team-id="${team.id}" data-points="-5">-5</button>
            </div>
        `;
        teamContainer.appendChild(teamCard);
    });
}

/**
 * Renders the live question and answer in the dashboard's preview panel.
 * @param {Object} questionData - The current question object from the server.
 * @param {boolean} isScreenActive - Whether the main quiz screen is currently showing a question.
 */
function renderPreview(questionData, isScreenActive) {
    // CRITICAL FIX: Only show the question if it exists AND the screen is active.
    if (questionData && isScreenActive) {
        previewQuestion.textContent = questionData.question;
        previewAnswerText.textContent = question.answer;
    } else {
        // Otherwise, show a default waiting/cleared text.
        previewQuestion.textContent = 'Waiting for the next action...';
        previewAnswerText.textContent = '--';
    }
}

// --- Event Emitters: Send commands to the server on button clicks ---

// Use event delegation for the dynamically created score buttons
teamContainer.addEventListener('click', (event) => {
    const target = event.target;
    if (target.tagName === 'BUTTON' && target.dataset.teamId) {
        const teamId = parseInt(target.dataset.teamId);
        const points = parseInt(target.dataset.points);
        socket.emit('teams:updateScore', { teamId, points });
    }
});

// Game Flow Controls
nextQuestionBtn.addEventListener('click', () => socket.emit('controls:nextQuestion'));
toggleAnswerBtn.addEventListener('click', () => socket.emit('controls:toggleAnswer'));
clearScreenBtn.addEventListener('click', () => socket.emit('controls:clearScreen'));
startTimerBtn.addEventListener('click', () => socket.emit('controls:startTimer'));

// Round Progression Controls
setRound1Btn.addEventListener('click', () => socket.emit('controls:setRound', { round: 1 }));
setRound2Btn.addEventListener('click', () => socket.emit('controls:setRound', { round: 2 }));
setRound3Btn.addEventListener('click', () => socket.emit('controls:setRound', { round: 3 }));

// Lifeline Controls
lifeline5050Btn.addEventListener('click', () => socket.emit('controls:lifeline', '5050'));

// Reset Controls (with confirmation dialogs for safety)
resetScoresBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all team scores to 0?')) {
        socket.emit('controls:resetScores');
    }
});
clearTeamsBtn.addEventListener('click', () => {
    if (confirm('DANGER: Are you sure you want to delete ALL teams? This cannot be undone.')) {
        socket.emit('controls:clearTeams');
    }
});
resetGameBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to fully reset the game? This will reset scores, set the game to Round 1, and shuffle the questions.')) {
        socket.emit('controls:resetGame');
    }
});