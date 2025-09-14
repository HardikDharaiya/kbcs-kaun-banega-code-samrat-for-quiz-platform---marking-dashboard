// KBCS Quiz Platform Script v3.3 - FINAL CLEAN VERSION

const socket = io();

// Get DOM elements
const curtain = document.getElementById('curtain');
const answerOverlay = document.getElementById('answerOverlay');
const leaderboardList = document.getElementById('leaderboardList');
const optionsContainer = document.getElementById('optionsContainer');
const roundIndicator = document.getElementById('roundIndicator');
const questionText = document.getElementById('questionText');
const answerText = document.getElementById('answerText');
const questionImage = document.getElementById('questionImage');
const curtainText = curtain.querySelector('h2');
const answerOverlayText = answerOverlay.querySelector('h2');
const thankYouOverlay = document.getElementById('thankYouOverlay');

// Timer Text Elements
const timerText = document.getElementById('timerText');
const roundTimerText = document.getElementById('roundTimerText');

// Timer State
let questionCountdownInterval = null;

// --- Helper Functions ---

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const animateCSS = (element, animation) =>
  new Promise((resolve, reject) => {
    const animationName = `animate__${animation}`;
    element.classList.add('animate__animated', animationName);

    function handleAnimationEnd(event) {
      event.stopPropagation();
      element.classList.remove('animate__animated', animationName);
      resolve('Animation ended');
    }

    element.addEventListener('animationend', handleAnimationEnd, { once: true });
  });

// --- Socket Listeners ---

socket.on('updateState', (state) => {
    renderLeaderboard(state.teams);
    roundIndicator.textContent = `Round ${state.gameState.currentRound}`;
    
    if (!state.gameState.isScreenActive) {
        animateCSS(curtainText, 'zoomIn');
    }

    curtain.classList.toggle('visible', !state.gameState.isScreenActive);
    curtain.classList.toggle('hidden', state.gameState.isScreenActive);

    if (state.gameState.isScreenActive) {
        renderQuestion(state.currentQuestion);
    } else {
        questionText.textContent = "The Quiz will begin shortly...";
        optionsContainer.innerHTML = '';
        questionImage.classList.add('hidden');
    }
});

socket.on('showAnswer', (correctAnswer) => {
    answerOverlay.classList.remove('hidden');
    answerText.textContent = correctAnswer;
    animateCSS(answerOverlayText, 'tada');
    const allOptions = optionsContainer.querySelectorAll('.option-item');
    allOptions.forEach(optionEl => {
        if (optionEl.dataset.option === correctAnswer) {
            optionEl.classList.add('correct');
        }
    });
});

socket.on('hideAnswer', () => {
    answerOverlay.classList.add('hidden');
});

socket.on('lifeline:5050', (optionsToHide) => {
    const allOptions = optionsContainer.querySelectorAll('.option-item');
    allOptions.forEach(optionEl => {
        if (optionsToHide.includes(optionEl.dataset.option)) {
            optionEl.classList.add('hidden-5050');
        }
    });
});

socket.on('startQuestionTimer', () => {
    if (questionCountdownInterval) clearInterval(questionCountdownInterval);
    let time = 30;
    timerText.textContent = time;
    questionCountdownInterval = setInterval(() => {
        time--;
        timerText.textContent = time;
        if (time <= 0) {
            clearInterval(questionCountdownInterval);
            timerText.textContent = "0";
        }
    }, 1000);
});

socket.on('stopQuestionTimer', () => {
    if (questionCountdownInterval) {
        clearInterval(questionCountdownInterval);
    }
});

socket.on('resetQuestionTimer', () => {
    if (questionCountdownInterval) {
        clearInterval(questionCountdownInterval);
    }
    timerText.textContent = "30";
});

socket.on('roundTimeUpdate', (totalSeconds) => {
    roundTimerText.textContent = formatTime(totalSeconds);
});

// --- ADD THIS NEW BLOCK ---
// Listens for the command to show the final thank you screen
socket.on('showThankYou', () => {
    // Hide all other overlays
    curtain.classList.add('hidden');
    answerOverlay.classList.add('hidden');
    // Show the thank you overlay
    thankYouOverlay.classList.remove('hidden');
    thankYouOverlay.classList.add('visible');

    // Animate the credits text
    const credits = thankYouOverlay.querySelector('.credits h1');
    if(credits) {
        animateCSS(credits, 'zoomIn');
    }
});


// --- UI Rendering Functions ---

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
    animateCSS(questionText, 'fadeInUp');
    if (questionData.image) {
        questionImage.src = questionData.image;
        questionImage.classList.remove('hidden');
        animateCSS(questionImage, 'fadeIn');
    } else {
        questionImage.classList.add('hidden');
        questionImage.src = '';
    }
    const prefixes = ['A', 'B', 'C', 'D'];
    questionData.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option-item';
        optionElement.dataset.option = option;
        optionElement.innerHTML = `<span class="option-prefix">${prefixes[index]}</span><span class="option-text">${option}</span>`;
        optionElement.style.setProperty('--animate-duration', '0.8s');
        setTimeout(() => {
            optionsContainer.appendChild(optionElement);
            animateCSS(optionElement, 'fadeIn');
        }, index * 150);
    });
}

function renderLeaderboard(teams) {
    if (!teams) return;
    leaderboardList.innerHTML = '';
    const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
    sortedTeams.forEach(team => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<span>${team.name}</span><span>${team.score}</span>`;
        animateCSS(listItem, 'fadeInLeft');
        leaderboardList.appendChild(listItem);
    });
}