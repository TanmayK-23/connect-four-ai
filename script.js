const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status-text');
const turnIndicator = document.getElementById('turn-indicator');
const difficultySelect = document.getElementById('difficulty');
const resetBtn = document.getElementById('reset-btn');
const aiThinkingIndicator = document.getElementById('ai-thinking');

const ROWS = 6;
const COLS = 7;
const CELL_SIZE = 100;
const RADIUS = 40;

// Colors
const COLOR_EMPTY = '#0f172a'; // Canvas background
const COLOR_BOARD = 'rgba(30, 55, 153, 0.9)'; // Dark blue with some transparency
const COLOR_RED = '#eb3b5a';
const COLOR_YELLOW = '#f7b731';

let board = [];
let currentPlayer = 'red'; // 'red' (human) or 'yellow' (AI)
let gameActive = false;
let isAnimating = false;
let animatedPiece = null;

// Audio context for sound effects (optional future enhancement)
function createEmptyBoard() {
    return Array.from({ length: ROWS }, () => fillArray(COLS, null));
}

function fillArray(len, val) {
    const arr = [];
    for (let i = 0; i < len; i++) arr.push(val);
    return arr;
}

function initGame() {
    board = createEmptyBoard();
    currentPlayer = 'red';
    gameActive = true;
    isAnimating = false;
    animatedPiece = null;
    
    updateStatus();
    drawBoard();
}

function getGradient(ctx, x, y, color) {
    const gradient = ctx.createRadialGradient(x - 10, y - 10, 5, x, y, RADIUS);
    if (color === 'red') {
        gradient.addColorStop(0, '#ff7675');
        gradient.addColorStop(1, '#d63031');
    } else if (color === 'yellow') {
        gradient.addColorStop(0, '#ffeaa7');
        gradient.addColorStop(1, '#fdcb6e');
    }
    return gradient;
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw existing pieces on board
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) {
                drawDisc(r, c, board[r][c]);
            }
        }
    }
    
    // Draw animated piece if any
    if (animatedPiece) {
        drawDiscAtExactLocation(animatedPiece.x, animatedPiece.y, animatedPiece.color);
    }

    // Draw Blue Board Overlay with holes
    ctx.fillStyle = COLOR_BOARD;
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const centerX = c * CELL_SIZE + CELL_SIZE / 2;
            const centerY = r * CELL_SIZE + CELL_SIZE / 2;
            
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, RADIUS, 0, Math.PI * 2, true);
        }
    }
    ctx.fill();
    
    // Draw inner shadows for holes (for depth)
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const centerX = c * CELL_SIZE + CELL_SIZE / 2;
            const centerY = r * CELL_SIZE + CELL_SIZE / 2;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, RADIUS, 0, Math.PI * 2, false);
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, RADIUS, 0, Math.PI * 2, false);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.stroke();
        }
    }
}

function drawDisc(row, col, color) {
    const centerX = col * CELL_SIZE + CELL_SIZE / 2;
    const centerY = row * CELL_SIZE + CELL_SIZE / 2;
    drawDiscAtExactLocation(centerX, centerY, color);
}

function drawDiscAtExactLocation(x, y, color) {
    ctx.beginPath();
    ctx.arc(x, y, RADIUS - 2, 0, Math.PI * 2);
    ctx.fillStyle = getGradient(ctx, x, y, color);
    ctx.fill();
    
    // Subtle shadow/edge
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
}

function updateStatus() {
    turnIndicator.className = 'indicator ' + currentPlayer;
    if (!gameActive) {
        return; // Handled by win/draw logic
    }
    
    if (currentPlayer === 'red') {
        statusText.textContent = "Your Turn!";
        aiThinkingIndicator.classList.add('hidden');
    } else {
        statusText.textContent = "AI is computing...";
        aiThinkingIndicator.classList.remove('hidden');
    }
}

function getAvailableRow(boardState, col) {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (!boardState[r][col]) {
            return r;
        }
    }
    return -1; // Column full
}

