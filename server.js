// KBCS SERVER v4.0 - MARKS CHART UPDATE

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");
const fs = require('fs');

// --- SERVER SETUP ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 8080;

// --- FILE PATHS ---
const DB_PATH = path.join(__dirname, 'data', 'database.json');
const QUESTIONS_PATH = path.join(__dirname, 'data', 'questions.json');

// --- IN-MEMORY STATE ---
let gameState = {};
let originalQuestions = {};
let shuffledQuestions = {};

// --- TIMER STATE MANAGEMENT ---
let roundTimerInterval = null;
let roundSeconds = 0;


// --- HELPER FUNCTIONS ---
function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } }
function setupNewGameQuestions() { shuffledQuestions = JSON.parse(JSON.stringify(originalQuestions)); for (const round in shuffledQuestions) { shuffleArray(shuffledQuestions[round]); } console.log("🎲 Questions have been shuffled for a new game."); }
function loadInitialState() { try { const dbData = fs.readFileSync(DB_PATH, 'utf8'); gameState = JSON.parse(dbData); const questionsData = fs.readFileSync(QUESTIONS_PATH, 'utf8'); originalQuestions = JSON.parse(questionsData); setupNewGameQuestions(); console.log("✅ Initial game state and questions loaded successfully."); } catch (error) { console.error("❌ ERROR: Could not load data files.", error); process.exit(1); } }
function saveState() { try { fs.writeFileSync(DB_PATH, JSON.stringify(gameState, null, 2)); } catch (error) { console.error("❌ ERROR: Could not save state to database.json.", error); } }
function broadcastState() { const roundKey = `round${gameState.gameState.currentRound}`; const currentQuestion = shuffledQuestions[roundKey]?.[gameState.gameState.currentQuestionIndex]; const roundQuestionCount = shuffledQuestions[roundKey]?.length || 0; const fullStatePayload = { ...gameState, currentQuestion, roundQuestionCount }; io.emit('updateState', fullStatePayload); }

// --- NEW TIMER HELPER FUNCTION ---
function startRoundTimer() {
    if (roundTimerInterval) clearInterval(roundTimerInterval);
    roundSeconds = 0;
    io.emit('roundTimeUpdate', roundSeconds); // Immediately reset clients to 0
    roundTimerInterval = setInterval(() => {
        roundSeconds++;
        io.emit('roundTimeUpdate', roundSeconds);
    }, 1000);
}


// --- MIDDLEWARE & ROUTES ---
app.use(express.static(path.join(__dirname, 'public')));
app.get('/setup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'setup', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html')));
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'public', 'quiz', 'index.html')));
// --- NEW ROUTE ADDED ---
app.get('/marks', (req, res) => res.sendFile(path.join(__dirname, 'public', 'marks', 'index.html')));


// --- PRIMARY SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
    console.log(`✨ New client connected: ${socket.id}`);
    const roundKey = `round${gameState.gameState.currentRound}`;
    const currentQuestion = shuffledQuestions[roundKey]?.[gameState.gameState.currentQuestionIndex];
    const roundQuestionCount = shuffledQuestions[roundKey]?.length || 0;
    socket.emit('updateState', { ...gameState, currentQuestion, roundQuestionCount });
    io.emit('roundTimeUpdate', roundSeconds);

    socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
    socket.on('teams:add', ({ teamName }) => { const newTeam = { id: Date.now(), name: teamName, score: 0 }; gameState.teams.push(newTeam); saveState(); broadcastState(); });
    socket.on('teams:delete', ({ teamId }) => { gameState.teams = gameState.teams.filter(team => team.id !== teamId); saveState(); broadcastState(); });
    socket.on('teams:updateScore', ({ teamId, points }) => { const team = gameState.teams.find(t => t.id === teamId); if (team) { team.score += points; saveState(); broadcastState(); } });
    socket.on('controls:nextQuestion', () => { const roundKey = `round${gameState.gameState.currentRound}`; if (shuffledQuestions[roundKey] && gameState.gameState.currentQuestionIndex < shuffledQuestions[roundKey].length - 1) { gameState.gameState.isScreenActive = true; gameState.gameState.currentQuestionIndex++; saveState(); broadcastState(); io.emit('hideAnswer'); } });
    socket.on('controls:toggleAnswer', () => { const roundKey = `round${gameState.gameState.currentRound}`; const question = shuffledQuestions[roundKey]?.[gameState.gameState.currentQuestionIndex]; if (question) io.emit('showAnswer', question.answer); });
    socket.on('controls:clearScreen', () => { gameState.gameState.isScreenActive = false; saveState(); broadcastState(); io.emit('hideAnswer'); });

    // --- UPDATED setRound HANDLER ---
    socket.on('controls:setRound', ({ round }) => {
        gameState.gameState.currentRound = round;
        gameState.gameState.currentQuestionIndex = -1;
        gameState.gameState.isScreenActive = false;
        saveState();
        broadcastState();
        startRoundTimer(); // This now correctly handles the timer for ANY round start.
    });

    socket.on('controls:lifeline', (type) => { const roundKey = `round${gameState.gameState.currentRound}`; if (type === '5050') { const question = shuffledQuestions[roundKey]?.[gameState.gameState.currentQuestionIndex]; if (question) { const incorrectOptions = question.options.filter(opt => opt !== question.answer); shuffleArray(incorrectOptions); io.emit('lifeline:5050', incorrectOptions.slice(0, 2)); } } else if (type === 'swap') { if (shuffledQuestions[roundKey] && gameState.gameState.currentQuestionIndex < shuffledQuestions[roundKey].length - 1) { gameState.gameState.currentQuestionIndex++; saveState(); broadcastState(); io.emit('hideAnswer'); } } });
    socket.on('controls:resetScores', () => { gameState.teams.forEach(team => team.score = 0); saveState(); broadcastState(); });
    socket.on('controls:clearTeams', () => { gameState.teams = []; saveState(); broadcastState(); });

    // --- UPDATED resetGame HANDLER ---
    socket.on('controls:resetGame', () => {
        gameState.teams.forEach(team => team.score = 0);
        gameState.gameState.currentRound = 1;
        gameState.gameState.currentQuestionIndex = -1;
        gameState.gameState.isScreenActive = false;
        setupNewGameQuestions();
        saveState();
        broadcastState();
        startRoundTimer(); // Ensure the timer starts fresh on a full reset
    });

    socket.on('controls:startTimer', () => io.emit('startQuestionTimer'));
    socket.on('controls:stopTimer', () => io.emit('stopQuestionTimer'));
    socket.on('controls:resetTimer', () => io.emit('resetQuestionTimer'));
    // The 'startRoundTimer' listener is now removed as it's handled by 'setRound'.

    // --- ADD THIS NEW BLOCK ---
    // Post-Event Control
    socket.on('controls:showThankYou', () => {
        // Stop the round timer when the event ends
        if (roundTimerInterval) clearInterval(roundTimerInterval);
        // Broadcast a simple command to all clients
        io.emit('showThankYou');
    });
});


// --- START THE SERVER ---
server.listen(PORT, () => {
    loadInitialState();
    console.log(`--------- KBCS SERVER IS LIVE (v4.0) ---------`);
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔧 Access Team Setup at:           http://localhost:${PORT}/setup`);
    // --- NEW LINE ADDED ---
    console.log(`📊 Access Marks Chart at:          http://localhost:${PORT}/marks`);
    console.log(`🎮 Access the Marking Dashboard at: http://localhost:${PORT}/dashboard`);
    console.log(`📺 Access the Quiz Platform at:     http://localhost:${PORT}/quiz`);
    console.log(`------------------------------------------------`);
});