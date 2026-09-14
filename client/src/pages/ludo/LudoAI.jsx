import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LudoBoard from '../../components/games/ludo/LudoBoard';
import LudoHUD from '../../components/games/ludo/LudoHUD';
import LudoWinnerModal from '../../components/games/ludo/LudoWinnerModal';
import LudoQuickRollBar from '../../components/games/ludo/LudoQuickRollBar';
import {
    createInitialTokens, PLAYER_COLORS, getValidTokenMoves,
    getBestAiMove, findCapturedTokens, playLudoSound, getStepPath
} from '../../utils/ludoEngine';

const PLAYER_ORDER = ['Red', 'Green', 'Yellow', 'Blue'];

const getAiMove = (player, tokens, diceValue) => {
    const playerTokens = tokens[player] || [];
    const validMoves = getValidTokenMoves(playerTokens, diceValue);
    if (validMoves.length === 0) return null;
    if (validMoves.length === 1) return validMoves[0];
    if (Math.random() < 0.2) return validMoves[Math.floor(Math.random() * validMoves.length)];
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

    // Synchronization Refs for Async Callbacks
    const tokensRef = useRef(tokens);
    tokensRef.current = tokens;
    const currentPlayerRef = useRef(currentPlayer);
    currentPlayerRef.current = currentPlayer;
    const activePlayersRef = useRef(activePlayers);
    activePlayersRef.current = activePlayers;
    const playerTypesRef = useRef(playerTypes);
    playerTypesRef.current = playerTypes;
    const consecutiveSixesRef = useRef(consecutiveSixes);
    consecutiveSixesRef.current = consecutiveSixes;
    const isMutedRef = useRef(isMuted);
    isMutedRef.current = isMuted;

    useEffect(() => () => {
        clearInterval(movementTimerRef.current);
        clearTimeout(aiTimerRef.current);
    }, []);

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
        setTurnMessage(`${types[players[0]] === 'DigiHub' ? 'DigiHub' : players[0]}'s turn!`);
    };

    const advanceTurn = useCallback((extraTurn = false) => {
        setHasRolled(false);
        setMovableTokenIds([]);
        setDiceValue(1);
        if (!extraTurn) {
            setCurrentPlayerIndex(prev => {
                const next = (prev + 1) % activePlayersRef.current.length;
                const nextColor = activePlayersRef.current[next];
                const isAi = playerTypesRef.current[nextColor] === 'DigiHub';
                setTurnMessage(`${isAi ? 'DigiHub' : nextColor}'s turn!`);
                return next;
            });
        } else {
            const curColor = currentPlayerRef.current;
            const isAi = playerTypesRef.current[curColor] === 'DigiHub';
            setTurnMessage(`${isAi ? 'DigiHub' : curColor}'s extra turn!`);
        }
    }, []);

    const handleFinish = (color) => {
        setRankings(prev => {
            const newRankings = [...prev, color];
            const remainingActive = activePlayersRef.current.filter(p => !newRankings.includes(p) &&
                (tokensRef.current[p] || []).some(t => t.stepCount < 57));
            if (!winner) { setWinner(color); playLudoSound('win', isMutedRef.current); }
            if (remainingActive.length === 0) setGamePhase('finished');
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
        const curIsAi = playerTypesRef.current[curPlayer] === 'DigiHub';

        if (validMoves.length === 0) {
            setTurnMessage('No valid moves!');
            setTimeout(() => advanceTurn(isSix), 1200);
        } else if (curIsAi) {
            const bestMove = getAiMove(curPlayer, tokensRef.current, finalValue);
            if (bestMove) {
                setTimeout(() => handleTokenClick(bestMove, true, finalValue), 800);
            } else {
                advanceTurn(isSix);
            }
        } else {
            setMovableTokenIds(validMoves.map(t => t.id));
        }
    }, [advanceTurn, handleTokenClick]);

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

    // AI Turn Auto-Trigger Effect
    useEffect(() => {
        if (gamePhase !== 'playing' || !isAiTurn || isRolling || hasRolled || isAnimatingMove || winner) return;
        setIsThinking(true);
        aiTimerRef.current = setTimeout(() => {
            setIsThinking(false);
            handleRollDice();
        }, 1000 + Math.random() * 500);
    }, [currentPlayerIndex, gamePhase, isAiTurn, hasRolled, isRolling, isAnimatingMove, winner, handleRollDice]);

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
                <>
                    <div className="max-w-7xl mx-auto px-4 py-6 pb-28">
                        <div className="flex flex-col xl:flex-row gap-6 items-start justify-center">
                            {/* Left HUD */}
                            <div className="w-full xl:w-56 order-2 xl:order-1">
                                <LudoHUD activePlayers={activePlayers} playerNames={playerNames} tokens={tokens} currentPlayer={currentPlayer} winner={winner} playerTypes={playerTypes} />
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
                        canRoll={!isRolling && !hasRolled && !isAiTurn && !winner && !isAnimatingMove}
                        hasRolled={hasRolled}
                        hasValidMoves={movableTokenIds.length > 0}
                        currentPlayer={currentPlayer}
                        playerName={playerNames[currentPlayer] || currentPlayer}
                        turnMessage={turnMessage}
                        isThinking={isThinking}
                        winner={winner}
                    />
                </>
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
