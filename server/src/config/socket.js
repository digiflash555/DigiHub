const socketio = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketio(server, {
        cors: {
            origin: (origin, callback) => {
                callback(null, true);
            },
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true
    });

    const handleTicTacToeSocket = require('../sockets/ticTacToeSocket');
    const handleLudoOnlineSocket = require('../sockets/ludoOnlineSocket');

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join', (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room: ${room}`);
        });

        // Attach Tic-Tac-Toe Socket Handler
        handleTicTacToeSocket(io, socket);

        // Attach Ludo Online Socket Handler
        handleLudoOnlineSocket(io, socket);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIO };
