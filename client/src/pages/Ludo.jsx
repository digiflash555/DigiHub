import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Users, Wifi, ChevronRight, Gamepad2 } from 'lucide-react';
import StudentHeader from '../components/layout/StudentHeader';

const MODES = [
    {
        id: 'ai',
        emoji: '🤖',
        title: 'You vs DigiHub',
        subtitle: 'Challenge the DigiHub AI',
        description: 'Face our intelligent AI opponent. It thinks, bluffs, and plays smart — but it\'s beatable!',
        gradient: 'from-indigo-600 to-purple-700',
        glowColor: 'indigo',
        tag: 'Single Player',
        route: '/games/ludo/ai',
        icon: Bot,
        features: ['Smart AI with natural delays', '"DigiHub is thinking..." animations', '1-3 opponents', 'Fully functional rules'],
    },
    {
        id: 'local',
        emoji: '👥',
        title: 'Play With Friends',
        subtitle: 'Pass & play on one device',
        description: 'Gather 2-4 players around one screen. Enter names, take turns, and see who rules the board!',
        gradient: 'from-emerald-500 to-teal-600',
        glowColor: 'emerald',
        tag: '2-4 Players',
        route: '/games/ludo/local',
        icon: Users,
        features: ['Custom player names', '"Pass device to [Name]" screen', '2-4 players', 'Full rule enforcement'],
    },
    {
        id: 'online',
        emoji: '🌐',
        title: 'Play Online',
        subtitle: 'Invite friends and battle anywhere',
        description: 'Create a room, share the code, and play with friends in real-time from any device.',
        gradient: 'from-blue-500 to-cyan-600',
        glowColor: 'blue',
        tag: 'Real-Time',
        route: '/games/ludo/online',
        icon: Wifi,
        features: ['Unique room codes (LUDO-XXXX)', 'Real-time sync via Socket.IO', 'Server-authoritative moves', 'Disconnect handling'],
    },
];

const Ludo = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-8">
            <StudentHeader
                title="🎲 Ludo King"
                subtitle="Roll • Race • Conquer — Choose your battle mode"
                icon={Gamepad2}
                showHero={false}
            />

            {/* Hero Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-[2.5rem] overflow-hidden p-8 md:p-10 text-white shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #312e81 70%, #4338ca 100%)' }}
            >
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 text-center space-y-3">
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        className="text-7xl mb-2 inline-block"
                    >
                        🎲
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                        LUDO KING
                    </h1>
                    <p className="text-slate-300 font-bold text-lg tracking-widest uppercase">
                        Roll · Race · Conquer
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-black uppercase tracking-wider">3 Game Modes</span>
                        <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-black uppercase tracking-wider">Real-Time Multiplayer</span>
                        <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-black uppercase tracking-wider">Smart AI</span>
                    </div>
                </div>
            </motion.div>

            {/* Mode Cards */}
            <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Choose Your Mode</h2>
                <div className="grid md:grid-cols-3 gap-5">
                    {MODES.map((mode, idx) => {
                        const Icon = mode.icon;
                        return (
                            <motion.div
                                key={mode.id}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate(mode.route)}
                                className="group relative bg-white dark:bg-[#1a1e26] rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl cursor-pointer overflow-hidden transition-shadow"
                            >
                                {/* Background glow on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-[2rem] pointer-events-none`} />

                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${mode.gradient} flex items-center justify-center text-white shadow-lg shadow-${mode.glowColor}-500/30 mb-5`}>
                                    <Icon className="w-7 h-7" />
                                </div>

                                {/* Tag */}
                                <span className={`inline-block px-2.5 py-1 rounded-full bg-gradient-to-r ${mode.gradient} text-white text-[10px] font-black uppercase tracking-wider mb-3 shadow-sm`}>
                                    {mode.tag}
                                </span>

                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                                    {mode.emoji} {mode.title}
                                </h3>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">{mode.subtitle}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                                    {mode.description}
                                </p>

                                {/* Features */}
                                <ul className="space-y-1.5 mb-5">
                                    {mode.features.map(f => (
                                        <li key={f} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${mode.gradient} flex-shrink-0`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {/* Arrow CTA */}
                                <div className={`flex items-center gap-2 font-black text-sm bg-gradient-to-r ${mode.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                                    Play Now <ChevronRight className={`w-4 h-4 text-${mode.glowColor}-500 group-hover:translate-x-1 transition-transform`} />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Back to Games */}
            <div className="flex justify-center">
                <button
                    onClick={() => navigate('/games')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-[#1a1e26] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Arcade
                </button>
            </div>
        </div>
    );
};

export default Ludo;
