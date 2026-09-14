import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Info, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LudoBoard from '../../components/games/ludo/LudoBoard';
import LudoDice from '../../components/games/ludo/LudoDice';
import LudoHUD from '../../components/games/ludo/LudoHUD';
import LudoWinnerModal from '../../components/games/ludo/LudoWinnerModal';
import {
    createInitialTokens, PLAYER_COLORS, getValidTokenMoves,
    getBestAiMove, findCapturedTokens, playLudoSound, getStepPath
} from '../../utils/ludoEngine';

const PLAYER_ORDER = ['Red', 'Green', 'Yellow', 'Blue'];

// AI picks smart move 75% of the time, random 25% (keeps it beatable)
const getAiMove = (player, tokens, diceValue) => {
    const playerTokens = tokens[player] || [];
    const validMoves = getValidTokenMoves(playerTokens, diceValue);
    if (validMoves.length === 0) return null;
    if (validMoves.length === 1) return validMoves[0];
    if (Math.random() < 0.25) return validMoves[Math.floor(Math.random() * validMoves.length)];
    return getBestAiMove(player, tokens, diceValue);
};

const LudoAI = () => {
    const navigate = useNavigate();
    const [gamePhase, setGamePhase] = useState('setup'); // setup | playing | finished
    const [playerCount, setPlayerCount] = useState(2);
    const [humanColor, setHumanColor] = useState('Red');
    const [isMuted, setIsMuted] = useState(false);
    const [isThinking, setIsThinking] = useState(false);

    // Game state
    const [activePlayers, setActivePlayers] = useState([]);
    const [playerTypes, setPlayerTypes] = useState({});
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
    const aiTimerRef = useRef(null);

    const currentPlayer = activePlayers[currentPlayerIndex] || 'Red';
    const isAiTurn = gamePhase === 'playing' && playerTypes[currentPlayer] === 'DigiHub';

    const playerNames = {};
    activePlayers.forEach(c => { playerNames[c] = playerTypes[c] === 'DigiHub' ? 'DigiHub' : c; });

    useEffect(() => () => {
        clearInterval(movementTimerRef.current);
        clearTimeout(aiTimerRef.current);
    }, []);

    useEffect(() => {
        if (gamePhase !== 'playing' || !isAiTurn || isRolling || hasRolled || isAnimatingMove || winner) return;
        setIsThinking(true);
        aiTimerRef.current = setTimeout(() => {
            setIsThinking(false);
            handleRollDice();
        }, 1200 + Math.random() * 600);
    }, [currentPlayerIndex, gamePhase, isAiTurn, hasRolled, isRolling, isAnimatingMove, winner]);

    const startGame = () => {
        const players = PLAYER_ORDER.slice(0, playerCount);
        const types = {};
        players.forEach(c => { types[c] = c === humanColor ? 'Human' : 'DigiHub'; });
        setActivePlayers(players);
        setPlayerTypes(types);
        setTokens(createInitialTokens());
        setCurrentPlayerIndex(0);
        setDiceValue(1);
        setHasRolled(false);
        setMovableTokenIds([]);
        setConsecutiveSixes(0);
        setWinner(null);
        setRankings([]);
        setIsAnimatingMove(false);
        setGamePhase('playing');
        setTurnMessage(`${players[0]}'s turn!`);
    };

    const handleRollDice = useCallback(() => {
        if (isRolling || hasRolled || isAnimatingMove || winner) return;
        setIsRolling(true);
        playLudoSound('roll', isMuted);
        let rolls = 0;
        const rollInterval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            rolls++;
            if (rolls > 8) { clearInterval(rollInterval); finishRoll(); }
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
            setTurnMessage('Three 6s! Turn forfeited.');
            setConsecutiveSixes(0);
            setTimeout(() => advanceTurn(false), 1500);
            return;
        }
        const currentTokens = tokens[currentPlayer];
        const validMoves = getValidTokenMoves(currentTokens, finalValue);
        if (validMoves.length === 0) {
            setTurnMessage('No valid moves!');
            setTimeout(() => advanceTurn(isSix), 1500);
        } else if (isAiTurn) {
            const bestMove = getAiMove(currentPlayer, tokens, finalValue);
            setTimeout(() => handleTokenClick(bestMove, true, finalValue), 900);
        } else {
            setMovableTokenIds(validMoves.map(t => t.id));
        }
    }, [consecutiveSixes, tokens, currentPlayer, isAiTurn]);

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
                captures.forEach(c => {
                    n[c.player] = n[c.player].map(t => t.id === c.id ? { ...t, stepCount: 0 } : t);
                });
                return n;
            });
        }
        if (finalStep === 57) { playLudoSound('safe', isMuted); extraTurn = true; }
        setIsAnimatingMove(false);
        setTokens(prev => {
            const allHome = prev[currentPlayer].every(t => (t.id === movedToken.id ? finalStep : t.stepCount) === 57);
            if (allHome) {
                handleFinish(currentPlayer, prev);
                return prev;
            }
            advanceTurn(extraTurn);
            return prev;
        });
    }, [currentPlayer, tokens, diceValue, isMuted]);

    const handleFinish = (color, latestTokens) => {
        setRankings(prev => {
            const newRankings = [...prev, color];
            const remainingActive = activePlayers.filter(p => !newRankings.includes(p) &&
                (latestTokens[p] || []).some(t => t.stepCount < 57));
            if (!winner) { setWinner(color); playLudoSound('win', isMuted); }
            if (remainingActive.length === 0) setGamePhase('finished');
            return newRankings;
        });
    };

    const advanceTurn = useCallback((extraTurn = false) => {
        setHasRolled(false);
        setMovableTokenIds([]);
        setDiceValue(1);
        if (!extraTurn) {
            setCurrentPlayerIndex(prev => {
                const next = (prev + 1) % activePlayers.length;
                setTurnMessage(`${playerNames[activePlayers[next]] || activePlayers[next]}'s turn!`);
                return next;
            });
        }
    }, [activePlayers, playerNames]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
            {/* Top Bar */}
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-[#1a1e26]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <button onClick={() => navigate('/games/ludo')} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-700 dark:text-white">🤖 You vs DigiHub</span>
                </div>
                <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            </div>

            {/* Setup Screen */}
            {gamePhase === 'setup' && (
                <div className="max-w-md mx-auto px-4 py-8 space-y-6">
                    <div className="text-center space-y-1">
                        <div className="text-5xl mb-2">🤖</div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">You vs DigiHub</h1>
                        <p className="text-slate-500 font-medium">Challenge our intelligent AI opponent</p>
                    </div>

                    <div className="bg-white dark:bg-[#1a1e26] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xl">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block">Number of Players</label>
                            <div className="flex gap-2">
                                {[2, 3, 4].map(n => (
                                    <button key={n} onClick={() => setPlayerCount(n)}
                                        className={`flex-1 py-3 rounded-2xl font-black text-lg transition-all ${playerCount === n ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                        {n}P
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block">Your Color</label>
                            <div className="grid grid-cols-2 gap-2">
                                {PLAYER_ORDER.slice(0, playerCount).map(color => {
                                    const cfg = PLAYER_COLORS[color];
                                    return (
                                        <button key={color} onClick={() => setHumanColor(color)}
                                            className={`p-3 rounded-2xl border-2 flex items-center gap-2 transition-all font-bold text-sm ${humanColor === color ? `${cfg.light} ${cfg.border}` : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                            <div className={`w-4 h-4 rounded-full ${cfg.bg}`} />
                                            <span className={humanColor === color ? cfg.text : 'text-slate-600 dark:text-slate-300'}>{color}</span>
                                            {humanColor === color && <span className="ml-auto text-xs">You</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <button onClick={startGame}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg shadow-xl shadow-indigo-500/25 hover:opacity-90 active:scale-95 transition-all">
                            Start Game 🚀
                        </button>
                    </div>
                </div>
            )}

            {/* Game Board */}
            {gamePhase === 'playing' && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col xl:flex-row gap-6 items-start justify-center">
                        {/* Left HUD */}
                        <div className="w-full xl:w-56 order-2 xl:order-1">
                            <LudoHUD activePlayers={activePlayers} playerNames={playerNames} tokens={tokens} currentPlayer={currentPlayer} winner={winner} playerTypes={playerTypes} />
                        </div>

                        {/* Board */}
                        <div className="flex-1 flex flex-col items-center gap-5 order-1 xl:order-2">
                            <LudoBoard tokens={tokens} activePlayers={activePlayers} currentPlayer={currentPlayer} movableTokenIds={movableTokenIds} onTokenClick={handleTokenClick} />

                            {/* Dice + Turn Info */}
                            <div className="w-full max-w-sm bg-white dark:bg-[#1a1e26] p-5 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-6 justify-center">
                                <LudoDice
                                    value={diceValue}
                                    onRoll={handleRollDice}
                                    isRolling={isRolling}
                                    canRoll={!isRolling && !hasRolled && !isAiTurn && !winner && !isAnimatingMove}
                                    currentPlayer={currentPlayer}
                                />
                                <div className="space-y-1">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Current Turn</div>
                                    <div className={`text-lg font-black ${PLAYER_COLORS[currentPlayer].text}`}>
                                        {playerNames[currentPlayer]} {isAiTurn ? '🤖' : '👤'}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium h-4">
                                        {isThinking ? (
                                            <span className="flex items-center gap-1 text-indigo-500">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                DigiHub is thinking...
                                            </span>
                                        ) : turnMessage}
                                    </div>
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
                    playerNames={playerNames}
                    onPlayAgain={startGame}
                    onMenu={() => navigate('/games/ludo')}
                />
            )}
        </div>
    );
};

export default LudoAI;
