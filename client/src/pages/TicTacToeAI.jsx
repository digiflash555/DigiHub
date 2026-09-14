import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
    Bot, User as UserIcon, RotateCcw, LogOut, Sparkles,
    Trophy, ShieldAlert, Award, Loader2, Zap, ArrowLeft, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import StudentHeader from '../components/layout/StudentHeader';
import TicTacToeBoard from '../components/games/TicTacToeBoard';

const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const checkWinner = (board) => {
    for (const combo of WINNING_COMBOS) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], combo };
        }
    }
    if (board.every(c => c !== null)) return { winner: 'Draw', combo: [] };
    return null;
};

const TicTacToeAI = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [difficulty, setDifficulty] = useState('Hard');
    const [gameStarted, setGameStarted] = useState(false);
    const [board, setBoard] = useState(Array(9).fill(null));
    const [turn, setTurn] = useState('X'); // Student is X, DigiHub is O
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [winnerResult, setWinnerResult] = useState(null); // null | { winner: 'X'|'O'|'Draw', combo: [] }
    const [showResultModal, setShowResultModal] = useState(false);
    const [savingResult, setSavingResult] = useState(false);
    const [movesCount, setMovesCount] = useState(0);
    const startTimeRef = useRef(Date.now());

    // Trigger AI move when it's O's turn
    useEffect(() => {
        if (!gameStarted || turn !== 'O' || winnerResult) return;

        const makeAiMove = async () => {
            setIsAiThinking(true);
            try {
                // Short organic delay for realistic game flow
                await new Promise(res => setTimeout(res, 400));

                const response = await axios.post('/api/games/tictactoe/ai-move', {
                    board,
                    difficulty
                });

                const aiMoveIndex = response.data.move;

                if (aiMoveIndex !== null && aiMoveIndex !== undefined) {
                    const newBoard = [...board];
                    newBoard[aiMoveIndex] = 'O';
                    setBoard(newBoard);
                    setMovesCount(prev => prev + 1);

                    const res = checkWinner(newBoard);
                    if (res) {
                        setWinnerResult(res);
                        setShowResultModal(true);
                        handleSaveResult(res, newBoard, movesCount + 1);
                    } else {
                        setTurn('X');
                    }
                }
            } catch (err) {
                console.error('AI move error:', err);
                toast.error('Failed to get AI move');
            } finally {
                setIsAiThinking(false);
            }
        };

        makeAiMove();
    }, [turn, gameStarted, board, winnerResult]);

    // Handle Student Move (Click X)
    const handleCellClick = (index) => {
        if (!gameStarted || turn !== 'X' || board[index] || isAiThinking || winnerResult) return;

        const newBoard = [...board];
        newBoard[index] = 'X';
        setBoard(newBoard);
        const newMovesCount = movesCount + 1;
        setMovesCount(newMovesCount);

        const res = checkWinner(newBoard);
        if (res) {
            setWinnerResult(res);
            setShowResultModal(true);
            handleSaveResult(res, newBoard, newMovesCount);
        } else {
            setTurn('O');
        }
    };

    // Save game result to MongoDB backend
    const handleSaveResult = async (res, finalBoard, totalMoves) => {
        setSavingResult(true);
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
            await axios.post('/api/games/tictactoe/result', {
                mode: 'ai',
                opponentName: 'DigiHub',
                aiDifficulty: difficulty,
                winner: res.winner,
                winningCombination: res.combo,
                movesCount: totalMoves,
                durationSeconds
            });
        } catch (err) {
            console.error('Failed to save game result:', err);
        } finally {
            setSavingResult(false);
        }
    };

    // Restart game with current difficulty
    const handleRestart = () => {
        setBoard(Array(9).fill(null));
        setTurn('X');
        setWinnerResult(null);
        setShowResultModal(false);
        setMovesCount(0);
        startTimeRef.current = Date.now();
        setGameStarted(true);
    };

    // Start new game
    const handleStartGame = (selectedDiff) => {
        setDifficulty(selectedDiff);
        setBoard(Array(9).fill(null));
        setTurn('X');
        setWinnerResult(null);
        setShowResultModal(false);
        setMovesCount(0);
        startTimeRef.current = Date.now();
        setGameStarted(true);
    };

    return (
        <div className="max-w-4xl mx-auto pb-24 space-y-8">
            <StudentHeader
                title="Play vs DigiHub AI"
                subtitle="Single-player Tic-Tac-Toe against DigiHub's artificial intelligence."
                icon={Bot}
                showHero={false}
                backPath="/games"
            />

            {!gameStarted ? (
                /* Difficulty Selection View */
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#1a1e26] rounded-[2.5rem] p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8 text-center"
                >
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-primary-500/30">
                        <Bot className="w-10 h-10" />
                    </div>

                    <div className="space-y-2 max-w-lg mx-auto">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                            Select AI Difficulty
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                            Choose your challenge level before starting the match.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-5 max-w-2xl mx-auto">
                        {[
                            {
                                id: 'Easy',
                                title: '🟢 Easy',
                                badge: 'Casual',
                                desc: 'DigiHub makes mostly random moves. Great for warmups.',
                                border: 'hover:border-emerald-500/50',
                                bg: 'hover:bg-emerald-500/5'
                            },
                            {
                                id: 'Medium',
                                title: '🟡 Medium',
                                badge: 'Balanced',
                                desc: 'A mix of smart strategic blocks and random choices.',
                                border: 'hover:border-amber-500/50',
                                bg: 'hover:bg-amber-500/5'
                            },
                            {
                                id: 'Hard',
                                title: '🔴 Hard (Minimax)',
                                badge: 'Unbeatable',
                                desc: 'Uses the optimal Minimax algorithm. Cannot be defeated!',
                                border: 'hover:border-rose-500/50',
                                bg: 'hover:bg-rose-500/5'
                            }
                        ].map((diff) => (
                            <motion.div
                                key={diff.id}
                                whileHover={{ scale: 1.03, y: -4 }}
                                onClick={() => handleStartGame(diff.id)}
                                className={`p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 ${diff.border} ${diff.bg} cursor-pointer text-left flex flex-col justify-between space-y-4 transition-all shadow-md`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                            {diff.title}
                                        </h3>
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                            {diff.badge}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                        {diff.desc}
                                    </p>
                                </div>
                                <button className="w-full py-2.5 rounded-xl bg-primary-600 text-white font-extrabold text-xs shadow-md shadow-primary-500/20">
                                    Play {diff.id}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            ) : (
                /* Active Game View */
                <div className="space-y-8">
                    {/* Players Header & Status Bar */}
                    <div className="bg-white dark:bg-[#1a1e26] rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                        {/* Student Player (X) */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-black text-xl border border-primary-200 dark:border-primary-800">
                                {user?.profileImage ? (
                                    <img src={user.profileImage} alt={user.username} className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                    user?.username?.[0]?.toUpperCase() || 'X'
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                        {user?.username}
                                    </h3>
                                    <span className="text-xs font-black text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded border border-primary-200/50 dark:border-primary-500/20">
                                        You (X)
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">Player 1</p>
                            </div>
                        </div>

                        {/* Status Message Indicator */}
                        <div className="px-6 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-xs">
                            {isAiThinking ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                                    <span>DigiHub is Thinking...</span>
                                </>
                            ) : winnerResult ? (
                                <span>
                                    {winnerResult.winner === 'X' ? '🎉 You Won!' : winnerResult.winner === 'O' ? '🤖 DigiHub Won!' : '🤝 It\'s a Draw!'}
                                </span>
                            ) : turn === 'X' ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                    <span>Your Turn (X)</span>
                                </>
                            ) : (
                                <span>DigiHub's Turn (O)</span>
                            )}
                        </div>

                        {/* DigiHub AI Player (O) */}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200/50 dark:border-rose-500/20">
                                        DigiHub (O)
                                    </span>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                        DigiHub AI
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">{difficulty} Mode</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xl border border-rose-200 dark:border-rose-800">
                                <Bot className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Interactive TicTacToe Board */}
                    <TicTacToeBoard
                        board={board}
                        onCellClick={handleCellClick}
                        disabled={turn !== 'X' || isAiThinking || Boolean(winnerResult)}
                        winningCombo={winnerResult?.combo || []}
                        mySymbol="X"
                    />

                    {/* Controls Toolbar */}
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                        <button
                            onClick={handleRestart}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 border border-slate-700"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restart Game</span>
                        </button>
                        <button
                            onClick={() => setGameStarted(false)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 border border-slate-700"
                        >
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span>Change Difficulty ({difficulty})</span>
                        </button>
                        <button
                            onClick={() => navigate('/games')}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold text-xs border border-rose-500/20 transition-all active:scale-95"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Exit Game</span>
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
                            {winnerResult.winner === 'X' ? (
                                <>
                                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                                        <Trophy className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                            🎉 YOU WON!
                                        </h2>
                                        <p className="text-sm font-bold text-emerald-500">
                                            Great tactics! You defeated DigiHub ({difficulty}).
                                        </p>
                                    </div>
                                </>
                            ) : winnerResult.winner === 'O' ? (
                                <>
                                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-rose-500/20">
                                        <Bot className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                            🤖 DIGIHUB WON
                                        </h2>
                                        <p className="text-sm font-bold text-slate-400">
                                            DigiHub executed an optimal strategy on {difficulty} mode.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                                        <Award className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                            🤝 IT'S A DRAW!
                                        </h2>
                                        <p className="text-sm font-bold text-amber-500">
                                            Evenly matched game! Nobody made a mistake.
                                        </p>
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={handleRestart}
                                    className="py-3.5 px-4 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-extrabold text-xs shadow-lg shadow-primary-500/25 transition-all"
                                >
                                    Play Again
                                </button>
                                <button
                                    onClick={() => navigate('/games/tictactoe/history')}
                                    className="py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-all"
                                >
                                    View History
                                </button>
                            </div>

                            <button
                                onClick={() => navigate('/games')}
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

export default TicTacToeAI;
