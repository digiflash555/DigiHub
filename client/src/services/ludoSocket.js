import { io } from 'socket.io-client';

let socket = null;

export const getLudoSocket = () => {
    if (!socket) {
        socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            withCredentials: true,
            autoConnect: true,
            transports: ['websocket', 'polling'],
        });
    }
    return socket;
};

export const disconnectLudoSocket = () => {
    if (socket) { socket.disconnect(); socket = null; }
};

// ─── Emitters ────────────────────────────────────────────────────────────────
export const createLudoRoom = (user, playerCount) =>
    getLudoSocket().emit('ludo_create_room', { user, playerCount });

export const joinLudoRoom = (roomCode, user) =>
    getLudoSocket().emit('ludo_join_room', { roomCode, user });

export const startLudoGame = (roomCode) =>
    getLudoSocket().emit('ludo_start_game', { roomCode });

export const rollLudoDice = (roomCode) =>
    getLudoSocket().emit('ludo_roll_dice', { roomCode });

export const moveLudoToken = (roomCode, tokenId) =>
    getLudoSocket().emit('ludo_move_token', { roomCode, tokenId });

export const leaveLudoRoom = (roomCode) =>
    getLudoSocket().emit('ludo_leave_room', { roomCode });

// ─── Subscribers ────────────────────────────────────────────────────────────
export const onLudoEvent = (event, cb) => { getLudoSocket().on(event, cb); };
export const offLudoEvent = (event, cb) => { getLudoSocket()?.off(event, cb); };
