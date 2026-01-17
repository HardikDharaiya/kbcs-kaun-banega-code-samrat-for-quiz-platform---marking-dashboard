# Kaun Banega Code Samrat (KBCS) - Live Quiz & Event Platform

> An all-in-one, locally-hosted, real-time quiz and event management platform designed for engaging live tech events. Built from the ground up in just two days by a team of two first-semester MCA students.

![KBCS Quiz Screen](https://via.placeholder.com/800x450.png/0d1b2a/e0e1dd?text=KBCS+Quiz+Platform)

## About The Project

"Kaun Banega Code Samrat" was born from the need to create a professional, TV-style quiz show experience for a college event, entirely offline and without any budget. The entire system is self-contained and runs on a single local machine, with dedicated browser windows for the audience display and the coordinator's control panel.

This project is a complete suite of tools for managing a live quiz from start to finish: from adding teams, controlling the game flow, to displaying scores in a beautiful, pictorial format. It was designed with a modern, engaging UI/UX to create a memorable and exciting experience for all participants.

## Core Features

*   **Real-Time Synchronization:** A powerful `Node.js` + `Socket.IO` backend ensures that the Coordinator's Dashboard, the main Quiz Platform, and the Marks Chart are all perfectly in sync with zero latency.
*   **Multi-Panel Interface:**
    *   **Quiz Platform:** The main screen for the audience, featuring dynamic animations, timers, and a live leaderboard.
    *   **Marking Dashboard:** A comprehensive control panel for the event manager to control every aspect of the game.
    *   **Team Setup Panel:** A user-friendly page for non-technical coordinators to add and manage teams before the event.
    *   **Live Marks Chart:** A beautiful, pictorial, real-time bar chart that visualizes team scores, perfect for a secondary broadcast screen.
*   **Thematic & Dynamic Rounds:**
    *   **Round 1 (Rapid Fire):** A fast-paced text and trivia round.
    *   **Round 2 (Visual Puzzles):** An engaging round featuring image-based questions.
*   **Engaging Game Mechanics:**
    *   **Lifelines:** Includes "50:50" and "Swap Question" to add a strategic layer to the game.
    *   **Full Timer Control:** Dedicated controls for both a 30-second question timer (`Start`, `Stop`, `Reset`) and an automatic round timer.
*   **Modern UI/UX:**
    *   A custom "Neon Night" color palette creates a vibrant, professional, and consistent aesthetic.
    *   Integrated `Animate.css` library provides smooth, broadcast-quality animations for questions, answers, and transitions.
*   **100% Offline Functionality:** All libraries and assets (`Chart.js`, `Animate.css`) are hosted locally, requiring zero internet connection to run the event.

## Tech Stack

This project was built with a focus on speed, reliability, and ease of local deployment.

*   **Backend:** Node.js, Express.js
*   **Real-Time Communication:** Socket.IO
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript
*   **Charting Library:** Chart.js
*   **Animation Library:** Animate.css
*   **Data Management:** Local JSON files (`database.json`, `questions.json`)

## Project Structure
```
project_kbcs/
├── data/
│ ├── database.json
│ └── questions.json
├── public/
│ ├── assets/
│ │ ├── images/
│ │ └── libs/
│ │ ├── animate.min.css
│ │ └── chart.umd.js
│ ├── dashboard/
│ ├── marks/
│ ├── quiz/
│ └── setup/
└── server.js
```


## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You must have [Node.js](https://nodejs.org/) installed on your machine.

### Installation & Launch

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/HardikDharaiya/kbcs-kaun-banega-code-samrat-for-quiz-platform---marking-dashboard.git
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd project_kbcs
    ```
3.  **Install NPM packages:**
    ```sh
    npm install
    ```
4.  **Start the server:**
    ```sh
    node server.js
    ```
    The terminal will confirm that the server is live and provide the URLs for all panels.

## Usage - The Event Day Guide

The application runs on **port 8080**.

1.  **Step 1: Team Setup**
    *   Navigate to `http://localhost:8080/setup`.
    *   Use this page to add all the participating teams.

2.  **Step 2: Open the Control Panels**
    *   On your main laptop screen, open the **Marking Dashboard**: `http://localhost:8080/dashboard`. This is your command center.
    *   Optionally, open the **Live Marks Chart** in a new window to display on a secondary monitor: `http://localhost:8080/marks`.

3.  **Step 3: Prepare the Main Screen**
    *   Open the **Quiz Platform**: `http://localhost:8080/quiz`.
    *   Move this browser window to the main projector screen and put it in full-screen mode (`F11`).

4.  **Step 4: Run the Show!**
    *   Use the buttons on your dashboard to control the entire event, from starting rounds and showing questions to managing lifelines and timers.


