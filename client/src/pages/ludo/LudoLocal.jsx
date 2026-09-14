import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LudoBoard from '../../components/games/ludo/LudoBoard';
import LudoDice from '../../components/games/ludo/LudoDice';
import LudoHUD from '../../components/games/ludo/LudoHUD';
import LudoWinnerModal from '../../components/games/ludo/LudoWinnerModal';
import {
    createInitialTokens, PLAYER_COLORS, getValidTokenMoves,
    findCapturedTokens, playLudoSound, getStepPath
} from '../../utils/ludoEngine';

const PLAYER_ORDER = ['Red', 'Green', 'Yellow', 'Blue'];
const COLOR_DEFAULTS = { Red: 'Player 1', Green: 'Player 2', Yellow: 'Player 3', Blue: 'Player 4' };

const LudoLocal = () => {
    const navigate = useNavigate();
    const [gamePhase, setGamePhase] = useState('setup'); // setup | pass | playing | finished
    const [playerCount, setPlayerCount] = useState(2);
    const [playerNames, setPlayerNames] = useState({ Red: '', Green: '', Yellow: '', Blue: '' });
    const [isMuted, setIsMuted] = useState(false);
    const [showPassScreen, setShowPassScreen] = useState(false);

    // Game state
    const [activePlayers, setActivePlayers] = useState([]);
    const [tokens, setTokens] = useState({});
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [diceValue, setDiceValue] = useState(1);
    const [isRolling, setIsRolling] = useState(false);
    const [hasRolled, setHasRolled] = useState(false);
    const [movableTokenIds, setMovableTokenIds] = useState([]);
    const [consecutiveSixes, setConsecutiveSixes] = useState(0);
    const [winner, setWinner] = useState(null);
    const [rankings, setRankings] = useState([]);
    const [isAnimatingMove, setIsAnimatingMove] = useState(false);
    const [turnMessage, setTurnMessage] = useState('');

    const movementTimerRef = useRef(null);
    useEffect(() => () => clearInterval(movementTimerRef.current), []);

    const currentPlayer = activePlayers[currentPlayerIndex] || 'Red';
    const resolvedNames = {};
    PLAYER_ORDER.forEach(c => {
        resolvedNames[c] = playerNames[c]?.trim() || COLOR_DEFAULTS[c];
    });

    const startGame = () => {
        const players = PLAYER_ORDER.slice(0, playerCount);
        setActivePlayers(players);
        setTokens(createInitialTokens());
        setCurrentPlayerIndex(0);
        setDiceValue(1);
        setHasRolled(false);
        setMovableTokenIds([]);
        setConsecutiveSixes(0);
        setWinner(null);
        setRankings([]);
        setIsAnimatingMove(false);
        setGamePhase('pass');
        setShowPassScreen(true);
    };

    const dismissPassScreen = () => {
        setShowPassScreen(false);
        setGamePhase('playing');
    };

    const handleRollDice = useCallback(() => {
        if (isRolling || hasRolled || isAnimatingMove || winner) return;
        setIsRolling(true);
        playLudoSound('roll', isMuted);
        let rolls = 0;
        const rollInterval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            rolls++;
            if (rolls > 8) {
                clearInterval(rollInterval);
                finishRoll();
            }
        }, 80);
    }, [isRolling, hasRolled, isAnimatingMove, winner, isMuted]);

    const finishRoll = useCallback(() => {
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setIsRolling(false);
        setHasRolled(true);
        const isSix = finalValue === 6;
        let nextSixes = consecutiveSixes;
        if (isSix) { nextSixes++; setConsecutiveSixes(nextSixes); setTurnMessage('Rolled a 6! Extra turn.'); }
        else { setConsecutiveSixes(0); setTurnMessage(`Rolled a ${finalValue}.`); }
        if (nextSixes === 3) {
            setTurnMessage('Three 6s in a row! Turn forfeited.');
            setConsecutiveSixes(0);
            setTimeout(() => advanceTurn(false), 1500);
            return;
        }
        const validMoves = getValidTokenMoves(tokens[currentPlayer] || [], finalValue);
        if (validMoves.length === 0) {
            setTurnMessage('No valid moves! Passing turn...');
            setTimeout(() => advanceTurn(isSix), 1500);
        } else {
            setMovableTokenIds(validMoves.map(t => t.id));
        }
    }, [consecutiveSixes, tokens, currentPlayer]);

    const handleTokenClick = useCallback((token, force = false, diceOverride = null) => {
        if (!force) {
            if (!hasRolled || isRolling || isAnimatingMove || winner) return;
            if (!movableTokenIds.includes(token.id)) return;
        }
        const effectiveDice = diceOverride ?? diceValue;
        setIsAnimatingMove(true);
        setMovableTokenIds([]);
        const pathSteps = getStepPath(token, effectiveDice);
        let stepIdx = 0;
        movementTimerRef.current = setInterval(() => {
            if (stepIdx < pathSteps.length) {
                const step = pathSteps[stepIdx];
                playLudoSound('step', isMuted);
                setTokens(prev => {
                    const n = { ...prev };
                    n[currentPlayer] = n[currentPlayer].map(t => t.id === token.id ? { ...t, stepCount: step } : t);
                    return n;
                });
                stepIdx++;
            } else {
                clearInterval(movementTimerRef.current);
                finishTokenMove(token, pathSteps[pathSteps.length - 1], effectiveDice);
            }
        }, 150);
    }, [hasRolled, isRolling, isAnimatingMove, winner, movableTokenIds, diceValue, isMuted, currentPlayer]);

    const finishTokenMove = useCallback((movedToken, finalStep, effectiveDice) => {
        const usedDice = effectiveDice ?? diceValue;
        let extraTurn = usedDice === 6;
        const captures = finalStep >= 1 && finalStep <= 51
            ? findCapturedTokens({ ...movedToken, player: currentPlayer }, finalStep, tokens) : [];
        if (captures.length > 0) {
            playLudoSound('capture', isMuted);
            extraTurn = true;
            setTurnMessage('Capture! Extra turn.');
            setTokens(prev => {
                const n = { ...prev };
                captures.forEach(c => { n[c.player] = n[c.player].map(t => t.id === c.id ? { ...t, stepCount: 0 } : t); });
                return n;
            });
        }
        if (finalStep === 57) { playLudoSound('safe', isMuted); extraTurn = true; }
        setIsAnimatingMove(false);
        setTokens(prev => {
            const allHome = prev[currentPlayer].every(t => (t.id === movedToken.id ? finalStep : t.stepCount) === 57);
            if (allHome) { handleFinish(currentPlayer, prev, extraTurn); return prev; }
            advanceTurn(extraTurn);
            return prev;
        });
    }, [currentPlayer, tokens, diceValue, isMuted]);

    const handleFinish = (color, latestTokens, extraTurn) => {
        setRankings(prev => {
            const newRankings = [...prev, color];
            if (!winner) { setWinner(color); playLudoSound('win', isMuted); }
            return newRankings;
        });
        advanceTurn(false);
    };

    const advanceTurn = useCallback((extraTurn = false) => {
        setHasRolled(false);
        setMovableTokenIds([]);
        setDiceValue(1);
        if (!extraTurn) {
            setCurrentPlayerIndex(prev => {
                const next = (prev + 1) % activePlayers.length;
                const nextColor = activePlayers[next];
                const nextName = resolvedNames[nextColor] || nextColor;
                setTurnMessage(`${nextName}'s turn!`);
                // Show pass screen between turns in local mode
                setShowPassScreen(true);
                setGamePhase('pass');
                return next;
            });
        }
    }, [activePlayers, resolvedNames]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
            {/* Top Bar */}
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-[#1a1e26]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <button onClick={() => navigate('/games/ludo')} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-black text-slate-700 dark:text-white">Local Play</span>
                </div>
                <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Setup Screen */}
            {gamePhase === 'setup' && (
                <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
                    <div className="text-center space-y-1">
                        <div className="text-5xl mb-2">👥</div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Play With Friends</h1>
                        <p className="text-slate-500 font-medium">Pass & play on one device</p>
                    </div>

                    <div className="bg-white dark:bg-[#1a1e26] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
                        {/* Player Count */}
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block">Number of Players</label>
                            <div className="flex gap-2">
                                {[2, 3, 4].map(n => (
                                    <button key={n} onClick={() => setPlayerCount(n)}
                                        className={`flex-1 py-3 rounded-2xl font-black text-lg transition-all ${playerCount === n ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                        {n}P
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Player Name Inputs */}
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block">Player Names</label>
                            <div className="space-y-3">
                                {PLAYER_ORDER.slice(0, playerCount).map((color, idx) => {
                                    const cfg = PLAYER_COLORS[color];
                                    return (
                                        <div key={color} className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md`}>
                                                {idx + 1}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder={COLOR_DEFAULTS[color]}
                                                value={playerNames[color]}
                                                onChange={e => setPlayerNames(prev => ({ ...prev, [color]: e.target.value }))}
                                                maxLength={14}
                                                className={`flex-1 px-4 py-2.5 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none transition-colors ${cfg.border} focus:ring-2 focus:ring-offset-1`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button onClick={startGame}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-lg shadow-xl shadow-emerald-500/25 hover:opacity-90 active:scale-95 transition-all">
                            Start Game 🎲
                        </button>
                    </div>
                </div>
            )}

            {/* Pass Device Screen */}
            <AnimatePresence>
                {showPassScreen && (gamePhase === 'pass') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 flex items-center justify-center p-4"
                        style={{ background: `linear-gradient(135deg, ${PLAYER_COLORS[currentPlayer]?.hex}44 0%, #0d111788 100%)` }}
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-[#1a1e26] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5"
                        >
                            <div className={`w-20 h-20 mx-auto rounded-2xl ${PLAYER_COLORS[currentPlayer]?.bg} flex items-center justify-center text-white text-3xl font-black shadow-xl`}>
                                {(resolvedNames[currentPlayer] || currentPlayer).charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-slate-500 font-medium text-sm">Pass the device to</p>
                                <h2 className={`text-3xl font-black mt-1 ${PLAYER_COLORS[currentPlayer]?.text}`}>
                                    {resolvedNames[currentPlayer] || currentPlayer}
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">It's your turn! 🎲</p>
                            </div>
                            <button
                                onClick={dismissPassScreen}
                                className={`w-full py-3.5 rounded-2xl text-white font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${PLAYER_COLORS[currentPlayer]?.bg}`}
                            >
                                I'm Ready <ChevronRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Board */}
            {gamePhase === 'playing' && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col xl:flex-row gap-6 items-start justify-center">
                        {/* Left HUD */}
                        <div className="w-full xl:w-56 order-2 xl:order-1">
                            <LudoHUD activePlayers={activePlayers} playerNames={resolvedNames} tokens={tokens} currentPlayer={currentPlayer} winner={winner} />
                        </div>

                        {/* Board */}
                        <div className="flex-1 flex flex-col items-center gap-5 order-1 xl:order-2">
                            <LudoBoard tokens={tokens} activePlayers={activePlayers} currentPlayer={currentPlayer} movableTokenIds={movableTokenIds} onTokenClick={handleTokenClick} />

                            {/* Dice + Turn */}
                            <div className="w-full max-w-sm bg-white dark:bg-[#1a1e26] p-5 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-6 justify-center">
                                <LudoDice
                                    value={diceValue}
                                    onRoll={handleRollDice}
                                    isRolling={isRolling}
                                    canRoll={!isRolling && !hasRolled && !winner && !isAnimatingMove}
                                    currentPlayer={currentPlayer}
                                />
                                <div className="space-y-1">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Current Turn</div>
                                    <div className={`text-lg font-black ${PLAYER_COLORS[currentPlayer].text}`}>
                                        {resolvedNames[currentPlayer]}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium h-4">{turnMessage}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Winner Modal */}
            {winner && (
                <LudoWinnerModal
                    winner={winner}
                    rankings={rankings}
                    playerNames={resolvedNames}
                    onPlayAgain={startGame}
                    onMenu={() => navigate('/games/ludo')}
                />
            )}
        </div>
    );
};

export default LudoLocal;
