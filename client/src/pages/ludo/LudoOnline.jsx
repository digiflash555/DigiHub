import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Volume2, VolumeX, Copy, Check, Users,
    Wifi, Loader2, Play, Crown, Circle, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import LudoBoard from '../../components/games/ludo/LudoBoard';
import LudoDice from '../../components/games/ludo/LudoDice';
import LudoHUD from '../../components/games/ludo/LudoHUD';
import LudoWinnerModal from '../../components/games/ludo/LudoWinnerModal';
import LudoQuickRollBar from '../../components/games/ludo/LudoQuickRollBar';
import { PLAYER_COLORS, playLudoSound, getStepPath, findCapturedTokens } from '../../utils/ludoEngine';
import {
    getLudoSocket, createLudoRoom, joinLudoRoom, startLudoGame,
    rollLudoDice, moveLudoToken, leaveLudoRoom, onLudoEvent, offLudoEvent
} from '../../services/ludoSocket';

const PLAYER_ORDER = ['Red', 'Green', 'Yellow', 'Blue'];

// ─── Lobby Screen ─────────────────────────────────────────────────────────────
const LudoLobby = ({ user, onBack }) => {
    const [view, setView] = useState('main'); // main | create | join
    const [playerCount, setPlayerCount] = useState(4);
    const [joinCode, setJoinCode] = useState('');
    const [roomData, setRoomData] = useState(null); // { roomCode, yourColor, players, activePlayers, isHost }
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [gameData, setGameData] = useState(null); // when game starts

    useEffect(() => {
        const sock = getLudoSocket();

        const onCreated = (data) => {
            setLoading(false);
            setRoomData({ ...data, isHost: true, yourColor: data.hostColor });
            setView('lobby');
        };
        const onJoined = (data) => {
            setLoading(false);
            setRoomData({ roomCode: data.roomCode, yourColor: data.yourColor, ...data.room, isHost: false });
            setView('lobby');
        };
        const onRejoined = (data) => {
            setLoading(false);
            setRoomData({ roomCode: data.roomCode, yourColor: data.yourColor, ...data.room, isHost: false });
            setView('lobby');
        };
        const onLobbyUpdated = (data) => {
            setRoomData(prev => prev ? { ...prev, players: data.players, activePlayers: data.activePlayers } : prev);
        };
        const onGameStarted = (data) => {
            setGameData(data);
        };
        const onError = (data) => {
            setLoading(false);
            toast.error(data.message, { style: { borderRadius: '12px', background: '#1e232d', color: '#fff', border: '1px solid #ef4444' } });
        };

        onLudoEvent('ludo_room_created', onCreated);
        onLudoEvent('ludo_joined', onJoined);
        onLudoEvent('ludo_rejoined', onRejoined);
        onLudoEvent('ludo_lobby_updated', onLobbyUpdated);
        onLudoEvent('ludo_game_started', onGameStarted);
        onLudoEvent('ludo_error', onError);

        return () => {
            offLudoEvent('ludo_room_created', onCreated);
            offLudoEvent('ludo_joined', onJoined);
            offLudoEvent('ludo_rejoined', onRejoined);
            offLudoEvent('ludo_lobby_updated', onLobbyUpdated);
            offLudoEvent('ludo_game_started', onGameStarted);
            offLudoEvent('ludo_error', onError);
        };
    }, []);

    if (gameData && roomData) {
        return <LudoOnlineGame gameData={gameData} roomData={roomData} user={user} onBack={onBack} />;
    }

    const handleCreate = () => {
        setLoading(true);
        createLudoRoom(user, playerCount);
    };

    const handleJoin = () => {
        if (!joinCode.trim()) return toast.error('Enter a room code');
        setLoading(true);
        joinLudoRoom(joinCode.trim().toUpperCase(), user);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(roomData?.roomCode || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Room code copied!', { icon: '📋' });
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Join my Ludo game!',
            text: `Join my Ludo game using room code: ${roomData?.roomCode}`,
        };
        if (navigator.share) { try { await navigator.share(shareData); } catch (_) {} }
        else handleCopy();
    };

    return (
        <div className="max-w-md mx-auto px-4 py-8 space-y-6">
            {view === 'main' && (
                <>
                    <div className="text-center space-y-1">
                        <div className="text-5xl mb-2">🌐</div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Play Online</h1>
                        <p className="text-slate-500 font-medium">Invite friends and battle anywhere</p>
                    </div>
                    <div className="space-y-3">
                        <button onClick={() => setView('create')} className="w-full p-5 rounded-3xl bg-white dark:bg-[#1a1e26] border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500/60 dark:hover:border-indigo-400/60 text-left flex items-center gap-4 group transition-all shadow-sm hover:shadow-lg">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                <Crown className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-black text-slate-900 dark:text-white">Create Room</div>
                                <div className="text-sm text-slate-500">Host a new game and invite friends</div>
                            </div>
                        </button>
                        <button onClick={() => setView('join')} className="w-full p-5 rounded-3xl bg-white dark:bg-[#1a1e26] border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 dark:hover:border-emerald-400/60 text-left flex items-center gap-4 group transition-all shadow-sm hover:shadow-lg">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-black text-slate-900 dark:text-white">Join Room</div>
                                <div className="text-sm text-slate-500">Enter a room code to join a friend's game</div>
                            </div>
                        </button>
                    </div>
                </>
            )}

            {view === 'create' && (
                <div className="space-y-5">
                    <button onClick={() => setView('main')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm font-bold transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create Room</h2>
                    <div className="bg-white dark:bg-[#1a1e26] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xl">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block">Max Players</label>
                            <div className="flex gap-2">
                                {[2, 3, 4].map(n => (
                                    <button key={n} onClick={() => setPlayerCount(n)}
                                        className={`flex-1 py-3 rounded-2xl font-black text-lg transition-all ${playerCount === n ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                        {n}P
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleCreate} disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg shadow-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</> : '🎲 Create Room'}
                        </button>
                    </div>
                </div>
            )}

            {view === 'join' && (
                <div className="space-y-5">
                    <button onClick={() => setView('main')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white text-sm font-bold transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Join Room</h2>
                    <div className="bg-white dark:bg-[#1a1e26] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xl">
                        <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block">Room Code</label>
                            <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="LUDO-XXXX" maxLength={9}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xl text-center tracking-widest focus:outline-none focus:border-emerald-500 transition-colors" />
                        </div>
                        <button onClick={handleJoin} disabled={loading || !joinCode.trim()}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-lg shadow-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Joining...</> : '🚀 Join Game'}
                        </button>
                    </div>
                </div>
            )}

            {view === 'lobby' && roomData && (
                <div className="space-y-5">
                    <div className="text-center space-y-1">
                        <div className="text-4xl mb-1">🎲</div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Ludo Online</h1>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-black">
                            Room: <span className="tracking-widest">{roomData.roomCode}</span>
                        </div>
                    </div>

                    {/* Players list */}
                    <div className="bg-white dark:bg-[#1a1e26] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Players</span>
                            <span className="text-xs font-bold text-slate-400">{Object.keys(roomData.players || {}).length}/{roomData.playerCount || roomData.activePlayers?.length}</span>
                        </div>
                        {(roomData.activePlayers || PLAYER_ORDER.slice(0, 4)).map(color => {
                            const cfg = PLAYER_COLORS[color];
                            const p = roomData.players?.[color];
                            const isYou = color === roomData.yourColor;
                            return (
                                <div key={color} className={`flex items-center gap-3 p-3 rounded-2xl border ${p ? cfg.light + ' ' + cfg.border : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-50'}`}>
                                    <div className={`w-8 h-8 rounded-xl ${p ? cfg.bg : 'bg-slate-300 dark:bg-slate-700'} flex items-center justify-center text-white font-black text-xs shadow-sm`}>
                                        {p ? p.username.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div className="flex-1">
                                        <span className={`font-black text-sm ${p ? cfg.text : 'text-slate-400'}`}>
                                            {p ? p.username : 'Waiting...'}
                                        </span>
                                        {p && roomData.isHost && color === roomData.yourColor && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-500">HOST</span>}
                                        {isYou && <span className="ml-2 text-[10px] font-bold text-slate-400">YOU</span>}
                                    </div>
                                    {p ? <div className="w-2 h-2 rounded-full bg-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />}
                                </div>
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        {roomData.isHost && (
                            <button onClick={() => startLudoGame(roomData.roomCode)}
                                disabled={Object.keys(roomData.players || {}).length < 2}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-lg shadow-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                <Play className="w-5 h-5" /> Start Game
                            </button>
                        )}
                        {!roomData.isHost && (
                            <div className="flex items-center gap-2 text-center text-slate-500 text-sm font-medium py-3">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                Waiting for host to start the game...
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button onClick={handleCopy} className="flex-1 py-3 rounded-2xl bg-white dark:bg-[#1a1e26] border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                            {navigator.share && (
                                <button onClick={handleShare} className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 text-sm hover:bg-indigo-500 transition-all">
                                    Share Invite
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Online Game Screen ───────────────────────────────────────────────────────
const LudoOnlineGame = ({ gameData, roomData, user, onBack }) => {
    const [tokens, setTokens] = useState(gameData.tokens);
    const [activePlayers] = useState(gameData.activePlayers);
    const [currentPlayer, setCurrentPlayer] = useState(gameData.currentPlayer);
    const [diceValue, setDiceValue] = useState(1);
    const [isRolling, setIsRolling] = useState(false);
    const [hasRolled, setHasRolled] = useState(false);
    const [validTokenIds, setValidTokenIds] = useState([]);
    const [winner, setWinner] = useState(null);
    const [rankings, setRankings] = useState([]);
    const [turnMessage, setTurnMessage] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isAnimatingMove, setIsAnimatingMove] = useState(false);
    const [disconnectedPlayer, setDisconnectedPlayer] = useState(null);

    const movementTimerRef = useRef(null);
    useEffect(() => () => clearInterval(movementTimerRef.current), []);
    const isMyTurn = currentPlayer === roomData.yourColor;

    // Build player names from room
    const playerNames = {};
    activePlayers.forEach(c => { playerNames[c] = gameData.players?.[c]?.username || c; });

    useEffect(() => {
        const onDiceRolled = ({ value, currentPlayer: cp, validTokenIds: vids, message }) => {
            setIsRolling(false);
            setDiceValue(value);
            setHasRolled(true);
            setValidTokenIds(vids || []);
            setTurnMessage(message || '');
            playLudoSound('roll', isMuted);
        };
        const onMoveMade = ({ tokens: newTokens, captured }) => {
            let movedPlayer = null;
            let movedTokenId = null;
            let oldStep = 0;
            let newStep = 0;

            setTokens(prev => {
                Object.keys(newTokens).forEach(p => {
                    (newTokens[p] || []).forEach(t => {
                        const oldT = (prev[p] || []).find(ot => ot.id === t.id);
                        if (oldT && oldT.stepCount !== t.stepCount) {
                            movedPlayer = p;
                            movedTokenId = t.id;
                            oldStep = oldT.stepCount;
                            newStep = t.stepCount;
                        }
                    });
                });
                return prev;
            });

            if (movedPlayer !== null && movedTokenId !== null && newStep > oldStep) {
                setIsAnimatingMove(true);
                const pathSteps = [];
                if (oldStep === 0) {
                    pathSteps.push(1);
                } else {
                    for (let s = oldStep + 1; s <= newStep; s++) {
                        pathSteps.push(s);
                    }
                }

                let idx = 0;
                movementTimerRef.current = setInterval(() => {
                    if (idx < pathSteps.length) {
                        const step = pathSteps[idx];
                        playLudoSound('step', isMuted);
                        setTokens(prev => {
                            const copy = { ...prev };
                            if (copy[movedPlayer]) {
                                copy[movedPlayer] = copy[movedPlayer].map(t =>
                                    t.id === movedTokenId ? { ...t, stepCount: step } : t
                                );
                            }
                            return copy;
                        });
                        idx++;
                    } else {
                        clearInterval(movementTimerRef.current);
                        if (captured?.length > 0) playLudoSound('capture', isMuted);
                        setTokens(newTokens);
                        setIsAnimatingMove(false);
                    }
                }, 120);
            } else {
                if (captured?.length > 0) playLudoSound('capture', isMuted);
                setTokens(newTokens);
                setIsAnimatingMove(false);
            }
        };
        const onTurnChanged = ({ currentPlayer: cp }) => {
            setCurrentPlayer(cp);
            setHasRolled(false);
            setDiceValue(1);
            setValidTokenIds([]);
            setTurnMessage(`${playerNames[cp] || cp}'s turn!`);
        };
        const onGameOver = ({ winner: w, rankings: r }) => {
            setWinner(w);
            setRankings(r);
            playLudoSound('win', isMuted);
        };
        const onDisconnect = ({ color, username }) => {
            setDisconnectedPlayer(username || color);
            toast.error(`${username || color} disconnected`, { icon: '⚠️' });
        };

        onLudoEvent('ludo_dice_rolled', onDiceRolled);
        onLudoEvent('ludo_move_made', onMoveMade);
        onLudoEvent('ludo_turn_changed', onTurnChanged);
        onLudoEvent('ludo_game_over', onGameOver);
        onLudoEvent('ludo_player_disconnected', onDisconnect);

        return () => {
            offLudoEvent('ludo_dice_rolled', onDiceRolled);
            offLudoEvent('ludo_move_made', onMoveMade);
            offLudoEvent('ludo_turn_changed', onTurnChanged);
            offLudoEvent('ludo_game_over', onGameOver);
            offLudoEvent('ludo_player_disconnected', onDisconnect);
        };
    }, [isMuted, playerNames]);

    const handleRollDice = () => {
        if (!isMyTurn || hasRolled || isAnimatingMove || winner) return;
        setIsRolling(true);
        rollLudoDice(roomData.roomCode);
    };

    const handleTokenClick = (token) => {
        if (!isMyTurn || !hasRolled || isAnimatingMove || winner) return;
        if (!validTokenIds.includes(token.id)) return;
        setIsAnimatingMove(true);
        setValidTokenIds([]);
        moveLudoToken(roomData.roomCode, token.id);
    };

    const playerTypes = {};
    activePlayers.forEach(c => { playerTypes[c] = c === roomData.yourColor ? 'Human' : 'Online'; });

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 pb-28">
            {/* My turn banner */}
            <AnimatePresence>
                {isMyTurn && !hasRolled && !winner && (
                    <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}
                        className="mb-4 flex items-center justify-center gap-2 py-2 px-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                        ✨ Your turn! Roll the dice.
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col xl:flex-row gap-6 items-start justify-center">
                <div className="w-full xl:w-56 order-2 xl:order-1">
                    <LudoHUD activePlayers={activePlayers} playerNames={playerNames} tokens={tokens} currentPlayer={currentPlayer} winner={winner} playerTypes={playerTypes} />
                </div>
                <div className="flex-1 flex flex-col items-center gap-5 order-1 xl:order-2">
                    <LudoBoard tokens={tokens} activePlayers={activePlayers} currentPlayer={currentPlayer}
                        movableTokenIds={isMyTurn ? validTokenIds : []} onTokenClick={handleTokenClick} />

                    {/* Room info */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                        Room: <span className="tracking-widest text-slate-600 dark:text-slate-300">{roomData.roomCode}</span>
                        {disconnectedPlayer && (
                            <span className="flex items-center gap-1 text-amber-500">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {disconnectedPlayer} disconnected
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Easy Access Floating Dice Quick-Roll Bar */}
            <LudoQuickRollBar
                value={diceValue}
                onRoll={handleRollDice}
                isRolling={isRolling}
                canRoll={isMyTurn && !hasRolled && !winner && !isAnimatingMove}
                hasRolled={hasRolled}
                hasValidMoves={validTokenIds.length > 0}
                currentPlayer={currentPlayer}
                playerName={playerNames[currentPlayer] || currentPlayer}
                turnMessage={turnMessage}
                winner={winner}
            />

            {winner && (
                <LudoWinnerModal winner={winner} rankings={rankings} playerNames={playerNames}
                    onPlayAgain={() => window.location.reload()}
                    onMenu={onBack} />
            )}
        </div>
    );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
const LudoOnline = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(false);

    const handleBack = () => navigate('/games/ludo');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-[#1a1e26]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <button onClick={handleBack} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-black text-slate-700 dark:text-white">Play Online</span>
                </div>
                <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            </div>
            <LudoLobby user={user} onBack={handleBack} />
        </div>
    );
};

export default LudoOnline;
