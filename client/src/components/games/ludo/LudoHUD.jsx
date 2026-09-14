import { motion } from 'framer-motion';
import { Trophy, Home, Circle } from 'lucide-react';
import { PLAYER_COLORS } from '../../../utils/ludoEngine';

const TOKEN_ICONS = ['●', '●', '●', '●'];

const LudoHUD = ({ activePlayers, playerNames, tokens, currentPlayer, winner, playerTypes = {} }) => {
    return (
        <div className="flex flex-col gap-3 w-full">
            {activePlayers.map((color) => {
                const config = PLAYER_COLORS[color];
                const isActive = currentPlayer === color && !winner;
                const playerTokens = tokens[color] || [];
                const homeCount = playerTokens.filter(t => t.stepCount === 57).length;
                const onBoardCount = playerTokens.filter(t => t.stepCount > 0 && t.stepCount < 57).length;
                const name = playerNames?.[color] || color;
                const type = playerTypes[color] || 'Human';

                return (
                    <motion.div
                        key={color}
                        animate={isActive ? { scale: 1.03 } : { scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-2xl border-2 p-4 transition-all duration-300 ${
                            isActive
                                ? `${config.light} ${config.border} shadow-lg`
                                : 'bg-white dark:bg-[#1a1e26] border-slate-200 dark:border-slate-700 opacity-60'
                        }`}
                    >
                        {/* Header row */}
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className={`w-8 h-8 rounded-xl ${config.bg} flex items-center justify-center shadow-md flex-shrink-0`}>
                                <span className="text-white text-xs font-black">{name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className={`font-black text-sm truncate ${isActive ? config.text : 'text-slate-700 dark:text-slate-300'}`}>
                                        {name}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            animate={{ opacity: [1, 0.3, 1] }}
                                            transition={{ repeat: Infinity, duration: 1.2 }}
                                            className={`w-1.5 h-1.5 rounded-full ${config.bg} flex-shrink-0`}
                                        />
                                    )}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {type === 'DigiHub' ? '🤖 DigiHub' : '👤 Player'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-black">
                                <Home className={`w-3.5 h-3.5 ${config.text}`} />
                                <span className={`${config.text}`}>{homeCount}/4</span>
                            </div>
                        </div>

                        {/* Token indicators */}
                        <div className="flex gap-1.5">
                            {playerTokens.map((t, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-2 rounded-full transition-all ${
                                        t.stepCount === 57
                                            ? config.bg  // home — full color
                                            : t.stepCount > 0
                                                ? config.bg + ' opacity-50'  // on board — semi
                                                : 'bg-slate-200 dark:bg-slate-700'  // base — grey
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Winner label */}
                        {winner === color && (
                            <div className="mt-2 flex items-center gap-1 text-amber-500 text-xs font-black">
                                <Trophy className="w-3 h-3" />
                                <span>Winner!</span>
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
};

export default LudoHUD;