canvas.addEventListener('click', (e) => {
    if (!gameActive || isAnimating || currentPlayer !== 'red') return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const col = Math.floor(x / (rect.width / COLS));
    
    if (col >= 0 && col < COLS) {
        attemptMove(col);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!gameActive || isAnimating || currentPlayer !== 'red') {
        canvas.style.cursor = 'default';
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const col = Math.floor(x / (rect.width / COLS));
    
    if (col >= 0 && col < COLS && getAvailableRow(board, col) !== -1) {
        canvas.style.cursor = 'pointer';
    } else {
        canvas.style.cursor = 'not-allowed';
    }
});

function attemptMove(col) {
    const row = getAvailableRow(board, col);
    if (row !== -1) {
        animateDrop(col, row, currentPlayer, () => {
            board[row][col] = currentPlayer;
            drawBoard(); // Ensure the board visually includes the landed piece
            const winner = checkWinner(board);
            if (winner) {
                endGame(winner);
            } else if (isBoardFull(board)) {
                endGame('draw');
            } else {
                currentPlayer = currentPlayer === 'red' ? 'yellow' : 'red';
                updateStatus();
                if (currentPlayer === 'yellow') {
                    // AI Turn
                    setTimeout(aiMove, 50); // slight delay to ensure UI updates
                }
            }
        });
    }
}

function animateDrop(col, targetRow, color, callback) {
    isAnimating = true;
    const startY = -CELL_SIZE;
    const targetY = targetRow * CELL_SIZE + CELL_SIZE / 2;
    const x = col * CELL_SIZE + CELL_SIZE / 2;
    
    animatedPiece = {
        x: x,
        y: startY,
        color: color,
        velocity: 0
    };
    
    const gravity = 1.5;
    const bounce = -0.4;
    
    function frame() {
        animatedPiece.velocity += gravity;
        animatedPiece.y += animatedPiece.velocity;
        
        // Bounce logic
        if (animatedPiece.y >= targetY) {
            animatedPiece.y = targetY;
            animatedPiece.velocity *= bounce;
            
            // Stop if velocity is very small
            if (Math.abs(animatedPiece.velocity) < 2) {
                animatedPiece = null;
                isAnimating = false;
                drawBoard(); // Ensure final solid state is drawn
                callback();
                return;
            }
        }
        
        drawBoard();
        requestAnimationFrame(frame);
    }
    
    requestAnimationFrame(frame);
}

// --------------------------------------------------------
// Game Logic Rules (Stubs to be implemented)
// --------------------------------------------------------

function checkWinner(boardState) {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const p = boardState[r][c];
            if (p && p === boardState[r][c+1] && p === boardState[r][c+2] && p === boardState[r][c+3]) {
                return { winner: p, discs: [{r,c}, {r, c:c+1}, {r, c:c+2}, {r, c:c+3}] };
            }
        }
    }
    // Vertical
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS; c++) {
            const p = boardState[r][c];
            if (p && p === boardState[r+1][c] && p === boardState[r+2][c] && p === boardState[r+3][c]) {
                return { winner: p, discs: [{r,c}, {r:r+1, c}, {r:r+2, c}, {r:r+3, c}] };
            }
        }
    }
    // Diagonal \
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const p = boardState[r][c];
            if (p && p === boardState[r+1][c+1] && p === boardState[r+2][c+2] && p === boardState[r+3][c+3]) {
                return { winner: p, discs: [{r,c}, {r:r+1, c:c+1}, {r:r+2, c:c+2}, {r:r+3, c:c+3}] };
            }
        }
    }
    // Diagonal /
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            const p = boardState[r][c];
            if (p && p === boardState[r-1][c+1] && p === boardState[r-2][c+2] && p === boardState[r-3][c+3]) {
                return { winner: p, discs: [{r,c}, {r:r-1, c:c+1}, {r:r-2, c:c+2}, {r:r-3, c:c+3}] };
            }
        }
    }
    return null;
}

function isBoardFull(boardState) {
    for (let c = 0; c < COLS; c++) {
        if (!boardState[0][c]) return false;
    }
    return true;
}

