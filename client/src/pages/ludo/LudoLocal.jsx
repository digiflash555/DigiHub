import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LudoBoard from '../../components/games/ludo/LudoBoard';
import LudoHUD from '../../components/games/ludo/LudoHUD';
import LudoWinnerModal from '../../components/games/ludo/LudoWinnerModal';
import LudoQuickRollBar from '../../components/games/ludo/LudoQuickRollBar';
import {
    createInitialTokens, PLAYER_COLORS, getValidTokenMoves,
    findCapturedTokens, playLudoSound, getStepPath
} from '../../utils/ludoEngine';

const PLAYER_ORDER = ['Red', 'Green', 'Yellow', 'Blue'];
const COLOR_DEFAULTS = { Red: 'Player 1', Green: 'Player 2', Yellow: 'Player 3', Blue: 'Player 4' };

const LudoLocal = () => {
    const navigate = useNavigate();
    const [gamePhase, setGamePhase] = useState('setup'); // setup | playing | finished
    const [playerCount, setPlayerCount] = useState(2);
    const [playerNames, setPlayerNames] = useState({ Red: '', Green: '', Yellow: '', Blue: '' });
    const [isMuted, setIsMuted] = useState(false);

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

    // Synchronization Refs to prevent React Stale Closures in async timers
    const tokensRef = useRef(tokens);
    tokensRef.current = tokens;
    const currentPlayerRef = useRef(currentPlayer);
    currentPlayerRef.current = currentPlayer;
    const activePlayersRef = useRef(activePlayers);
    activePlayersRef.current = activePlayers;
    const consecutiveSixesRef = useRef(consecutiveSixes);
    consecutiveSixesRef.current = consecutiveSixes;
    const isMutedRef = useRef(isMuted);
    isMutedRef.current = isMuted;

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
        setGamePhase('playing');
        setTurnMessage(`${resolvedNames[players[0]] || players[0]}'s turn!`);
    };

    const advanceTurn = useCallback((extraTurn = false) => {
        setHasRolled(false);
        setMovableTokenIds([]);
        setDiceValue(1);
        if (!extraTurn) {
            setCurrentPlayerIndex(prev => {
                const next = (prev + 1) % activePlayersRef.current.length;
                const nextColor = activePlayersRef.current[next];
                const nextName = resolvedNames[nextColor] || nextColor;
                setTurnMessage(`${nextName}'s turn!`);
                return next;
            });
        } else {
            const curColor = currentPlayerRef.current;
            const curName = resolvedNames[curColor] || curColor;
            setTurnMessage(`${curName}'s extra turn!`);
        }
    }, [resolvedNames]);

    const handleFinish = (color) => {
        setRankings(prev => {
            const newRankings = [...prev, color];
            if (!winner) { setWinner(color); playLudoSound('win', isMutedRef.current); }
            return newRankings;
        });
        advanceTurn(false);
    };

    const finishTokenMove = useCallback((movedToken, finalStep, effectiveDice) => {
        const usedDice = effectiveDice ?? diceValue;
        let extraTurn = usedDice === 6;
        const curPlayer = currentPlayerRef.current;
        const captures = finalStep >= 1 && finalStep <= 51
            ? findCapturedTokens({ ...movedToken, player: curPlayer }, finalStep, tokensRef.current) : [];

        if (captures.length > 0) {
            playLudoSound('capture', isMutedRef.current);
            extraTurn = true;
            setTurnMessage('Capture! Extra turn.');
            setTokens(prev => {
                const n = { ...prev };
                captures.forEach(c => {
                    if (n[c.player]) {
                        n[c.player] = n[c.player].map(t => t.id === c.id ? { ...t, stepCount: 0 } : t);
                    }
                });
                return n;
            });
        }
        if (finalStep === 57) { playLudoSound('safe', isMutedRef.current); extraTurn = true; }
        setIsAnimatingMove(false);

        const curAllTokens = tokensRef.current[curPlayer] || [];
        const allHome = curAllTokens.every(t => (t.id === movedToken.id ? finalStep : t.stepCount) === 57);

        if (allHome) {
            handleFinish(curPlayer);
        } else {
            advanceTurn(extraTurn);
        }
    }, [diceValue, advanceTurn]);

    const handleTokenClick = useCallback((token, force = false, diceOverride = null) => {
        if (!force) {
            if (!hasRolled || isRolling || isAnimatingMove || winner) return;
            if (!movableTokenIds.includes(token.id)) return;
        }
        const effectiveDice = diceOverride ?? diceValue;
        const curPlayer = currentPlayerRef.current;
        setIsAnimatingMove(true);
        setMovableTokenIds([]);

        const pathSteps = getStepPath(token, effectiveDice);
        let stepIdx = 0;
        movementTimerRef.current = setInterval(() => {
            if (stepIdx < pathSteps.length) {
                const step = pathSteps[stepIdx];
                playLudoSound('step', isMutedRef.current);
                setTokens(prev => {
                    const n = { ...prev };
                    if (n[curPlayer]) {
                        n[curPlayer] = n[curPlayer].map(t => t.id === token.id ? { ...t, stepCount: step } : t);
                    }
                    return n;
                });
                stepIdx++;
            } else {
                clearInterval(movementTimerRef.current);
                finishTokenMove(token, pathSteps[pathSteps.length - 1], effectiveDice);
            }
        }, 120);
    }, [hasRolled, isRolling, isAnimatingMove, winner, movableTokenIds, diceValue, finishTokenMove]);

    const finishRoll = useCallback(() => {
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setIsRolling(false);
        setHasRolled(true);
        const curPlayer = currentPlayerRef.current;
        const curTokens = tokensRef.current[curPlayer] || [];
        const isSix = finalValue === 6;

        let nextSixes = consecutiveSixesRef.current;
        if (isSix) {
            nextSixes++;
            setConsecutiveSixes(nextSixes);
            setTurnMessage('Rolled a 6! Extra turn.');
        } else {
            setConsecutiveSixes(0);
            setTurnMessage(`Rolled a ${finalValue}.`);
        }

        if (nextSixes === 3) {
            setTurnMessage('Three 6s in a row! Turn forfeited.');
            setConsecutiveSixes(0);
            setTimeout(() => advanceTurn(false), 1200);
            return;
        }

        const validMoves = getValidTokenMoves(curTokens, finalValue);
        if (validMoves.length === 0) {
            setTurnMessage('No valid moves! Passing turn...');
            setTimeout(() => advanceTurn(isSix), 1200);
        } else {
            setMovableTokenIds(validMoves.map(t => t.id));
        }
    }, [advanceTurn]);

    const handleRollDice = useCallback(() => {
        if (isRolling || hasRolled || isAnimatingMove || winner) return;
        setIsRolling(true);
        playLudoSound('roll', isMutedRef.current);
        let rolls = 0;
        const rollInterval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            rolls++;
            if (rolls > 8) {
                clearInterval(rollInterval);
                finishRoll();
            }
        }, 60);
    }, [isRolling, hasRolled, isAnimatingMove, winner, finishRoll]);

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

            {/* Game Board */}
            {gamePhase === 'playing' && (
                <>
                    <div className="max-w-7xl mx-auto px-4 py-6 pb-28">
                        <div className="flex flex-col xl:flex-row gap-6 items-start justify-center">
                            {/* Left HUD */}
                            <div className="w-full xl:w-56 order-2 xl:order-1">
                                <LudoHUD activePlayers={activePlayers} playerNames={resolvedNames} tokens={tokens} currentPlayer={currentPlayer} winner={winner} />
                            </div>

                            {/* Board */}
                            <div className="flex-1 flex flex-col items-center gap-5 order-1 xl:order-2">
                                <LudoBoard tokens={tokens} activePlayers={activePlayers} currentPlayer={currentPlayer} movableTokenIds={movableTokenIds} onTokenClick={handleTokenClick} />
                            </div>
                        </div>
                    </div>

                    {/* Easy Access Floating Dice Quick-Roll Bar */}
                    <LudoQuickRollBar
                        value={diceValue}
                        onRoll={handleRollDice}
                        isRolling={isRolling}
                        canRoll={!isRolling && !hasRolled && !winner && !isAnimatingMove}
                        hasRolled={hasRolled}
                        hasValidMoves={movableTokenIds.length > 0}
                        currentPlayer={currentPlayer}
                        playerName={resolvedNames[currentPlayer] || currentPlayer}
                        turnMessage={turnMessage}
                        winner={winner}
                    />
                </>
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
