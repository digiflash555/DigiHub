const { checkWinner } = require('../services/ticTacToeAI');
const { recordGameResult } = require('../services/ticTacToeService');

// In-memory active game rooms store
const rooms = new Map();

// Helper to generate unique room codes (e.g. DH-7K92)
const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'DH-';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (rooms.has(code)) return generateRoomCode();
    return code;
};

const handleTicTacToeSocket = (io, socket) => {

    // Create Room (Player X)
    socket.on('create_room', ({ user }) => {
        if (!user || !user._id) {
            return socket.emit('error', { message: 'Authentication required to create a room.' });
        }

        const roomCode = generateRoomCode();
        const roomData = {
            roomCode,
            playerX: {
                socketId: socket.id,
                userId: user._id,
                username: user.username,
                profileImage: user.profileImage || 'default-profile.png'
            },
            playerO: null,
            board: Array(9).fill(null),
            currentTurn: 'X',
            status: 'waiting',
            winner: null,
            winningCombination: [],
            movesCount: 0,
            startTime: null
        };

        rooms.set(roomCode, roomData);
        socket.join(roomCode);

        console.log(`[Socket] Room ${roomCode} created by ${user.username}`);
        socket.emit('room_created', {
            roomCode,
            playerX: roomData.playerX,
            status: 'waiting'
        });
    });

    // Join Room (Player O)
    socket.on('join_room', ({ roomCode, user }) => {
        const cleanCode = (roomCode || '').trim().toUpperCase();
        const room = rooms.get(cleanCode);

        if (!user || !user._id) {
            return socket.emit('error', { message: 'Authentication required to join a room.' });
        }

        if (!room) {
            return socket.emit('error', { message: 'Invalid Room Code. Please check and try again.' });
        }

        if (room.status !== 'waiting') {
            return socket.emit('error', { message: 'Room is already full or game has finished.' });
        }

        if (room.playerX.userId.toString() === user._id.toString()) {
            return socket.emit('error', { message: 'You cannot join your own room as opponent.' });
        }

        room.playerO = {
            socketId: socket.id,
            userId: user._id,
            username: user.username,
            profileImage: user.profileImage || 'default-profile.png'
        };
        room.status = 'playing';
        room.startTime = Date.now();

        socket.join(cleanCode);

        console.log(`[Socket] Player ${user.username} joined room ${cleanCode}`);

        // Broadcast to both clients in the room
        io.to(cleanCode).emit('game_started', {
            roomCode: cleanCode,
            playerX: room.playerX,
            playerO: room.playerO,
            board: room.board,
            currentTurn: room.currentTurn,
            status: 'playing'
        });
    });

    // Make Move
    socket.on('make_move', async ({ roomCode, index }) => {
        const cleanCode = (roomCode || '').trim().toUpperCase();
        const room = rooms.get(cleanCode);

        if (!room || room.status !== 'playing') {
            return socket.emit('error', { message: 'Game is not active.' });
        }

        const isTurnX = room.currentTurn === 'X' && socket.id === room.playerX.socketId;
        const isTurnO = room.currentTurn === 'O' && socket.id === room.playerO.socketId;

        if (!isTurnX && !isTurnO) {
            return socket.emit('error', { message: 'Not your turn!' });
        }

        if (index < 0 || index > 8 || room.board[index] !== null) {
            return socket.emit('error', { message: 'Cell is already occupied or invalid.' });
        }

        // Apply Move
        const symbol = room.currentTurn;
        room.board[index] = symbol;
        room.movesCount += 1;

        // Check for Win or Draw
        const result = checkWinner(room.board);

        if (result) {
            room.status = 'completed';
            room.winner = result.winner;
            room.winningCombination = result.combo || [];
            const durationSeconds = Math.round((Date.now() - (room.startTime || Date.now())) / 1000);

            // Broadcast game over to both players
            io.to(cleanCode).emit('game_over', {
                board: room.board,
                winner: result.winner,
                winningCombination: result.combo,
                movesCount: room.movesCount,
                durationSeconds
            });

            // Save to MongoDB asynchronously
            try {
                await recordGameResult({
                    userId: room.playerX.userId,
                    mode: 'friend',
                    playerOId: room.playerO.userId,
                    opponentName: room.playerO.username,
                    winner: result.winner,
                    winningCombination: result.combo,
                    movesCount: room.movesCount,
                    durationSeconds
                });
            } catch (err) {
                console.error('[Socket] Failed to persist game result:', err);
            }
        } else {
            // Switch Turn
            room.currentTurn = symbol === 'X' ? 'O' : 'X';
            io.to(cleanCode).emit('game_updated', {
                board: room.board,
                currentTurn: room.currentTurn
            });
        }
    });

    // Rematch Request
    socket.on('restart_game', ({ roomCode }) => {
        const cleanCode = (roomCode || '').trim().toUpperCase();
        const room = rooms.get(cleanCode);

        if (room && (socket.id === room.playerX.socketId || socket.id === room.playerO.socketId)) {
            room.board = Array(9).fill(null);
            room.currentTurn = 'X';
            room.status = 'playing';
            room.winner = null;
            room.winningCombination = [];
            room.movesCount = 0;
            room.startTime = Date.now();

            io.to(cleanCode).emit('game_restarted', {
                board: room.board,
                currentTurn: 'X',
                status: 'playing'
            });
        }
    });

    // Handle Disconnect & Leave
    const handleDisconnect = () => {
        for (const [code, room] of rooms.entries()) {
            if (room.playerX.socketId === socket.id || (room.playerO && room.playerO.socketId === socket.id)) {
                if (room.status === 'playing') {
                    room.status = 'abandoned';
                    const remainingPlayerSocket = socket.id === room.playerX.socketId
                        ? room.playerO?.socketId
                        : room.playerX.socketId;

                    if (remainingPlayerSocket) {
                        io.to(remainingPlayerSocket).emit('opponent_disconnected', {
                            message: 'Your opponent disconnected from the game.'
                        });
                    }
                }
                rooms.delete(code);
                console.log(`[Socket] Room ${code} cleaned up after disconnect`);
            }
        }
    };

    socket.on('leave_room', handleDisconnect);
    socket.on('disconnect', handleDisconnect);
};

module.exports = handleTicTacToeSocket;