function drawWinningLine(discs) {
    ctx.beginPath();
    const startX = discs[0].c * CELL_SIZE + CELL_SIZE / 2;
    const startY = discs[0].r * CELL_SIZE + CELL_SIZE / 2;
    const endX = discs[3].c * CELL_SIZE + CELL_SIZE / 2;
    const endY = discs[3].r * CELL_SIZE + CELL_SIZE / 2;
    
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Add glow
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function endGame(result) {
    gameActive = false;
    aiThinkingIndicator.classList.add('hidden');
    
    if (result === 'draw') {
        statusText.textContent = "It's a Draw!";
        statusText.style.color = '#f8fafc';
    } else {
        const winner = result.winner;
        if (winner === 'red') {
            statusText.textContent = "You Win!";
            statusText.style.color = '#ff7675';
        } else if (winner === 'yellow') {
            statusText.textContent = "AI Wins!";
            statusText.style.color = '#ffeaa7';
        }
        drawWinningLine(result.discs);
    }
}

// --------------------------------------------------------
// AI Logic (Stubs to be implemented)
// --------------------------------------------------------

function getLegalMoves(boardState) {
    const moves = [];
    for (let c = 0; c < COLS; c++) {
        if (getAvailableRow(boardState, c) !== -1) {
            moves.push(c);
        }
    }
    return moves;
}

function copyBoard(boardState) {
    return boardState.map(row => [...row]);
}

function simulateDrop(boardState, col, player) {
    const newBoard = copyBoard(boardState);
    const row = getAvailableRow(newBoard, col);
    if (row !== -1) {
        newBoard[row][col] = player;
    }
    return newBoard;
}

function evaluateWindow(window) {
    let score = 0;
    let yellowCount = 0;
    let redCount = 0;
    
    for (let i = 0; i < 4; i++) {
        if (window[i] === 'yellow') yellowCount++;
        else if (window[i] === 'red') redCount++;
    }
    
    if (yellowCount > 0 && redCount > 0) return 0;
    
    if (yellowCount === 1) score += 1;
    else if (yellowCount === 2) score += 10;
    else if (yellowCount === 3) score += 100;
    
    if (redCount === 1) score -= 1;
    else if (redCount === 2) score -= 10;
    else if (redCount === 3) score -= 100;
    
    return score;
}

function evaluateBoard(boardState) {
    let score = 0;
    
    // Score center column preference
    let centerArray = [];
    for (let r = 0; r < ROWS; r++) {
        centerArray.push(boardState[r][Math.floor(COLS / 2)]);
    }
    let centerYellowCount = centerArray.filter(p => p === 'yellow').length;
    score += centerYellowCount * 3;
    
    // Horizontal windows
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            let window = [boardState[r][c], boardState[r][c+1], boardState[r][c+2], boardState[r][c+3]];
            score += evaluateWindow(window);
        }
    }
    // Vertical windows
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS; c++) {
            let window = [boardState[r][c], boardState[r+1][c], boardState[r+2][c], boardState[r+3][c]];
            score += evaluateWindow(window);
        }
    }
    // Diagonal \
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            let window = [boardState[r][c], boardState[r+1][c+1], boardState[r+2][c+2], boardState[r+3][c+3]];
            score += evaluateWindow(window);
        }
    }
    // Diagonal /
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            let window = [boardState[r][c], boardState[r-1][c+1], boardState[r-2][c+2], boardState[r-3][c+3]];
            score += evaluateWindow(window);
        }
    }
    return score;
}

function minimax(boardState, depth, alpha, beta, isMaximizing) {
    const winnerObj = checkWinner(boardState);
    if (winnerObj) {
        if (winnerObj.winner === 'yellow') return 100000 + depth;
        if (winnerObj.winner === 'red') return -100000 - depth;
    }
    if (isBoardFull(boardState)) return 0;
    if (depth === 0) return evaluateBoard(boardState);

    const legalMoves = getLegalMoves(boardState);
    
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let col of legalMoves) {
            const newBoard = simulateDrop(boardState, col, 'yellow');
            const evalScore = minimax(newBoard, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let col of legalMoves) {
            const newBoard = simulateDrop(boardState, col, 'red');
            const evalScore = minimax(newBoard, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function aiMove() {
    if (!gameActive) return;
    
    const difficulty = difficultySelect.value;
    const legalMoves = getLegalMoves(board);
    
    if (legalMoves.length === 0) return;
    
    let chosenCol = -1;
    
    // Simulate thinking delay context to ensure UI repaints
    setTimeout(() => {
        if (difficulty === 'easy') {
            const randomIndex = Math.floor(Math.random() * legalMoves.length);
            chosenCol = legalMoves[randomIndex];
        } else {
            const depth = difficulty === 'medium' ? 4 : 6;
            let bestScore = -Infinity;
            let bestCols = [];
            
            for (let col of legalMoves) {
                const newBoard = simulateDrop(board, col, 'yellow');
                const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestCols = [col];
                } else if (score === bestScore) {
                    bestCols.push(col);
                }
            }
            // Pick randomly from equal best routes to add variety
            chosenCol = bestCols[Math.floor(Math.random() * bestCols.length)];
        }
        
        attemptMove(chosenCol);
    }, 150);
}

// Initialize
resetBtn.addEventListener('click', initGame);
initGame();
