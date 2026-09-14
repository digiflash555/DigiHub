import { motion } from 'framer-motion';
import { PLAYER_COLORS } from '../../../utils/ludoEngine';
import LudoDice from './LudoDice';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';

const LudoQuickRollBar = ({
    value = 6,
    onRoll,
    isRolling = false,
    canRoll = false,
    hasRolled = false,
    hasValidMoves = false,
    currentPlayer = 'Red',
    playerName = 'Player',
    turnMessage = '',
    isThinking = false,
    winner = null
}) => {
    const config = PLAYER_COLORS[currentPlayer] || PLAYER_COLORS.Red;
    const safeName = (playerName && playerName !== 'undefined') ? playerName : currentPlayer;

    if (winner) return null;

    return (
        <div className="w-full max-w-[480px] sm:max-w-[600px] md:max-w-[700px] mx-auto mt-4 px-2">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={() => canRoll && !isRolling && onRoll && onRoll()}
                className={`bg-slate-900/95 dark:bg-[#1a1e26]/95 backdrop-blur-2xl px-4 py-3 sm:py-4 rounded-3xl border-2 shadow-2xl flex items-center justify-between gap-4 select-none transition-all ${
                    canRoll ? 'border-emerald-500/80 shadow-emerald-500/30 ring-4 ring-emerald-500/20 cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : 'border-slate-800'
                }`}
            >
                {/* Player Avatar & Status Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${config.bg} flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shrink-0 border-2 border-white/30`}>
                        {safeName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-black text-base sm:text-lg truncate ${config.text}`}>
                                {safeName}
                            </span>
                            {canRoll && (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider shrink-0 animate-pulse border border-emerald-500/30">
                                    YOUR TURN
                                </span>
                            )}
                            {hasRolled && (
                                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider shrink-0 border border-amber-500/40 shadow-sm">
                                    ROLLED {value} 🎲
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 font-bold truncate">
                            {isThinking ? (
                                <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                                </span>
                            ) : canRoll ? (
                                <span className="text-amber-300 flex items-center gap-1.5 font-black animate-pulse">
                                    <Sparkles className="w-4 h-4" /> Tap Box to Roll!
                                </span>
                            ) : hasRolled && hasValidMoves ? (
                                <span className="text-emerald-400 flex items-center gap-1.5 font-black animate-pulse">
                                    <ArrowRight className="w-4 h-4" /> Tap highlighted token on board
                                </span>
                            ) : (
                                (turnMessage && turnMessage !== "undefined's turn!") ? turnMessage : `${safeName}'s Turn`
                            )}
                        </p>
                    </div>
                </div>

                {/* Large 3D Dice Box Display */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                    <LudoDice
                        value={value}
                        onRoll={onRoll}
                        isRolling={isRolling}
                        canRoll={canRoll}
                        currentPlayer={currentPlayer}
                        showButton={false}
                        size="normal"
                    />
                    {hasRolled && (
                        <span className="text-[11px] font-black text-amber-400 tracking-wider uppercase">
                            Result: {value}
                        </span>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default LudoQuickRollBar;
