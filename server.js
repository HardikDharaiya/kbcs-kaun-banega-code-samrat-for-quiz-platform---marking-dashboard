// KBCS SERVER v2.2 - STABLE & FINAL VERSION

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");
const fs = require('fs');

// --- SERVER SETUP ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// --- FILE PATHS ---
const DB_PATH = path.join(__dirname, 'data', 'database.json');
const QUESTIONS_PATH = path.join(__dirname, 'data', 'questions.json');

// --- IN-MEMORY STATE ---
let gameState = {};
let originalQuestions = {};
let shuffledQuestions = {};

// --- HELPER FUNCTIONS ---

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function setupNewGameQuestions() {
    shuffledQuestions = JSON.parse(JSON.stringify(originalQuestions));
    for (const round in shuffledQuestions) {
        shuffleArray(shuffledQuestions[round]);
    }
    console.log("🎲 Questions have been shuffled for a new game.");
}

function loadInitialState() {
    try {
        const dbData = fs.readFileSync(DB_PATH, 'utf8');
        gameState = JSON.parse(dbData);
        const questionsData = fs.readFileSync(QUESTIONS_PATH, 'utf8');
        originalQuestions = JSON.parse(questionsData);
        setupNewGameQuestions();
        console.log("✅ Initial game state and questions loaded successfully.");
    } catch (error) {
        console.error("❌ ERROR: Could not load data files.", error);
        process.exit(1);
    }
}

function saveState() {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(gameState, null, 2));
    } catch (error) {
        console.error("❌ ERROR: Could not save state to database.json.", error);
    }
}

function broadcastState() {
    const roundKey = `round${gameState.gameState.currentRound}`;
    const currentQuestion = shuffledQuestions[roundKey]?.[gameState.gameState.currentQuestionIndex];
    const fullStatePayload = { ...gameState, currentQuestion };
    io.emit('updateState', fullStatePayload);
    // console.log("📢 State broadcasted to all clients."); // uncomment for debugging
}

// --- MIDDLEWARE & ROUTES ---
app.use(express.static(path.join(__dirname, 'public')));
app.get('/setup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'setup', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html')));
app.get('/quiz', (req, res) => res.sendFile(path.join(__dirname, 'public', 'quiz', 'index.html')));

// --- PRIMARY SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
    console.log(`✨ New client connected: ${socket.id}`);
    
    // Send the current state to the client that just connected
    const roundKey = `round${gameState.gameState.currentRound}`;
    const currentQuestion = shuffledQuestions[roundKey]?.[gameState.gameState.currentQuestionIndex];
    socket.emit('updateState', { ...gameState, currentQuestion });

    // --- All event listeners are defined ONCE per connection ---

    socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));

    // Setup Page Listeners
    socket.on('teams:add', ({ teamName }) => {
        console.log(`Received 'teams:add' for "${teamName}"`);
        const newTeam = { id: Date.now(), name: teamName, score: 0 };
        gameState.teams.push(newTeam);
        saveState();
        broadcastState();
    });
    socket.on('teams:delete', ({ teamId }) => {
        gameState.teams = gameState.teams.filter(team => team.id !== teamId);
        saveState();
        broadcastState();
    });

    // Dashboard: Scoring
    socket.on('teams:updateScore', ({ teamId, points }) => {
        const team = gameState.teams.find(t => t.id === teamId);
        if (team) {
            team.score += points;
            saveState();
            broadcastState();
        }
    });
// --- FIND THIS BLOCK in server.js and REPLACE IT ---
/*
    // Dashboard: Game Flow
    socket.on('controls:nextQuestion', () => { ... });
    socket.on('controls:toggleAnswer', () => { ... });
    socket.on('controls:clearScreen', () => { ... });
    socket.on('controls:startTimer', () => io.emit('startTimer'));
    socket.on('controls:lifeline', (type) => { ... });
    socket.on('controls:setRound', ({ round }) => { ... });
*/

// --- REPLACE IT WITH THIS CORRECTED BLOCK ---
    // Dashboard: Game Flow
    socket.on('controls:nextQuestion', () => {
        console.log(`Advancing question in Round ${gameState.gameState.currentRound}`);
        gameState.gameState.isScreenActive = true;
        const roundKey = `round${gameState.gameState.currentRound}`;
        if (shuffledQuestions[roundKey] && gameState.gameState.currentQuestionIndex < shuffledQuestions[roundKey].length - 1) {
            gameState.gameState.currentQuestionIndex++;
            saveState();
            broadcastState();
            io.emit('hideAnswer');
        } else {
            console.log(`End of Round ${gameState.gameState.currentRound} reached.`);
        }
    });
    socket.on('controls:toggleAnswer', () => {
        const roundKey = `round${gameState.gameState.currentRound}`;
        const question = shuffledQuestions[roundKey]?.[gameState.gameState.currentQuestionIndex];
        if (question) io.emit('showAnswer', question.answer);
    });
    socket.on('controls:clearScreen', () => {
        gameState.gameState.isScreenActive = false;
        saveState();
        broadcastState();
        io.emit('hideAnswer');
    });
    socket.on('controls:setRound', ({ round }) => {
        console.log(`Setting game to Round ${round}`);
        gameState.gameState.currentRound = round;
        gameState.gameState.currentQuestionIndex = -1; // Reset index, ready for the first question
        gameState.gameState.isScreenActive = false; // Show the curtain screen
        saveState();
        broadcastState(); // Broadcast the change immediately
    });
    socket.on('controls:startTimer', () => io.emit('startTimer'));
    socket.on('controls:lifeline', (type) => { /* Lifeline logic can be expanded here */ });
    // Dashboard: Reset Controls
    socket.on('controls:resetScores', () => {
        gameState.teams.forEach(team => team.score = 0);
        saveState();
        broadcastState();
    });
    socket.on('controls:clearTeams', () => {
        gameState.teams = [];
        saveState();
        broadcastState();
    });
    socket.on('controls:resetGame', () => {
        gameState.teams.forEach(team => team.score = 0);
        gameState.gameState.currentRound = 1;
        gameState.gameState.currentQuestionIndex = -1;
        gameState.gameState.isScreenActive = false;
        setupNewGameQuestions(); // Re-shuffle questions for the new game
        saveState();
        broadcastState();
    });
});

// --- START THE SERVER ---
server.listen(PORT, () => {
    loadInitialState();
    console.log(`--------- KBCS SERVER IS LIVE (v2.2 Stable) ---------`);
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔧 Access Team Setup at:           http://localhost:${PORT}/setup`);
    console.log(`🎮 Access the Marking Dashboard at: http://localhost:${PORT}/dashboard`);
    console.log(`📺 Access the Quiz Platform at:     http://localhost:${PORT}/quiz`);
    console.log(`-----------------------------------------------------`);
});