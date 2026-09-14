import { motion } from 'framer-motion';
import { PLAYER_COLORS } from '../../../utils/ludoEngine';

// Standard 3x3 Dice Dot Cell Maps (0..8)
// 0 1 2
// 3 4 5
// 6 7 8
const DICE_DOT_INDICES = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
};

const LudoDice = ({
    value = 6,
    onRoll,
    isRolling = false,
    canRoll = false,
    currentPlayer = 'Red',
    showButton = false,
    size = 'normal'
}) => {
    const config = PLAYER_COLORS[currentPlayer] || PLAYER_COLORS.Red;

    const sizeClasses = {
        normal: 'w-16 h-16 sm:w-20 sm:h-20 p-2.5',
        large: 'w-20 h-20 sm:w-24 sm:h-24 p-3',
        floating: 'w-14 h-14 sm:w-16 sm:h-16 p-2'
    }[size] || 'w-16 h-16 sm:w-20 sm:h-20 p-2.5';

    const safeValue = Math.min(Math.max(Number(value) || 1, 1), 6);
    const activeDots = DICE_DOT_INDICES[safeValue] || DICE_DOT_INDICES[6];

    return (
        <div className="flex items-center gap-3">
            {/* 2D Front-Facing Animated Dice Box (Cannot turn edge-on into line) */}
            <motion.div
                animate={isRolling ? {
                    rotate: [0, -25, 25, -15, 15, 0],
                    scale: [1, 1.2, 0.9, 1.1, 1]
                } : canRoll ? {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                        `0 10px 25px ${config.glow}`,
                        `0 15px 35px ${config.glow}`,
                        `0 10px 25px ${config.glow}`
                    ]
                } : {
                    rotate: 0,
                    scale: 1
                }}
                transition={isRolling ? { duration: 0.5, ease: "easeInOut" } : { repeat: Infinity, duration: 1.5 }}
                className={`${sizeClasses} rounded-2xl shadow-2xl flex items-center justify-center relative border-2 transition-all select-none bg-white ${
                    canRoll ? 'ring-4 ring-white/80 cursor-pointer hover:scale-105 active:scale-95' : 'opacity-100 shadow-xl'
                }`}
                style={{
                    backgroundColor: '#ffffff',
                    borderColor: config.hex,
                    boxShadow: `0 10px 25px ${config.glow}, inset 0 -4px 6px rgba(0,0,0,0.15)`
                }}
                onClick={() => canRoll && !isRolling && onRoll && onRoll()}
            >
                {/* 3x3 Dots Grid */}
                <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1.5 gap-1 items-center justify-items-center bg-white rounded-xl">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(cellIdx => {
                        const hasDot = activeDots.includes(cellIdx);
                        return (
                            <div key={cellIdx} className="w-full h-full flex items-center justify-center">
                                {hasDot && (
                                    <div
                                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full"
                                        style={{
                                            backgroundColor: config.hex,
                                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6), 0 1px 2px rgba(255,255,255,0.5)'
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Optional Roll Button */}
            {showButton && (
                <motion.button
                    whileHover={canRoll && !isRolling ? { scale: 1.05 } : {}}
                    whileTap={canRoll && !isRolling ? { scale: 0.95 } : {}}
                    onClick={() => canRoll && !isRolling && onRoll && onRoll()}
                    disabled={!canRoll || isRolling}
                    className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 ${
                        canRoll && !isRolling
                            ? `bg-gradient-to-r ${config.gradient || 'from-indigo-600 to-purple-600'} text-white shadow-lg cursor-pointer animate-pulse`
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                >
                    <span className="text-lg">🎲</span>
                    <span>{isRolling ? 'Rolling...' : canRoll ? 'TAP TO ROLL' : 'WAIT TURN'}</span>
                </motion.button>
            )}
        </div>
    );
};

export default LudoDice;
