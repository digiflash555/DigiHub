import { motion } from 'framer-motion';

const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const TicTacToeBoard = ({
    board = Array(9).fill(null),
    onCellClick,
    disabled = false,
    winningCombo = [],
    mySymbol = 'X'
}) => {

    const isCellWinning = (index) => winningCombo.includes(index);

    return (
        <div className="relative w-full max-w-[360px] sm:max-w-[420px] aspect-square mx-auto p-4 bg-slate-900/90 dark:bg-[#151921]/95 rounded-[2.5rem] shadow-2xl border border-slate-700/60 dark:border-slate-800/80 backdrop-blur-xl flex items-center justify-center">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-primary-500/10 via-purple-500/10 to-blue-500/10 pointer-events-none blur-xl" />

            {/* 3x3 Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full h-full p-2 relative z-10">
                {board.map((cell, index) => {
                    const isWinning = isCellWinning(index);
                    const isEmpty = !cell;
                    const isClickable = isEmpty && !disabled;

                    return (
                        <motion.button
                            key={index}
                            whileHover={isClickable ? { scale: 1.05, y: -2 } : {}}
                            whileTap={isClickable ? { scale: 0.95 } : {}}
                            onClick={() => isClickable && onCellClick(index)}
                            disabled={!isClickable}
                            className={`relative rounded-2xl flex items-center justify-center font-black text-4xl sm:text-5xl transition-all duration-300 select-none overflow-hidden ${
                                isWinning
                                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white ring-4 ring-amber-400/50 shadow-lg shadow-amber-500/40 animate-pulse'
                                    : cell === 'X'
                                    ? 'bg-slate-800/90 border border-primary-500/40 text-primary-400 shadow-md shadow-primary-500/10'
                                    : cell === 'O'
                                    ? 'bg-slate-800/90 border border-rose-500/40 text-rose-400 shadow-md shadow-rose-500/10'
                                    : 'bg-slate-800/40 border border-slate-700/40 hover:bg-slate-800/80 hover:border-primary-500/50 cursor-pointer'
                            }`}
                        >
                            {cell === 'X' && (
                                <motion.span
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    className="drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                                >
                                    X
                                </motion.span>
                            )}

                            {cell === 'O' && (
                                <motion.span
                                    initial={{ scale: 0, rotate: 45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    className="drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]"
                                >
                                    O
                                </motion.span>
                            )}

                            {!cell && isClickable && (
                                <span className="opacity-0 hover:opacity-20 text-slate-400 text-3xl font-bold transition-opacity">
                                    {mySymbol}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default TicTacToeBoard;
