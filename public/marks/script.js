// KBCS Marks Chart Script v4.0 - FINAL VERSION

// Connect to the server
const socket = io();

// Get the canvas element from the HTML
const ctx = document.getElementById('scoreChart');

// --- Chart.js Configuration ---

// Global styling options for the chart to match our "Neon Night" theme
Chart.defaults.color = '#e0e1dd';
Chart.defaults.font.family = 'Roboto';
Chart.defaults.font.size = 16;
Chart.defaults.font.weight = 'bold';

// Initialize the chart object. It starts with no data.
const scoreChart = new Chart(ctx, {
    type: 'bar', // We will use a bar chart for a clear pictorial representation
    data: {
        labels: [], // Team names will go here
        datasets: [{
            label: 'Scores',
            data: [], // Team scores will go here
            backgroundColor: [
                'rgba(255, 0, 110, 0.6)', // Accent Pink
                'rgba(0, 245, 212, 0.6)', // Accent Teal
                'rgba(254, 228, 64, 0.6)'  // Accent Yellow
            ],
            borderColor: [
                'rgba(255, 0, 110, 1)',
                'rgba(0, 245, 212, 1)',
                'rgba(254, 228, 64, 1)'
            ],
            borderWidth: 2
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // This makes the bar chart horizontal, better for reading team names
        scales: {
            x: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(65, 90, 119, 0.5)' // Border Accent with opacity
                },
                ticks: {
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                }
            },
            y: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false // We don't need a legend for a single dataset
            },
            title: {
                display: true,
                text: 'Live Team Scores',
                font: {
                    size: 24,
                    family: 'Teko'
                }
            }
        }
    }
});

// --- Socket Listener ---

// This is the main listener that receives all game state updates
socket.on('updateState', (state) => {
    // Sort teams by score in descending order for a ranked view
    const sortedTeams = [...state.teams].sort((a, b) => a.score - b.score);

    // Extract the names and scores from the sorted data
    const teamNames = sortedTeams.map(team => team.name);
    const teamScores = sortedTeams.map(team => team.score);

    // Update the chart's data with the new information
    scoreChart.data.labels = teamNames;
    scoreChart.data.datasets[0].data = teamScores;

    // Tell Chart.js to re-render with a smooth animation
    scoreChart.update();
});