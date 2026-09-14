// Server-authoritative Ludo Online Socket Handler
// All dice rolls and move validations happen here — client cannot cheat.

const {
    PLAYER_START_INDEX,
    SAFE_CELL_INDICES,
    MAIN_PATH,
    HOME_PATHS,
    BASE_POSITIONS
} = require('../utils/ludoEngineServer');

// In-memory rooms
const ludoRooms = new Map();

const PLAYER_ORDER = ['Red', 'Green', 'Yellow', 'Blue'];

// ─── Room Code Generator ─────────────────────────────────────────────────────
const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'LUDO-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    if (ludoRooms.has(code)) return generateRoomCode();
    return code;
};

// ─── Engine Functions (server-side copies) ───────────────────────────────────
const createInitialTokens = () => {
    const tokens = {};
    PLAYER_ORDER.forEach(player => {
        tokens[player] = BASE_POSITIONS[player].map((basePos, idx) => ({
            id: idx, player, stepCount: 0, basePos
        }));
    });
    return tokens;
};

const getTokenCoordinates = (token) => {
    if (token.stepCount === 0) return token.basePos;
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

const getMainPathIndex = (token) => {
    if (token.stepCount >= 1 && token.stepCount <= 51) {
        return (PLAYER_START_INDEX[token.player] + token.stepCount - 1) % 52;
    }
    return -1;
};

const isSafeCell = (pathIndex) => SAFE_CELL_INDICES.includes(pathIndex);

const getValidTokenMoves = (playerTokens, diceValue) => {
    return playerTokens.filter(token => {
        if (token.stepCount === 0) return diceValue === 6;
        if (token.stepCount > 0 && token.stepCount < 57) return token.stepCount + diceValue <= 57;
        return false;
    });
};

const findCapturedTokens = (movingToken, targetStep, allTokensMap) => {
    if (targetStep < 1 || targetStep > 51) return [];
    const startIndex = PLAYER_START_INDEX[movingToken.player];
    const targetPathIndex = (startIndex + targetStep - 1) % 52;
    if (isSafeCell(targetPathIndex)) return [];
    const captured = [];
    Object.keys(allTokensMap).forEach(pColor => {
        if (pColor !== movingToken.player) {
            allTokensMap[pColor].forEach(tok => {
                if (getMainPathIndex(tok) === targetPathIndex) captured.push(tok);
            });
        }
    });
    return captured;
};

const rollDice = () => Math.floor(Math.random() * 6) + 1;

// ─── Socket Handler ──────────────────────────────────────────────────────────
const handleLudoOnlineSocket = (io, socket) => {

    // Create Room
    socket.on('ludo_create_room', ({ user, playerCount }) => {
        if (!user?._id) return socket.emit('ludo_error', { message: 'Authentication required.' });

        const roomCode = generateRoomCode();
        const activePlayers = PLAYER_ORDER.slice(0, Math.min(playerCount || 4, 4));
        const hostColor = activePlayers[0];

        const room = {
            roomCode,
            hostId: user._id.toString(),
            playerCount: activePlayers.length,
            activePlayers,
            players: {
                [hostColor]: {
                    socketId: socket.id,
                    userId: user._id.toString(),
                    username: user.username || user.name || 'Player',
                    color: hostColor,
                    ready: true,
                }
            },
            colorAssignment: { [user._id.toString()]: hostColor },
            tokens: createInitialTokens(),
            currentPlayerIndex: 0,
            diceValue: null,
            hasRolled: false,
            consecutiveSixes: 0,
            winner: null,
            rankings: [],
            status: 'lobby', // lobby | playing | finished
        };

        ludoRooms.set(roomCode, room);
        socket.join(roomCode);
        socket.data.ludoRoom = roomCode;

        console.log(`[Ludo] Room ${roomCode} created by ${user.username}`);
        socket.emit('ludo_room_created', {
            roomCode,
            hostColor,
            activePlayers,
            players: room.players,
            status: 'lobby',
        });
    });

    // Join Room
    socket.on('ludo_join_room', ({ roomCode, user }) => {
        const clean = (roomCode || '').trim().toUpperCase();
        const room = ludoRooms.get(clean);

        if (!user?._id) return socket.emit('ludo_error', { message: 'Authentication required.' });
        if (!room) return socket.emit('ludo_error', { message: 'Room not found. Check the code and try again.' });
        if (room.status !== 'lobby') return socket.emit('ludo_error', { message: 'Game has already started.' });

        const userId = user._id.toString();
        // Reassign if reconnecting
        if (room.colorAssignment[userId]) {
            const color = room.colorAssignment[userId];
            room.players[color].socketId = socket.id;
            socket.join(clean);
            socket.data.ludoRoom = clean;
            socket.emit('ludo_rejoined', { roomCode: clean, yourColor: color, room: sanitizeRoom(room) });
            io.to(clean).emit('ludo_lobby_updated', { players: room.players, activePlayers: room.activePlayers });
            return;
        }

        // Find free color slot
        const takenColors = Object.values(room.colorAssignment);
        const freeColor = room.activePlayers.find(c => !takenColors.includes(c));
        if (!freeColor) return socket.emit('ludo_error', { message: 'Room is full.' });

        room.players[freeColor] = {
            socketId: socket.id,
            userId,
            username: user.username || user.name || 'Player',
            color: freeColor,
            ready: true,
        };
        room.colorAssignment[userId] = freeColor;

        socket.join(clean);
        socket.data.ludoRoom = clean;

        console.log(`[Ludo] ${user.username} joined room ${clean} as ${freeColor}`);
        socket.emit('ludo_joined', { roomCode: clean, yourColor: freeColor, room: sanitizeRoom(room) });
        io.to(clean).emit('ludo_lobby_updated', { players: room.players, activePlayers: room.activePlayers });
    });

    // Start Game (host only)
    socket.on('ludo_start_game', ({ roomCode }) => {
        const room = ludoRooms.get(roomCode);
        if (!room) return socket.emit('ludo_error', { message: 'Room not found.' });
        if (room.players[room.activePlayers[0]]?.socketId !== socket.id) {
            return socket.emit('ludo_error', { message: 'Only the host can start the game.' });
        }
        const joinedCount = Object.keys(room.players).length;
        if (joinedCount < 2) return socket.emit('ludo_error', { message: 'Need at least 2 players to start.' });

        // Trim active players to only joined ones
        room.activePlayers = room.activePlayers.filter(c => room.players[c]);
        room.tokens = createInitialTokens();
        room.currentPlayerIndex = 0;
        room.diceValue = null;
        room.hasRolled = false;
        room.consecutiveSixes = 0;
        room.winner = null;
        room.rankings = [];
        room.status = 'playing';

        console.log(`[Ludo] Game started in room ${roomCode}`);
        io.to(roomCode).emit('ludo_game_started', {
            activePlayers: room.activePlayers,
            players: room.players,
            tokens: room.tokens,
            currentPlayer: room.activePlayers[0],
        });
    });

    // Roll Dice (server-authoritative)
    socket.on('ludo_roll_dice', ({ roomCode }) => {
        const room = ludoRooms.get(roomCode);
        if (!room || room.status !== 'playing') return socket.emit('ludo_error', { message: 'Game not active.' });

        const currentColor = room.activePlayers[room.currentPlayerIndex];
        const currentPlayerData = room.players[currentColor];

        if (currentPlayerData?.socketId !== socket.id) return socket.emit('ludo_error', { message: 'Not your turn!' });
        if (room.hasRolled) return socket.emit('ludo_error', { message: 'Already rolled.' });

        const value = rollDice();
        room.diceValue = value;
        room.hasRolled = true;

        const isSix = value === 6;
        let nextSixes = room.consecutiveSixes;
        if (isSix) nextSixes++;
        else nextSixes = 0;
        room.consecutiveSixes = nextSixes;

        // Three 6s — forfeit
        if (nextSixes >= 3) {
            room.consecutiveSixes = 0;
            io.to(roomCode).emit('ludo_dice_rolled', { value, currentPlayer: currentColor, message: 'Three 6s! Turn forfeited.' });
            setTimeout(() => advanceTurnInRoom(io, roomCode, false), 1500);
            return;
        }

        const validMoves = getValidTokenMoves(room.tokens[currentColor] || [], value);

        io.to(roomCode).emit('ludo_dice_rolled', {
            value,
            currentPlayer: currentColor,
            validTokenIds: validMoves.map(t => t.id),
            message: isSix ? 'Rolled a 6! Extra turn.' : `Rolled a ${value}.`,
        });

        if (validMoves.length === 0) {
            setTimeout(() => advanceTurnInRoom(io, roomCode, isSix), 1500);
        }
    });

    // Move Token (server validates)
    socket.on('ludo_move_token', ({ roomCode, tokenId }) => {
        const room = ludoRooms.get(roomCode);
        if (!room || room.status !== 'playing' || !room.hasRolled) {
            return socket.emit('ludo_error', { message: 'Invalid move request.' });
        }

        const currentColor = room.activePlayers[room.currentPlayerIndex];
        if (room.players[currentColor]?.socketId !== socket.id) {
            return socket.emit('ludo_error', { message: 'Not your turn!' });
        }

        const token = (room.tokens[currentColor] || []).find(t => t.id === tokenId);
        if (!token) return socket.emit('ludo_error', { message: 'Token not found.' });

        const validMoves = getValidTokenMoves(room.tokens[currentColor], room.diceValue);
        if (!validMoves.find(t => t.id === tokenId)) {
            return socket.emit('ludo_error', { message: 'Invalid token move.' });
        }

        const newStep = token.stepCount === 0 ? 1 : token.stepCount + room.diceValue;
        room.tokens[currentColor] = room.tokens[currentColor].map(t =>
            t.id === tokenId ? { ...t, stepCount: newStep } : t
        );

        let extraTurn = room.diceValue === 6;
        let captured = [];

        // Captures
        if (newStep >= 1 && newStep <= 51) {
            captured = findCapturedTokens({ ...token, player: currentColor }, newStep, room.tokens);
            if (captured.length > 0) {
                extraTurn = true;
                captured.forEach(c => {
                    room.tokens[c.player] = room.tokens[c.player].map(t =>
                        t.id === c.id ? { ...t, stepCount: 0 } : t
                    );
                });
            }
        }
        if (newStep === 57) extraTurn = true;

        // Check win
        const allHome = room.tokens[currentColor].every(t => t.stepCount === 57);
        if (allHome && !room.rankings.includes(currentColor)) {
            room.rankings.push(currentColor);
            if (!room.winner) room.winner = currentColor;
            const remaining = room.activePlayers.filter(p => !room.rankings.includes(p));
            if (remaining.length <= 1) {
                if (remaining.length === 1) room.rankings.push(remaining[0]);
                room.status = 'finished';
                io.to(roomCode).emit('ludo_move_made', { tokens: room.tokens, captured: captured.map(c => ({ player: c.player, id: c.id })) });
                io.to(roomCode).emit('ludo_game_over', { winner: room.winner, rankings: room.rankings });
                return;
            }
        }

        io.to(roomCode).emit('ludo_move_made', {
            tokens: room.tokens,
            captured: captured.map(c => ({ player: c.player, id: c.id })),
        });

        advanceTurnInRoom(io, roomCode, extraTurn);
    });

    // Disconnect handler
    const handleDisconnect = () => {
        const roomCode = socket.data?.ludoRoom;
        if (!roomCode) return;
        const room = ludoRooms.get(roomCode);
        if (!room) return;

        // Find who disconnected
        const disconnectedColor = Object.keys(room.players).find(c => room.players[c]?.socketId === socket.id);
        if (disconnectedColor) {
            console.log(`[Ludo] ${disconnectedColor} disconnected from room ${roomCode}`);
            io.to(roomCode).emit('ludo_player_disconnected', { color: disconnectedColor, username: room.players[disconnectedColor]?.username });

            if (room.status === 'lobby') {
                delete room.players[disconnectedColor];
                delete room.colorAssignment[room.players[disconnectedColor]?.userId];
                io.to(roomCode).emit('ludo_lobby_updated', { players: room.players, activePlayers: room.activePlayers });
            }

            // Clean up empty rooms
            if (Object.keys(room.players).length === 0) ludoRooms.delete(roomCode);
        }
    };

    socket.on('ludo_leave_room', handleDisconnect);
    socket.on('disconnect', handleDisconnect);
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const advanceTurnInRoom = (io, roomCode, extraTurn) => {
    const room = ludoRooms.get(roomCode);
    if (!room || room.status !== 'playing') return;

    room.hasRolled = false;
    room.diceValue = null;

    if (!extraTurn) {
        room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.activePlayers.length;
    }

    const nextColor = room.activePlayers[room.currentPlayerIndex];
    io.to(roomCode).emit('ludo_turn_changed', { currentPlayer: nextColor });
};

const sanitizeRoom = (room) => ({
    roomCode: room.roomCode,
    activePlayers: room.activePlayers,
    players: room.players,
    status: room.status,
    currentPlayer: room.activePlayers[room.currentPlayerIndex],
});

module.exports = handleLudoOnlineSocket;
