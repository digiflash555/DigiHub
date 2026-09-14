import { motion } from 'framer-motion';
import { PLAYER_COLORS } from '../../../utils/ludoEngine';

const LudoToken = ({
    token,
    isMovable = false,
    onClick,
    stackedOffset = { x: 0, y: 0 },
    gridRow,
    gridCol
}) => {
    const config = PLAYER_COLORS[token.player] || PLAYER_COLORS.Red;

    // Convert 0..14 row/col to grid percentage
    const style = {
        gridRowStart: gridRow + 1,
        gridColumnStart: gridCol + 1,
        transform: `translate(${stackedOffset.x}px, ${stackedOffset.y}px)`
    };

    return (
        <motion.div
            style={style}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            whileHover={isMovable ? { scale: 1.25, zIndex: 30 } : {}}
            whileTap={isMovable ? { scale: 0.9 } : {}}
            onClick={() => isMovable && onClick && onClick(token)}
            className={`relative w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center cursor-pointer z-20 transition-all ${
                isMovable ? 'ring-4 ring-white animate-bounce cursor-pointer' : ''
            }`}
        >
            {/* Outer Glow when Movable */}
            {isMovable && (
                <div
                    className="absolute -inset-1.5 rounded-full animate-ping opacity-75 pointer-events-none"
                    style={{ backgroundColor: config.hex }}
                />
            )}

            {/* 3D Circular Token Body */}
            <div
                className="w-full h-full rounded-full shadow-lg border-2 border-white/90 flex items-center justify-center relative overflow-hidden"
                style={{
                    background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${config.hex} 60%, #000000 100%)`,
                    boxShadow: `0 4px 10px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(0,0,0,0.4)`
                }}
            >
                {/* Inner Ring */}
                <div className="w-1/2 h-1/2 rounded-full border border-white/60 bg-white/20 shadow-inner flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
                </div>
            </div>
        </motion.div>
    );
};

export default LudoToken;
