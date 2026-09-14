import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, RotateCcw, Trophy, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StudentHeader from '../components/layout/StudentHeader';
import TicTacToeBoard from '../components/games/TicTacToeBoard';

const TicTacToeOffline = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('setup'); // 'setup' | 'playing'

    // Players setup
    const [player1Name, setPlayer1Name] = useState('Player 1');
    const [player2Name, setPlayer2Name] = useState('Player 2');

    // Match state
    const [board, setBoard] = useState(Array(9).fill(null));
    const [currentTurn, setCurrentTurn] = useState('X');
    const [winnerResult, setWinnerResult] = useState(null); // { winner: 'X'|'O'|'Draw', combo: [] }
    const [showResultModal, setShowResultModal] = useState(false);

    // Winning combinations
    const winCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    const checkWin = (currentBoard) => {
        for (let i = 0; i < winCombos.length; i++) {
            const [a, b, c] = winCombos[i];
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                return { winner: currentBoard[a], combo: [a, b, c] };
            }
        }
        if (currentBoard.every((cell) => cell !== null)) {
            return { winner: 'Draw', combo: [] };
        }
        return null;
    };

    const handleStartGame = (e) => {
        e.preventDefault();
        if (!player1Name.trim()) setPlayer1Name('Player 1');
        if (!player2Name.trim()) setPlayer2Name('Player 2');
        setMode('playing');
        setBoard(Array(9).fill(null));
        setCurrentTurn('X');
        setWinnerResult(null);
        setShowResultModal(false);
    };

    const handleCellClick = (index) => {
        if (mode !== 'playing' || board[index] || winnerResult) return;
        
        const newBoard = [...board];
        newBoard[index] = currentTurn;
        setBoard(newBoard);

        const result = checkWin(newBoard);
        if (result) {
            setWinnerResult(result);
            setShowResultModal(true);
        } else {
            setCurrentTurn(currentTurn === 'X' ? 'O' : 'X');
        }
    };

    const handleRestart = () => {
        setBoard(Array(9).fill(null));
        setCurrentTurn('X');
        setWinnerResult(null);
        setShowResultModal(false);
    };

    const handleBackToSetup = () => {
        setMode('setup');
        handleRestart();
    };

    return (
        <div className="max-w-4xl mx-auto pb-24 space-y-8">
            <StudentHeader
                title="Offline Mode (1v1)"
                subtitle="Pass & play on the same device with custom player names."
                icon={Users}
                showHero={false}
                backPath="/games"
            />

            {/* Setup View */}
            {mode === 'setup' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#1a1e26] rounded-[2.5rem] p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-10 max-w-lg mx-auto"
                >
                    <div className="text-center space-y-2">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-500/30 mb-4">
                            <Users className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Player Setup</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                            Enter names for Player X and Player O.
                        </p>
                    </div>

                    <form onSubmit={handleStartGame} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Player 1 (X)</label>
                                <input
                                    type="text"
                                    value={player1Name}
                                    onChange={(e) => setPlayer1Name(e.target.value)}
                                    placeholder="Enter Player 1 Name"
                                    maxLength={14}
                                    className="w-full px-4 py-3 rounded-2xl border-2 border-primary-200 dark:border-primary-500/30 bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100 font-bold focus:outline-none focus:border-primary-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Player 2 (O)</label>
                                <input
                                    type="text"
                                    value={player2Name}
                                    onChange={(e) => setPlayer2Name(e.target.value)}
                                    placeholder="Enter Player 2 Name"
                                    maxLength={14}
                                    className="w-full px-4 py-3 rounded-2xl border-2 border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-100 font-bold focus:outline-none focus:border-rose-500 transition-colors"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-lg shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
                        >
                            Start Game 🎮
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Active Game View */}
            {mode === 'playing' && (
                <div className="space-y-8">
                    {/* Players Header Bar */}
                    <div className="bg-white dark:bg-[#1a1e26] rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                        {/* Player X */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-black text-xl border border-primary-200 dark:border-primary-800 overflow-hidden">
                                {player1Name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                        {player1Name}
                                    </h3>
                                    <span className="text-xs font-black text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded border border-primary-200/50 dark:border-primary-500/20">
                                        X
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Message Indicator */}
                        <div className="px-6 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-xs">
                            {winnerResult ? (
                                <span>
                                    {winnerResult.winner === 'Draw' ? '🤝 IT\'S A DRAW!' : '🎉 WE HAVE A WINNER!'}
                                </span>
                            ) : currentTurn === 'X' ? (
                                <>
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse" />
                                    <span>{player1Name.toUpperCase()}'S TURN (X)</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                                    <span>{player2Name.toUpperCase()}'S TURN (O)</span>
                                </>
                            )}
                        </div>

                        {/* Player O */}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                    <span className="text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200/50 dark:border-rose-500/20">
                                        O
                                    </span>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                        {player2Name}
                                    </h3>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xl border border-rose-200 dark:border-rose-800 overflow-hidden">
                                {player2Name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* Interactive Board */}
                    <TicTacToeBoard
                        board={board}
                        onCellClick={handleCellClick}
                        disabled={Boolean(winnerResult)}
                        winningCombo={winnerResult?.combo || []}
                        mySymbol={currentTurn} // Pass current turn to show correct hover preview
                    />

                    {/* Controls Toolbar */}
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                        <button
                            onClick={handleRestart}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 border border-slate-700"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restart Match</span>
                        </button>
                        <button
                            onClick={handleBackToSetup}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold text-xs border border-rose-500/20 transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Change Players</span>
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
                            {winnerResult.winner !== 'Draw' ? (
                                <>
                                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                                        <Trophy className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                            🎉 {winnerResult.winner === 'X' ? player1Name : player2Name} WINS!
                                        </h2>
                                        <p className="text-sm font-bold text-emerald-500">
                                            A brilliant victory in offline mode!
                                        </p>
                                    </div>
                                </>
                            ) : (
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
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={handleRestart}
                                    className="py-3.5 px-4 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-extrabold text-xs shadow-lg shadow-primary-500/25 transition-all"
                                >
                                    Play Again
                                </button>
                                <button
                                    onClick={() => navigate('/games')}
                                    className="py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition-all"
                                >
                                    Back to Arcade
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TicTacToeOffline;
