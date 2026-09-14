import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Users, Copy, Check, Loader2, RotateCcw,
    LogOut, Trophy, AlertTriangle, Sparkles, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import StudentHeader from '../components/layout/StudentHeader';
import TicTacToeBoard from '../components/games/TicTacToeBoard';
import {
    getSocket, createRoom, joinRoom, makeMove,
    restartGame, leaveRoom
} from '../services/ticTacToeSocket';

const TicTacToeOnline = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState('menu'); // 'menu' | 'waiting' | 'playing'
    const [roomCode, setRoomCode] = useState('');
    const [joinInput, setJoinInput] = useState('');
    const [copied, setCopied] = useState(false);

    // Player state
    const [playerX, setPlayerX] = useState(null);
    const [playerO, setPlayerO] = useState(null);
    const [mySymbol, setMySymbol] = useState('X'); // 'X' or 'O'

    // Board & Match state
    const [board, setBoard] = useState(Array(9).fill(null));
    const [currentTurn, setCurrentTurn] = useState('X');
    const [winnerResult, setWinnerResult] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [disconnectedMsg, setDisconnectedMsg] = useState('');

    useEffect(() => {
        const socket = getSocket();

        socket.on('room_created', ({ roomCode: code, playerX: pX }) => {
            setRoomCode(code);
            setPlayerX(pX);
            setMySymbol('X');
            setMode('waiting');
            toast.success(`Room ${code} created! Share this code with a friend.`);
        });

        socket.on('game_started', ({ roomCode: code, playerX: pX, playerO: pO, board: b, currentTurn: turn }) => {
            setRoomCode(code);
            setPlayerX(pX);
            setPlayerO(pO);
            setBoard(b);
            setCurrentTurn(turn);
            setWinnerResult(null);
            setShowResultModal(false);
            setDisconnectedMsg('');
            setMode('playing');

            const mySym = pX.userId.toString() === user._id.toString() ? 'X' : 'O';
            setMySymbol(mySym);

            toast.success('Opponent connected! Game starting...');
        });

        socket.on('game_updated', ({ board: newBoard, currentTurn: nextTurn }) => {
            setBoard(newBoard);
            setCurrentTurn(nextTurn);
        });

        socket.on('game_over', ({ board: finalBoard, winner, winningCombination }) => {
            setBoard(finalBoard);
            setWinnerResult({ winner, combo: winningCombination });
            setShowResultModal(true);
        });

        socket.on('game_restarted', ({ board: newBoard, currentTurn: nextTurn }) => {
            setBoard(newBoard);
            setCurrentTurn(nextTurn);
            setWinnerResult(null);
            setShowResultModal(false);
            toast.success('Game restarted!');
        });

        socket.on('opponent_disconnected', ({ message }) => {
            setDisconnectedMsg(message || 'Your opponent disconnected.');
        });

        socket.on('error', ({ message }) => {
            toast.error(message || 'An error occurred.');
        });

        return () => {
            socket.off('room_created');
            socket.off('game_started');
            socket.off('game_updated');
            socket.off('game_over');
            socket.off('game_restarted');
            socket.off('opponent_disconnected');
            socket.off('error');
        };
    }, [user]);

    const handleCreateRoom = () => {
        createRoom(user);
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        const code = joinInput.trim().toUpperCase();
        if (!code) {
            toast.error('Please enter a room code.');
            return;
        }
        joinRoom(code, user);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        toast.success('Room code copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCellClick = (index) => {
        if (mode !== 'playing' || currentTurn !== mySymbol || board[index] || winnerResult) return;
        makeMove(roomCode, index);
    };

    const handleRestart = () => {
        restartGame(roomCode);
    };

    const handleLeave = () => {
        if (roomCode) {
            leaveRoom(roomCode);
        }
        setMode('menu');
        setRoomCode('');
        setJoinInput('');
        setWinnerResult(null);
        setShowResultModal(false);
        setDisconnectedMsg('');
    };

    return (
        <div className="max-w-4xl mx-auto pb-24 space-y-8">
            <StudentHeader
                title="Online Mode (1v1)"
                subtitle="Real-time multiplayer Tic-Tac-Toe using private room codes."
                icon={Users}
                showHero={false}
                backPath="/games"
            />

            {/* Menu Lobby View */}
            {mode === 'menu' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#1a1e26] rounded-[2.5rem] p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-10 text-center"
                >
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/30">
                        <Users className="w-10 h-10" />
                    </div>

                    <div className="space-y-2 max-w-lg mx-auto">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                            Multiplayer Lobby
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                            Create a new room code or enter your friend's code to join their game.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto items-stretch">
                        {/* Create Room Card */}
                        <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-between space-y-6 text-left">
                            <div className="space-y-3">
                                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-xs font-black uppercase tracking-wider">
                                    Host Game
                                </span>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                    Create Room
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    Generate a unique room code (e.g. DH-7K92) and invite your friend to join.
                                </p>
                            </div>

                            <button
                                onClick={handleCreateRoom}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
                                <span>Create New Room</span>
                            </button>
                        </div>

                        {/* Join Room Card */}
                        <form onSubmit={handleJoinRoom} className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-between space-y-6 text-left">
                            <div className="space-y-3">
                                <span className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-500/20 text-xs font-black uppercase tracking-wider">
                                    Join Friend
                                </span>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                    Join Game
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    Enter the 6-character room code given by your friend.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Enter Room Code (e.g. DH-7K92)"
                                    value={joinInput}
                                    onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                                    maxLength={10}
                                    className="input-premium w-full text-center tracking-widest uppercase font-black placeholder:font-normal text-slate-900 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    className="w-full py-4 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-extrabold text-sm shadow-lg shadow-primary-500/25 transition-all active:scale-95"
                                >
                                    Join Game
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}

            {/* Waiting View */}
            {mode === 'waiting' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-[#1a1e26] rounded-[2.5rem] p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg mx-auto text-center space-y-8"
                >
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                            Waiting for Opponent...
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">
                            Share this room code with your friend so they can join.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-700 flex flex-col items-center space-y-3 shadow-inner">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Your Private Room Code
                        </span>
                        <span className="text-4xl font-black tracking-widest text-primary-400 font-mono select-all">
                            {roomCode}
                        </span>
                        <button
                            onClick={handleCopyCode}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-extrabold text-slate-200 transition-all border border-slate-600"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                    </div>

                    <button
                        onClick={handleLeave}
                        className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors"
                    >
                        Cancel & Return to Lobby
                    </button>
                </motion.div>
            )}

            {/* Active Game View */}
            {mode === 'playing' && (
                <div className="space-y-8">
                    {/* Disconnection Warning Alert */}
                    {disconnectedMsg && (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-bold flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                                <span>{disconnectedMsg}</span>
                            </div>
                            <button
                                onClick={handleLeave}
                                className="px-4 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-black shadow-sm"
                            >
                                Back to Games
                            </button>
                        </div>
                    )}

                    {/* Players Header Bar */}
                    <div className="bg-white dark:bg-[#1a1e26] rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                        {/* Player X */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-black text-xl border border-primary-200 dark:border-primary-800 overflow-hidden">
                                {playerX?.profileImage ? (
                                    <img src={playerX.profileImage} alt={playerX.username} className="w-full h-full object-cover" />
                                ) : (
                                    playerX?.username?.[0]?.toUpperCase() || 'X'
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                        {playerX?.username}
                                    </h3>
                                    <span className="text-xs font-black text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded border border-primary-200/50 dark:border-primary-500/20">
                                        Player X {mySymbol === 'X' ? '(You)' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Message Indicator */}
                        <div className="px-6 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-xs">
                            {winnerResult ? (
                                <span>
                                    {winnerResult.winner === mySymbol ? '🎉 YOU WON!' : winnerResult.winner === 'Draw' ? '🤝 IT\'S A DRAW!' : '😔 YOUR FRIEND WON!'}
                                </span>
                            ) : currentTurn === mySymbol ? (
                                <>
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>YOUR TURN ({mySymbol})</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span>FRIEND'S TURN ({currentTurn})</span>
                                </>
                            )}
                        </div>

                        {/* Player O */}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200/50 dark:border-rose-500/20">
                                        Player O {mySymbol === 'O' ? '(You)' : ''}
                                    </span>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                        {playerO?.username}
                                    </h3>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xl border border-rose-200 dark:border-rose-800 overflow-hidden">
                                {playerO?.profileImage ? (
                                    <img src={playerO.profileImage} alt={playerO.username} className="w-full h-full object-cover" />
                                ) : (
                                    playerO?.username?.[0]?.toUpperCase() || 'O'
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Interactive Board */}
                    <TicTacToeBoard
                        board={board}
                        onCellClick={handleCellClick}
                        disabled={currentTurn !== mySymbol || Boolean(winnerResult)}
                        winningCombo={winnerResult?.combo || []}
                        mySymbol={mySymbol}
                    />

                    {/* Controls Toolbar */}
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                        <button
                            onClick={handleRestart}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 border border-slate-700"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Rematch</span>
                        </button>
                        <button
                            onClick={handleLeave}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold text-xs border border-rose-500/20 transition-all active:scale-95"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Leave Match</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Game Result Modal */}
            <AnimatePresence>
                {showResultModal && winnerResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-[#1a1e26] rounded-[2.5rem] p-8 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full text-center space-y-6"
                        >
                            {winnerResult.winner === mySymbol ? (
                                <>
                                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                                        <Trophy className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                            🎉 YOU WON!
                                        </h2>
                                        <p className="text-sm font-bold text-emerald-500">
                                            Congratulations! You defeated your opponent in 1v1 multiplayer.
                                        </p>
                                    </div>
                                </>
                            ) : winnerResult.winner === 'Draw' ? (
                                <>
                                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                                        <Users className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                            🤝 IT'S A DRAW!
                                        </h2>
                                        <p className="text-sm font-bold text-amber-500">
                                            A hard-fought tie match! Neither player gave an inch.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-rose-500/20">
                                        <Users className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                            😔 YOUR FRIEND WON
                                        </h2>
                                        <p className="text-sm font-bold text-slate-400">
                                            Good game! Request a rematch to claim your revenge.
                                        </p>
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={handleRestart}
                                    className="py-3.5 px-4 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-extrabold text-xs shadow-lg shadow-primary-500/25 transition-all"
                                >
                                    Rematch
                                </button>
                                <button
                                    onClick={() => navigate('/games/tictactoe/history')}
                                    className="py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-all"
                                >
                                    View History
                                </button>
                            </div>

                            <button
                                onClick={handleLeave}
                                className="w-full text-xs font-bold text-slate-400 hover:text-slate-300 pt-2 transition-colors"
                            >
                                Back to Games Arcade
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TicTacToeOnline;
