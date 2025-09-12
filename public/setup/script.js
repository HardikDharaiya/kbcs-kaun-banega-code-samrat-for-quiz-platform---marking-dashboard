// --- Establish Connection & Get DOM Elements ---
const socket = io();

// Add team form elements
const teamNameInput = document.getElementById('teamNameInput');
const addTeamBtn = document.getElementById('addTeamBtn');

// Team list container
const teamList = document.getElementById('teamList');


// --- Socket.IO Event Listeners ---

socket.on('connect', () => {
    console.log('Connected to KBCS server for setup.');
});

// The server sends the latest state upon connection and after every change
socket.on('updateState', (state) => {
    console.log('Received state update:', state);
    renderTeamList(state.teams);
});

socket.on('disconnect', () => {
    console.warn('Disconnected from server.');
});


// --- UI Rendering ---

function renderTeamList(teams) {
    if (!teams) return;

    teamList.innerHTML = ''; // Clear the current list

    if (teams.length === 0) {
        const placeholder = document.createElement('li');
        placeholder.textContent = 'No teams have been added yet.';
        placeholder.style.color = '#a0a0a0';
        teamList.appendChild(placeholder);
        return;
    }

    teams.forEach(team => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${team.name}</span>
            <button class="delete-btn" data-team-id="${team.id}">Delete</button>
        `;
        teamList.appendChild(listItem);
    });
}


// --- Event Emitters (Sending commands to the server) ---

// Add a new team
addTeamBtn.addEventListener('click', () => {
    const teamName = teamNameInput.value.trim();
    if (teamName) {
        socket.emit('teams:add', { teamName });
        teamNameInput.value = ''; // Clear input field
    } else {
        alert('Please enter a team name.');
    }
});

// Allow pressing Enter to add a team
teamNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addTeamBtn.click();
    }
});

// Delete a team (using event delegation)
teamList.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-btn')) {
        const teamId = parseInt(event.target.dataset.teamId);
        if (confirm('Are you sure you want to delete this team?')) {
            socket.emit('teams:delete', { teamId });
        }
    }
});