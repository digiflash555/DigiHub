// 15x15 Ludo Grid Constants & Path Maps
export const PLAYER_COLORS = {
    Red: { hex: '#E53935', bg: 'bg-red-600', text: 'text-red-500', border: 'border-red-500', glow: 'rgba(229,57,53,0.6)', light: 'bg-red-500/10' },
    Green: { hex: '#43A047', bg: 'bg-emerald-600', text: 'text-emerald-500', border: 'border-emerald-500', glow: 'rgba(67,160,71,0.6)', light: 'bg-emerald-500/10' },
    Yellow: { hex: '#FDD835', bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', glow: 'rgba(253,216,53,0.6)', light: 'bg-amber-500/10' },
    Blue: { hex: '#1E88E5', bg: 'bg-blue-600', text: 'text-blue-500', border: 'border-blue-500', glow: 'rgba(30,136,229,0.6)', light: 'bg-blue-500/10' }
};

export const PLAYER_START_INDEX = {
    Red: 0,
    Green: 13,
    Yellow: 26,
    Blue: 39
};

// Safe Cell indices on the 52-cell main path (0..51)
export const SAFE_CELL_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// Base Yards 4 positions per player (row, col)
export const BASE_POSITIONS = {
    Red: [ { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 } ],
    Green: [ { r: 2, c: 11 }, { r: 2, c: 12 }, { r: 3, c: 11 }, { r: 3, c: 12 } ],
    Yellow: [ { r: 11, c: 11 }, { r: 11, c: 12 }, { r: 12, c: 11 }, { r: 12, c: 12 } ],
    Blue: [ { r: 11, c: 2 }, { r: 11, c: 3 }, { r: 12, c: 2 }, { r: 12, c: 3 } ]
};

// 52 Main Path Cell Coordinates (row 0..14, col 0..14)
export const MAIN_PATH = [
    { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 }, // 0..4 (Red Start = 0)
    { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 }, // 5..10
    { r: 0, c: 7 }, { r: 0, c: 8 }, // 11, 12
    { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }, // 13..17 (Green Start = 13)
    { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 }, // 18..23
    { r: 7, c: 14 }, { r: 8, c: 14 }, // 24, 25
    { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 }, // 26..30 (Yellow Start = 26)
    { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 }, // 31..36
    { r: 14, c: 7 }, { r: 14, c: 6 }, // 37, 38
    { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 }, // 39..43 (Blue Start = 39)
    { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 }, // 44..49
    { r: 7, c: 0 }, { r: 6, c: 0 } // 50, 51
];

// Private Home Paths (5 steps + 6th center home)
export const HOME_PATHS = {
    Red: [ { r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 } ],
    Green: [ { r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }, { r: 6, c: 7 } ],
    Yellow: [ { r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 8 } ],
    Blue: [ { r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }, { r: 8, c: 7 } ]
};

// Initial Tokens Creator
export const createInitialTokens = () => {
    const tokens = {};
    ['Red', 'Green', 'Yellow', 'Blue'].forEach(player => {
        tokens[player] = BASE_POSITIONS[player].map((basePos, idx) => ({
            id: idx,
            player,
            stepCount: 0, // 0 = base, 1..51 = main path, 52..56 = home path, 57 = center home!
            basePos
        }));
    });
    return tokens;
};

// Get Token Grid Coordinates (row, col)
export const getTokenCoordinates = (token) => {
    if (token.stepCount === 0) {
        return token.basePos;
    }
    if (token.stepCount >= 1 && token.stepCount <= 51) {
        const startIndex = PLAYER_START_INDEX[token.player];
        const pathIndex = (startIndex + token.stepCount - 1) % 52;
        return MAIN_PATH[pathIndex];
    }
    if (token.stepCount >= 52 && token.stepCount <= 57) {
        const homeIndex = Math.min(token.stepCount - 52, 5);
        return HOME_PATHS[token.player][homeIndex];
    }
    return token.basePos;
};

// Get Main Path Index for token (returns -1 if in base or home path)
export const getMainPathIndex = (token) => {
    if (token.stepCount >= 1 && token.stepCount <= 51) {
        const startIndex = PLAYER_START_INDEX[token.player];
        return (startIndex + token.stepCount - 1) % 52;
    }
    return -1;
};

// Check if cell is safe
export const isSafeCell = (pathIndex) => {
    return pathIndex >= 0 && SAFE_CELL_INDICES.includes(pathIndex);
};

// Get valid movable tokens for player given diceValue
export const getValidTokenMoves = (playerTokens, diceValue) => {
    if (!diceValue) return [];
    return playerTokens.filter(token => {
        if (token.stepCount === 0) {
            return diceValue === 6; // Requires 6 to enter board
        }
        if (token.stepCount > 0 && token.stepCount < 57) {
            return token.stepCount + diceValue <= 57; // Cannot exceed exact home step (57)
        }
        return false;
    });
};

// Get step-by-step intermediate stepCounts for animation
export const getStepPath = (token, diceValue) => {
    const steps = [];
    let startStep = token.stepCount === 0 ? 1 : token.stepCount + 1;
    const endStep = token.stepCount === 0 ? 1 : token.stepCount + diceValue;

    for (let s = startStep; s <= endStep; s++) {
        steps.push(s);
    }
    return steps;
};

// Check for Captures
export const findCapturedTokens = (movingToken, targetStepCount, allTokensMap) => {
    if (targetStepCount < 1 || targetStepCount > 51) return [];

    const startIndex = PLAYER_START_INDEX[movingToken.player];
    const targetPathIndex = (startIndex + targetStepCount - 1) % 52;

    if (isSafeCell(targetPathIndex)) return []; // Safe zone protection

    const captured = [];
    Object.keys(allTokensMap).forEach(pColor => {
        if (pColor !== movingToken.player) {
            allTokensMap[pColor].forEach(tok => {
                if (getMainPathIndex(tok) === targetPathIndex) {
                    captured.push(tok);
                }
            });
        }
    });

    return captured;
};

// Smart AI Decision Solver for Computer turns
export const getBestAiMove = (player, allTokensMap, diceValue) => {
    const playerTokens = allTokensMap[player] || [];
    const validTokens = getValidTokenMoves(playerTokens, diceValue);

    if (validTokens.length === 0) return null;
    if (validTokens.length === 1) return validTokens[0];

    // Evaluate scores for each valid move
    let bestToken = validTokens[0];
    let bestScore = -Infinity;

    validTokens.forEach(token => {
        let score = 0;
        const targetStep = token.stepCount === 0 ? 1 : token.stepCount + diceValue;

        // Priority 1: Finishing in center home (57)
        if (targetStep === 57) {
            score += 1000;
        }

        // Priority 2: Capturing an opponent token
        const captures = findCapturedTokens({ ...token, player }, targetStep, allTokensMap);
        if (captures.length > 0) {
            score += 800;
        }

        // Priority 3: Bringing a token out of base (if 6 is rolled)
        if (token.stepCount === 0 && diceValue === 6) {
            score += 500;
        }

        // Priority 4: Landing on a safe cell
        if (targetStep >= 1 && targetStep <= 51) {
            const targetPathIndex = (PLAYER_START_INDEX[player] + targetStep - 1) % 52;
            if (isSafeCell(targetPathIndex)) {
                score += 300;
            }
        }

        // Priority 5: Advancing tokens closer to home
        score += targetStep * 2;

        if (score > bestScore) {
            bestScore = score;
            bestToken = token;
        }
    });

    return bestToken;
};

// Web Audio API Sound Synthesizer
let audioCtx = null;

const getAudioContext = () => {
    if (!audioCtx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

export const playLudoSound = (soundName, isMuted = false) => {
    if (isMuted) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        if (soundName === 'roll') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (soundName === 'step') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (soundName === 'capture') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (soundName === 'safe') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (soundName === 'win') {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                gain.gain.setValueAtTime(0.3, now + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.12);
                osc.stop(now + idx * 0.12 + 0.3);
            });
        }
    } catch (e) {
        console.error('Audio playback error:', e);
    }
};
