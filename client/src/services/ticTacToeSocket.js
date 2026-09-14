import { io } from 'socket.io-client';

let socket = null;

const getSocketUrl = () => {
    let url = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '';
    if (!url) {
        if (typeof window !== 'undefined') {
            url = window.location.origin.replace(':5173', ':5000');
        } else {
            url = 'http://localhost:5000';
        }
    }
    return url.replace(/\/api\/?$/, '');
};

export const getSocket = () => {
    if (!socket) {
        socket = io(getSocketUrl(), {
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            transports: ['websocket', 'polling'],
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
