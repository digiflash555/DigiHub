const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// Check if player has won on current board
const checkWinner = (board) => {
    for (const combo of WINNING_COMBOS) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], combo };
        }
    }
    const isDraw = board.every(cell => cell !== null && cell !== '');
    if (isDraw) return { winner: 'Draw', combo: [] };
    return null;
};

// Get available empty indices
const getEmptyIndices = (board) => {
    const empty = [];
    for (let i = 0; i < board.length; i++) {
        if (!board[i] || board[i] === '') {
            empty.push(i);
        }
    }
    return empty;
};

// Minimax algorithm for optimal play (AI is 'O', Human is 'X')
const minimax = (board, depth, isMaximizing) => {
    const result = checkWinner(board);
    if (result) {
        if (result.winner === 'O') return 10 - depth;
        if (result.winner === 'X') return depth - 10;
        if (result.winner === 'Draw') return 0;
    }

    const availableMoves = getEmptyIndices(board);

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (const move of availableMoves) {
            board[move] = 'O';
            const score = minimax(board, depth + 1, false);
            board[move] = null;
            bestScore = Math.max(score, bestScore);
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (const move of availableMoves) {
            board[move] = 'X';
            const score = minimax(board, depth + 1, true);
            board[move] = null;
            bestScore = Math.min(score, bestScore);
        }
        return bestScore;
    }
};

// Main function to get AI move
const getAIMove = (board, difficulty = 'Hard') => {
    const availableMoves = getEmptyIndices(board);
    if (availableMoves.length === 0) return null;

    // Normalizing board format (converting empty strings to null for consistency)
    const normalizedBoard = board.map(cell => (cell === '' || cell === undefined) ? null : cell);

    if (difficulty === 'Easy') {
        const randomIndex = Math.floor(Math.random() * availableMoves.length);
        return availableMoves[randomIndex];
    }

    if (difficulty === 'Medium') {
        // 50% chance of making an optimal move, 50% random
        if (Math.random() < 0.5) {
            const randomIndex = Math.floor(Math.random() * availableMoves.length);
            return availableMoves[randomIndex];
        }
    }

    // Hard difficulty or Medium optimal branch: Minimax
    let bestScore = -Infinity;
    let bestMove = availableMoves[0];

    for (const move of availableMoves) {
        normalizedBoard[move] = 'O';
        const score = minimax(normalizedBoard, 0, false);
        normalizedBoard[move] = null;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
};

module.exports = {
    checkWinner,
    getEmptyIndices,
    getAIMove,
    WINNING_COMBOS
};
