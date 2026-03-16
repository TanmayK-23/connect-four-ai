# Connect Four AI: Adversarial Search in the Browser

A robust, zero-latency Connect Four web application featuring an intelligent AI opponent powered by the Minimax algorithm with Alpha-Beta pruning. Built entirely using client-side web technologies (HTML5, CSS3, JavaScript) with no backend server required.

## 🎮 Play the Game
Simply open `index.html` in any modern web browser to start playing! No installation or build steps required.

## ✨ Features
*   **Play Against AI:** Challenge the computer in a classic game of Connect Four.
*   **Adjustable Difficulty:**
    *   **Easy:** The AI plays randomly.
    *   **Medium:** The AI looks ahead 4 moves (plies) to calculate threats and opportunities.
    *   **Hard:** The AI looks ahead 6 moves, utilizing deep adversarial search to play a highly competitive game.
*   **Responsive UI:** Beautiful, modern dark-mode aesthetic built with Flexbox that scales to both desktop and mobile screens.
*   **Smooth Animations:** Physics-based gravity and bounce animations when dropping discs.
*   **Zero-Latency Compute:** The Minimax algorithm utilizes Alpha-Beta pruning to evaluate thousands of board states in milliseconds, ensuring the UI remains unblocked.
*   **Visual Enhancements:** An "AI is thinking..." spinner and glowing highlight effects for the winning line.

## 🧠 How the AI Works

The computer opponent relies on **Adversarial Search** concepts from Game Theory to make its decisions:

1.  **Minimax Algorithm:** The AI simulates future turns, trying to *maximize* its own score while assuming the human player will always make the moves that *minimize* the AI's score.
2.  **Alpha-Beta Pruning:** An optimization technique that drastically reduces the number of board states the Minimax algorithm needs to evaluate. It stops evaluating a branch of the game tree as soon as it determines that the branch guarantees a worse outcome than a previously analyzed branch.
3.  **Heuristic Evaluation:** When the AI reaches its depth limit (e.g., 6 moves ahead) without finding a guaranteed win or loss, it uses a heuristic function to "guess" how good the board state is. It does this by analyzing all 69 possible 4-cell windows (horizontal, vertical, diagonal) and assigning scores based on how many AI discs vs. human discs are in each window, with a bonus for controlling the center column.

## 🛠️ Technology Stack
*   **HTML5:** Application structure and the `<canvas>` element for high-performance board rendering.
*   **CSS3:** Styling, layout, customized UI controls, and hover effects.
*   **JavaScript (ES6+):** Game logic, state management, UI event listeners, animation frames, and the complete AI search implementation.

## 🚀 How to Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/connect-four-ai.git
   ```
2. Navigate to the project directory:
   ```bash
   cd connect-four-ai
   ```
3. Open `index.html` in your web browser, or use a live server extension in VS Code.

## 📄 License
This project is open-source and available under the MIT License.
