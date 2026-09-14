import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    PLAYER_COLORS,
    getTokenCoordinates,
    SAFE_CELL_INDICES,
    MAIN_PATH
} from '../../../utils/ludoEngine';
import LudoToken from './LudoToken';
import { Star } from 'lucide-react';

const LudoBoard = ({
    tokens = {},
    activePlayers = ['Red', 'Green', 'Yellow', 'Blue'],
    movableTokenIds = [],
    onTokenClick,
    currentPlayer = 'Red'
}) => {

    // Helper to identify cell background styling for 15x15 grid
    const getCellProps = (r, c) => {
        // Red Home Stretch
        if (r === 7 && c >= 1 && c <= 5) return { bg: 'bg-red-500/80 border-red-400', isHomePath: true };
        // Green Home Stretch
        if (c === 7 && r >= 1 && r <= 5) return { bg: 'bg-emerald-500/80 border-emerald-400', isHomePath: true };
        // Yellow Home Stretch
        if (r === 7 && c >= 9 && c <= 13) return { bg: 'bg-amber-500/80 border-amber-400', isHomePath: true };
        // Blue Home Stretch
        if (c === 7 && r >= 9 && r <= 13) return { bg: 'bg-blue-500/80 border-blue-400', isHomePath: true };

        // Starting Star Cells
        if (r === 6 && c === 1) return { bg: 'bg-red-500/20 border-red-500', isStar: true, starColor: 'text-red-500' };
        if (r === 1 && c === 8) return { bg: 'bg-emerald-500/20 border-emerald-500', isStar: true, starColor: 'text-emerald-500' };
        if (r === 8 && c === 13) return { bg: 'bg-amber-500/20 border-amber-500', isStar: true, starColor: 'text-amber-500' };
        if (r === 13 && c === 6) return { bg: 'bg-blue-500/20 border-blue-500', isStar: true, starColor: 'text-blue-500' };

        // Extra Safe Star Cells
        if ((r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2)) {
            return { bg: 'bg-slate-700/40 border-slate-600', isStar: true, starColor: 'text-amber-400' };
        }

        return { bg: 'bg-[#1e232d] border-slate-800/80', isNormal: true };
    };

    // Calculate stacked offset for tokens on the same cell
    const tokenPositions = useMemo(() => {
        const map = {};
        activePlayers.forEach(p => {
            (tokens[p] || []).forEach(token => {
                const pos = getTokenCoordinates(token);
                const key = `${pos.r}-${pos.c}`;
                if (!map[key]) map[key] = [];
                map[key].push(token);
            });
        });
        return map;
    }, [tokens, activePlayers]);

    return (
        <div className="relative w-full max-w-[480px] sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] aspect-square mx-auto p-2 sm:p-3 bg-[#0d1117] rounded-[2.5rem] shadow-2xl border-4 border-slate-800/90 backdrop-blur-xl overflow-hidden select-none">

            {/* 15x15 CSS Grid Container */}
            <div className="grid w-full h-full border border-slate-800 rounded-2xl overflow-hidden relative" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))', gridTemplateRows: 'repeat(15, minmax(0, 1fr))' }}>

                {/* 1. Red Base Yard (Top-Left 6x6) */}
                <div className="bg-gradient-to-br from-red-600 to-red-700 p-3 sm:p-4 border-2 border-red-800 flex items-center justify-center relative shadow-inner" style={{ gridColumn: '1 / 7', gridRow: '1 / 7' }}>
                    <div className="w-full h-full bg-slate-900/90 rounded-2xl border-2 border-white/20 p-2 grid grid-cols-2 grid-rows-2 gap-2 justify-items-center items-center">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-950/60 border-2 border-red-500/40 flex items-center justify-center shadow-inner" />
                        ))}
                    </div>
                </div>

                {/* Top Path Block (3x6) */}
                <div className="grid grid-cols-3 grid-rows-6" style={{ gridColumn: '7 / 10', gridRow: '1 / 7' }}>
                    {Array.from({ length: 18 }).map((_, i) => {
                        const r = Math.floor(i / 3);
                        const c = 6 + (i % 3);
                        const props = getCellProps(r, c);
                        return (
                            <div key={i} className={`border border-slate-800/80 flex items-center justify-center relative ${props.bg}`}>
                                {props.isStar && <Star className={`w-3.5 h-3.5 ${props.starColor} fill-current`} />}
                            </div>
                        );
                    })}
                </div>

                {/* 2. Green Base Yard (Top-Right 6x6) */}
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-3 sm:p-4 border-2 border-emerald-800 flex items-center justify-center relative shadow-inner" style={{ gridColumn: '10 / 16', gridRow: '1 / 7' }}>
                    <div className="w-full h-full bg-slate-900/90 rounded-2xl border-2 border-white/20 p-2 grid grid-cols-2 grid-rows-2 gap-2 justify-items-center items-center">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-950/60 border-2 border-emerald-500/40 flex items-center justify-center shadow-inner" />
                        ))}
                    </div>
                </div>

                {/* Middle Left Path Block (6x3) */}
                <div className="grid grid-cols-6 grid-rows-3" style={{ gridColumn: '1 / 7', gridRow: '7 / 10' }}>
                    {Array.from({ length: 18 }).map((_, i) => {
                        const r = 6 + Math.floor(i / 6);
                        const c = i % 6;
                        const props = getCellProps(r, c);
                        return (
                            <div key={i} className={`border border-slate-800/80 flex items-center justify-center relative ${props.bg}`}>
                                {props.isStar && <Star className={`w-3.5 h-3.5 ${props.starColor} fill-current`} />}
                            </div>
                        );
                    })}
                </div>

                {/* 3. Center Home Area (3x3) */}
                <div className="bg-slate-950 relative border-2 border-slate-800 overflow-hidden" style={{ gridColumn: '7 / 10', gridRow: '7 / 10' }}>
                    {/* 4 Colored Triangles */}
                    <div className="absolute inset-0">
                        {/* Red Left Triangle */}
                        <div className="absolute inset-0 bg-red-600" style={{ clipPath: 'polygon(0% 0%, 50% 50%, 0% 100%)' }} />
                        {/* Green Top Triangle */}
                        <div className="absolute inset-0 bg-emerald-600" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)' }} />
                        {/* Yellow Right Triangle */}
                        <div className="absolute inset-0 bg-amber-500" style={{ clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)' }} />
                        {/* Blue Bottom Triangle */}
                        <div className="absolute inset-0 bg-blue-600" style={{ clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)' }} />
                        {/* Center Star Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-slate-900 border border-white/40 shadow-xl flex items-center justify-center">
                                <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Right Path Block (6x3) */}
                <div className="grid grid-cols-6 grid-rows-3" style={{ gridColumn: '10 / 16', gridRow: '7 / 10' }}>
                    {Array.from({ length: 18 }).map((_, i) => {
                        const r = 6 + Math.floor(i / 6);
                        const c = 9 + (i % 6);
                        const props = getCellProps(r, c);
                        return (
                            <div key={i} className={`border border-slate-800/80 flex items-center justify-center relative ${props.bg}`}>
                                {props.isStar && <Star className={`w-3.5 h-3.5 ${props.starColor} fill-current`} />}
                            </div>
                        );
                    })}
                </div>

                {/* 4. Blue Base Yard (Bottom-Left 6x6) */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 sm:p-4 border-2 border-blue-800 flex items-center justify-center relative shadow-inner" style={{ gridColumn: '1 / 7', gridRow: '10 / 16' }}>
                    <div className="w-full h-full bg-slate-900/90 rounded-2xl border-2 border-white/20 p-2 grid grid-cols-2 grid-rows-2 gap-2 justify-items-center items-center">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-950/60 border-2 border-blue-500/40 flex items-center justify-center shadow-inner" />
                        ))}
                    </div>
                </div>

                {/* Bottom Path Block (3x6) */}
                <div className="grid grid-cols-3 grid-rows-6" style={{ gridColumn: '7 / 10', gridRow: '10 / 16' }}>
                    {Array.from({ length: 18 }).map((_, i) => {
                        const r = 9 + Math.floor(i / 3);
                        const c = 6 + (i % 3);
                        const props = getCellProps(r, c);
                        return (
                            <div key={i} className={`border border-slate-800/80 flex items-center justify-center relative ${props.bg}`}>
                                {props.isStar && <Star className={`w-3.5 h-3.5 ${props.starColor} fill-current`} />}
                            </div>
                        );
                    })}
                </div>

                {/* 5. Yellow Base Yard (Bottom-Right 6x6) */}
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 sm:p-4 border-2 border-amber-800 flex items-center justify-center relative shadow-inner" style={{ gridColumn: '10 / 16', gridRow: '10 / 16' }}>
                    <div className="w-full h-full bg-slate-900/90 rounded-2xl border-2 border-white/20 p-2 grid grid-cols-2 grid-rows-2 gap-2 justify-items-center items-center">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-950/60 border-2 border-amber-500/40 flex items-center justify-center shadow-inner" />
                        ))}
                    </div>
                </div>

                {/* Tokens Layer Rendered on Top of Grid */}
                {activePlayers.map(pColor => {
                    return (tokens[pColor] || []).map(token => {
                        const pos = getTokenCoordinates(token);
                        const key = `${pos.r}-${pos.c}`;
                        const stack = tokenPositions[key] || [token];
                        const stackIndex = stack.findIndex(t => t.id === token.id && t.player === token.player);
                        const isMovable = token.player === currentPlayer && movableTokenIds.includes(token.id);

                        const offset = {
                            x: stackIndex * 5 - (stack.length > 1 ? (stack.length - 1) * 2.5 : 0),
                            y: stackIndex * 5 - (stack.length > 1 ? (stack.length - 1) * 2.5 : 0)
                        };

                        return (
                            <LudoToken
                                key={`${token.player}-${token.id}`}
                                token={token}
                                isMovable={isMovable}
                                onClick={onTokenClick}
                                stackedOffset={offset}
                                gridRow={pos.r}
                                gridCol={pos.c}
                            />
                        );
                    });
                })}

            </div>
        </div>
    );
};

export default LudoBoard;
