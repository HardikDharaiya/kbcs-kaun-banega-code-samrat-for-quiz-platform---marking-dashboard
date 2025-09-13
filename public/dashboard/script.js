// KBCS Dashboard Script v3.3 - FINAL TIMER LOGIC

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

// Timer Buttons
const startTimerBtn = document.getElementById('startTimerBtn');
const stopTimerBtn = document.getElementById('stopTimerBtn');
const resetTimerBtn = document.getElementById('resetTimerBtn');

// Round Progression Buttons
const setRound1Btn = document.getElementById('setRound1Btn');
const setRound2Btn = document.getElementById('setRound2Btn');

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

socket.on('updateState', (state) => {
    renderTeams(state.teams);
    renderPreview(
        state.currentQuestion, 
        state.gameState.isScreenActive, 
        state.gameState.currentQuestionIndex, 
        state.roundQuestionCount
    );
});

// --- UI Rendering Functions: Draw what the user sees ---

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

function renderPreview(questionData, isScreenActive, questionIndex, totalQuestions) {
    if (questionData && isScreenActive) {
        const questionCounter = `Question (${questionIndex + 1} / ${totalQuestions}):`;
        previewQuestion.innerHTML = `<strong>${questionCounter}</strong><br>${questionData.question}`;
        previewAnswerText.textContent = questionData.answer;
    } else {
        previewQuestion.innerHTML = 'Waiting for the next action...';
        previewAnswerText.textContent = '--';
    }
}

// --- Event Emitters: Send commands to the server on button clicks ---

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

// Timer Controls
startTimerBtn.addEventListener('click', () => socket.emit('controls:startTimer'));
stopTimerBtn.addEventListener('click', () => socket.emit('controls:stopTimer'));
resetTimerBtn.addEventListener('click', () => socket.emit('controls:resetTimer'));

// Round Progression Controls
setRound1Btn.addEventListener('click', () => {
    socket.emit('controls:setRound', { round: 1 });
    // The redundant startRoundTimer command has been removed.
});
setRound2Btn.addEventListener('click', () => socket.emit('controls:setRound', { round: 2 }));

// Lifeline Controls
lifeline5050Btn.addEventListener('click', () => socket.emit('controls:lifeline', '5050'));
lifelineSwapBtn.addEventListener('click', () => socket.emit('controls:lifeline', 'swap'));

// Reset Controls
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