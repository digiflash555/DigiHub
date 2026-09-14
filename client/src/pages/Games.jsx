import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
    Gamepad2, Bot, Users, Trophy, History, Sparkles,
    ArrowRight, Target, Award, Zap, Shield, Wifi, Lock,
    ChevronDown, BarChart3, TrendingUp, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StudentHeader from '../components/layout/StudentHeader';

// ─── Game catalog ───────────────────────────────────────────────────────────
const GAMES = [
    {
        id: 'tictactoe',
        name: 'Tic-Tac-Toe',
        emoji: '✖️',
        tagline: 'Classic 3×3 strategy',
        description: 'The timeless 3-in-a-row battle. Quick to play, hard to master.',
        gradient: 'from-indigo-600 to-purple-600',
        glowColor: 'indigo',
        badge: 'Classic',
        statsEndpoint: null,
        modes: [
            {
                id: 'ai',
                label: 'You vs DigiHub',
                icon: Bot,
                color: 'from-indigo-500 to-purple-600',
                glowColor: 'indigo',
                description: 'Test your wits against our Minimax AI engine.',
                tag: 'Single Player',
                route: '/games/tictactoe/ai',
                available: true,
            },
            {
                id: 'local',
                label: 'Offline Mode',
                icon: Users,
                color: 'from-blue-500 to-cyan-500',
                glowColor: 'blue',
                description: 'Pass & play with a friend on the same device.',
                tag: '2 Players',
                route: '/games/tictactoe/offline',
                available: true,
            },
            {
                id: 'online',
                label: 'Online Mode',
                icon: Wifi,
                color: 'from-emerald-500 to-teal-500',
                glowColor: 'emerald',
                description: 'Create a room code and challenge anyone online.',
                tag: 'Real-Time',
                route: '/games/tictactoe/online',
                available: true,
            },
        ],
        quickLinks: [],
    },
    {
        id: 'ludo',
        name: 'Ludo King',
        emoji: '🎲',
        tagline: '2-4 player strategy',
        description: 'The legendary board game with 3D graphics, animated tokens & smart AI.',
        gradient: 'from-emerald-600 to-teal-600',
        glowColor: 'emerald',
        badge: 'New',
        statsEndpoint: null, // Ludo stats endpoint (can be wired later)
        modes: [
            {
                id: 'ai',
                label: 'You vs DigiHub',
                icon: Bot,
                color: 'from-emerald-500 to-teal-600',
                glowColor: 'emerald',
                description: 'Face off against our heuristic DigiHub engine.',
                tag: 'vs AI',
                route: '/games/ludo/ai',
                available: true,
            },
            {
                id: 'local',
                label: 'Local Team',
                icon: Users,
                color: 'from-amber-500 to-orange-500',
                glowColor: 'amber',
                description: 'Up to 4 players sharing the same screen.',
                tag: '2-4 Players',
                route: '/games/ludo/local',
                available: true,
            },
            {
                id: 'online',
                label: 'Online Team',
                icon: Wifi,
                color: 'from-blue-500 to-indigo-600',
                glowColor: 'blue',
                description: 'Create a room and battle friends in real-time!',
                tag: 'Real-Time',
                route: '/games/ludo/online',
                available: true,
            },
        ],
        quickLinks: [],
    },
];

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatPill = ({ icon: Icon, label, value, color }) => (
    <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${color} text-center min-w-[90px]`}>
        <Icon className="w-4 h-4 mb-1 opacity-70" />
        <span className="text-2xl font-black leading-none">{value}</span>
        <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">{label}</span>
    </div>
);

// ─── Mode Card ───────────────────────────────────────────────────────────────
const ModeCard = ({ mode, onClick }) => {
    const Icon = mode.icon;
    return (
        <motion.button
            whileHover={mode.available ? { y: -4, scale: 1.02 } : {}}
            whileTap={mode.available ? { scale: 0.97 } : {}}
            onClick={() => mode.available && onClick(mode)}
            className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all overflow-hidden group ${
                mode.available
                    ? 'bg-white dark:bg-[#1e232d] border-slate-200 dark:border-slate-700 hover:border-transparent cursor-pointer shadow-sm hover:shadow-xl'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
            }`}
        >
            {/* Glow overlay on hover */}
            {mode.available && (
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl pointer-events-none`} />
            )}

            <div className="relative z-10 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${mode.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 dark:text-white text-base">{mode.label}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            mode.available
                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}>{mode.tag}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">{mode.description}</p>
                </div>
                {mode.available
                    ? <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                    : <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                }
            </div>
        </motion.button>
    );
};

// ─── Game Card ───────────────────────────────────────────────────────────────
const GameCard = ({ game, isSelected, onSelect, stats, loadingStats }) => {
    const navigate = useNavigate();

    const handleModeClick = (mode) => {
        navigate(mode.route);
    };

    return (
        <div className={`rounded-[2rem] border-2 transition-all duration-300 overflow-hidden shadow-lg ${
            isSelected
                ? 'border-primary-500/60 shadow-primary-500/10 shadow-2xl'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        } bg-white dark:bg-[#1a1e26]`}>

            {/* Game Card Header — always visible */}
            <button
                onClick={() => onSelect(game.id)}
                className="w-full text-left p-6 flex items-center gap-5 group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
            >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${game.gradient} flex items-center justify-center text-4xl shadow-lg flex-shrink-0`}>
                    {game.emoji}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{game.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            game.badge === 'New'
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>{game.badge}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">{game.tagline}</p>
                </div>

                <motion.div
                    animate={{ rotate: isSelected ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex-shrink-0"
                >
                    <ChevronDown className="w-5 h-5" />
                </motion.div>
            </button>

            {/* Expanded Panel */}
            <AnimatePresence initial={false}>
                {isSelected && (
                    <motion.div
                        key="panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 space-y-6 border-t border-slate-100 dark:border-slate-800 pt-5">

                            {/* Description */}
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                {game.description}
                            </p>

                            {/* Analytics */}
                            {game.statsEndpoint && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <BarChart3 className="w-4 h-4 text-primary-500" />
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Your Stats</span>
                                    </div>
                                    {loadingStats ? (
                                        <div className="flex gap-3">
                                            {[1,2,3,4,5].map(i => (
                                                <div key={i} className="h-20 w-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-3">
                                            <StatPill icon={Gamepad2} label="Played" value={stats.gamesPlayed ?? 0} color="bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300" />
                                            <StatPill icon={Award} label="Wins" value={stats.wins ?? 0} color="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" />
                                            <StatPill icon={Target} label="Losses" value={stats.losses ?? 0} color="bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400" />
                                            <StatPill icon={Shield} label="Draws" value={stats.draws ?? 0} color="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400" />
                                            <StatPill icon={Zap} label="Win Rate" value={`${stats.winRate ?? 0}%`} color="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mode Buttons */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-4 h-4 text-primary-500" />
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Choose Mode</span>
                                </div>
                                <div className="grid sm:grid-cols-3 gap-3">
                                    {game.modes.map(mode => (
                                        <ModeCard key={mode.id} mode={mode} onClick={handleModeClick} />
                                    ))}
                                </div>
                            </div>

                            {/* Quick Links */}
                            {game.quickLinks.length > 0 && (
                                <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    {game.quickLinks.map(link => {
                                        const LinkIcon = link.icon;
                                        return (
                                            <button
                                                key={link.route}
                                                onClick={() => navigate(link.route)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
                                            >
                                                <LinkIcon className="w-3.5 h-3.5" />
                                                {link.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Games = () => {
    const { user } = useAuth();
    const [selectedGame, setSelectedGame] = useState('tictactoe');
    const [tttStats, setTttStats] = useState({ gamesPlayed: 0, wins: 0, losses: 0, draws: 0, winRate: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/games/tictactoe/stats');
                setTttStats(res.data);
            } catch (err) {
                console.error('Failed to fetch game stats:', err);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    const getStats = (gameId) => {
        if (gameId === 'tictactoe') return tttStats;
        return {};
    };

    const handleSelect = (gameId) => {
        setSelectedGame(prev => prev === gameId ? null : gameId);
    };

    return (
        <div className="max-w-4xl mx-auto pb-24 space-y-8">
            <StudentHeader
                title="Arcade & Gaming Hub"
                subtitle="Pick a game, choose your mode, and play. Challenge DigiHub or battle friends!"
                icon={Gamepad2}
                showHero={false}
            />

            {/* Hero Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-[2.5rem] overflow-hidden p-8 text-white shadow-2xl border border-primary-500/20"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 80%, #4338ca 100%)' }}
            >
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center sm:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 text-primary-200 text-xs font-black uppercase tracking-widest">
                            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                            <span>CSE Department Gaming Arcade</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">🎮 DigiHub Arcade</h1>
                        <p className="text-slate-300 text-sm font-medium max-w-md">
                            {GAMES.length} games available · Challenge AI or friends in real-time
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-white text-sm font-bold">
                            <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                            <span>Win Rate: <strong>{tttStats.winRate ?? 0}%</strong></span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/20 text-emerald-200 text-sm font-bold">
                            <Trophy className="w-4 h-4 text-emerald-300" />
                            <span>Wins: <strong>{tttStats.wins ?? 0}</strong></span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Game Cards */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Gamepad2 className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Select a Game</h2>
                    <span className="text-xs font-bold text-slate-400">({GAMES.length} available)</span>
                </div>

                {GAMES.map((game, i) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                    >
                        <GameCard
                            game={game}
                            isSelected={selectedGame === game.id}
                            onSelect={handleSelect}
                            stats={getStats(game.id)}
                            loadingStats={loadingStats}
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Games;
