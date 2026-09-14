import { useState } from 'react';
import { motion } from 'framer-motion';
import { PLAYER_COLORS } from '../../../utils/ludoEngine';

const DICE_DOT_LAYOUTS = {
    1: ['col-start-2 row-start-2'],
    2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
    3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
    4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    5: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    6: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3']
};

const LudoDice = ({
    value = 6,
    onRoll,
    isRolling = false,
    canRoll = false,
    currentPlayer = 'Red'
}) => {
    const config = PLAYER_COLORS[currentPlayer] || PLAYER_COLORS.Red;

    return (
        <div className="flex flex-col items-center gap-3">
            {/* 3D Animated Dice Box */}
            <motion.div
                animate={isRolling ? {
                    rotateX: [0, 360, 720, 1080],
                    rotateY: [0, 360, 720, 1080],
                    scale: [1, 1.2, 0.9, 1.1, 1]
                } : {}}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-2.5 shadow-2xl flex items-center justify-center relative border-2 transition-all select-none ${
                    canRoll ? 'ring-4 ring-white animate-pulse cursor-pointer' : 'opacity-90'
                }`}
                style={{
                    background: `linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)`,
                    borderColor: config.hex,
                    boxShadow: `0 10px 25px ${config.glow}, inset 0 -4px 6px rgba(0,0,0,0.1)`
                }}
                onClick={() => canRoll && !isRolling && onRoll && onRoll()}
            >
                {/* Dots Grid (3x3) */}
                <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-1 items-center justify-items-center">
                    {(DICE_DOT_LAYOUTS[value] || DICE_DOT_LAYOUTS[6]).map((posClass, idx) => (
                        <div
                            key={idx}
                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shadow-inner ${posClass}`}
                            style={{
                                backgroundColor: config.hex,
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
                            }}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Roll Button */}
            <motion.button
                whileHover={canRoll && !isRolling ? { scale: 1.05 } : {}}
                whileTap={canRoll && !isRolling ? { scale: 0.95 } : {}}
                onClick={() => canRoll && !isRolling && onRoll && onRoll()}
                disabled={!canRoll || isRolling}
                className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 ${
                    canRoll && !isRolling
                        ? 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white shadow-primary-500/30 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
            >
                <span>🎲</span>
                <span>{isRolling ? 'Rolling...' : canRoll ? 'Roll Dice' : 'Wait Turn'}</span>
            </motion.button>
        </div>
    );
};

export default LudoDice;
