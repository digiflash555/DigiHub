import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
    if (!socket) {
        // Socket connects to host URL or current origin
        const socketUrl = import.meta.env.VITE_API_URL || window.location.origin.replace(':5173', ':5000');
        socket = io(socketUrl, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5
        });
    }
    return socket;
};

export const createRoom = (user) => {
    const s = getSocket();
    s.emit('create_room', { user });
};

export const joinRoom = (roomCode, user) => {
    const s = getSocket();
    s.emit('join_room', { roomCode, user });
};

export const makeMove = (roomCode, index) => {
    const s = getSocket();
    s.emit('make_move', { roomCode, index });
};

export const restartGame = (roomCode) => {
    const s = getSocket();
    s.emit('restart_game', { roomCode });
};

export const leaveRoom = (roomCode) => {
    const s = getSocket();
    s.emit('leave_room', { roomCode });
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
