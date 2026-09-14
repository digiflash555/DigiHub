import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Home, Star, Medal } from 'lucide-react';
import Confetti from 'react-confetti';
import { PLAYER_COLORS } from '../../../utils/ludoEngine';

const RANK_MEDALS = ['🥇', '🥈', '🥉', '4️⃣'];
const RANK_LABELS = ['1st Place', '2nd Place', '3rd Place', '4th Place'];

const LudoWinnerModal = ({ winner, rankings = [], playerNames = {}, onPlayAgain, onMenu }) => {
    if (!winner) return null;

    const config = PLAYER_COLORS[winner];
    const winnerName = playerNames[winner] || winner;

    return (
        <AnimatePresence>
            <Confetti
                recycle={false}
                numberOfPieces={600}
                gravity={0.15}
                colors={['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899']}
            />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.8, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 280 }}
                    className="bg-white dark:bg-[#1a1e26] rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                    {/* Colored top banner */}
                    <div className={`p-6 text-center relative overflow-hidden`} style={{ background: `linear-gradient(135deg, ${config.hex}cc, ${config.hex}66)` }}>
                        <div className="absolute inset-0 opacity-10">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <Star key={i} className="absolute text-white fill-white" style={{
                                    width: `${8 + Math.random() * 14}px`,
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    opacity: Math.random(),
                                }} />
                            ))}
                        </div>
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/40"
                            style={{ backgroundColor: config.hex }}
                        >
                            <Trophy className="w-10 h-10 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-black text-white drop-shadow-lg">
                            {winnerName} Wins!
                        </h2>
                        <p className="text-white/80 text-sm font-medium mt-1">
                            All 4 tokens reached home! 🎉
                        </p>
                    </div>

                    {/* Rankings */}
                    {rankings.length > 1 && (
                        <div className="px-6 pt-5 pb-2">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Final Rankings</p>
                            <div className="space-y-2">
                                {rankings.map((color, idx) => {
                                    const pc = PLAYER_COLORS[color];
                                    const pname = playerNames[color] || color;
                                    return (
                                        <div key={color} className={`flex items-center gap-3 p-2.5 rounded-xl ${idx === 0 ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                            <span className="text-xl w-7 text-center">{RANK_MEDALS[idx]}</span>
                                            <div className={`w-3 h-3 rounded-full ${pc.bg} flex-shrink-0`} />
                                            <span className={`font-black text-sm ${idx === 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>{pname}</span>
                                            <span className="ml-auto text-xs font-bold text-slate-400">{RANK_LABELS[idx]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-6 flex flex-col gap-3">
                        <button
                            onClick={onPlayAgain}
                            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Play Again
                        </button>
                        <button
                            onClick={onMenu}
                            className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                        >
                            <Home className="w-4 h-4" />
                            Main Menu
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LudoWinnerModal;
