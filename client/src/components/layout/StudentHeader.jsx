import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, User, Award, MessageSquare, 
    ChevronRight, Sparkles, ArrowLeft, ChevronDown, 
    GraduationCap, Calendar, Trophy, Settings, Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const StudentHeader = ({ 
    title: customTitle, 
    subtitle, 
    badge,
    icon: CustomIcon,
    actions,
    backPath = '/dashboard',
    showHero = true
}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    const studentModules = [
        {
            category: 'Personal Hub',
            items: [
                { title: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard, badge: 'Home' },
                { title: 'My Profile', path: user?.role === 'Association Member' ? '/association-profile' : '/profile', icon: User },
            ]
        },
        {
            category: 'Activities & Growth',
            items: [
                { title: 'Explore Events', path: '/events', icon: Calendar },
                { title: 'Games & Arcade', path: '/games', icon: Gamepad2, badge: 'Play' },
                { title: 'Submit Nomination', path: '/nominate', icon: Award, badge: 'Lead' },
                { title: 'Wall of Winners', path: '/winners', icon: Trophy },
            ]
        },
        {
            category: 'Help & Services',
            items: [
                { title: 'Help & Support', path: '/support', icon: MessageSquare },
                // Only show work requests for certain roles
                ...(['Faculty', 'Class Coordinator', 'Program Coordinator', 'Association Member', 'Association Coordinator'].includes(user?.role) 
                    ? [{ title: 'Work Requests', path: '/work-requests', icon: Settings }] 
                    : [])
            ]
        }
    ];

    const getModuleByPath = (pathname) => {
        for (const group of studentModules) {
            for (const item of group.items) {
                if (pathname === item.path || (item.path !== '/dashboard' && item.path !== '/' && pathname.startsWith(item.path))) {
                    return item;
                }
            }
        }
        return { title: 'Student Portal', path: '/dashboard', icon: GraduationCap };
    };

    const currentModule = getModuleByPath(location.pathname);
    const displayTitle = customTitle || currentModule.title;
    const IconComponent = CustomIcon || currentModule.icon || GraduationCap;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="w-full mb-8 space-y-4">
            {/* Top Navigation & Quick Switcher Toolbar */}
            <div className="relative z-50 bg-white/80 dark:bg-[#151921]/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl px-5 py-3.5 shadow-sm flex flex-wrap justify-between items-center gap-4 transition-all">
                
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-500 dark:text-slate-400">
                    <Link 
                        to="/dashboard" 
                        className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-extrabold transition-colors group"
                    >
                        <div className="p-1 bg-primary-50 dark:bg-primary-500/10 rounded-lg group-hover:scale-105 transition-transform">
                            <GraduationCap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <span>Student Hub</span>
                    </Link>
                    
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    
                    <span className="text-slate-800 dark:text-slate-200 font-black px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                        {displayTitle}
                    </span>
                </div>

                {/* Right Controls: Quick Switcher & Navigation Back Button */}
                <div className="flex items-center gap-2.5">
                    {location.pathname !== '/dashboard' && (
                        <button
                            onClick={() => navigate(backPath)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 rounded-xl transition-all shadow-xs active:scale-95"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back</span>
                        </button>
                    )}

                    {/* Switcher Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-primary-500/20 active:scale-95 border border-primary-400/20"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-primary-200 animate-pulse" />
                            <span>Quick Switch</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1a1e26] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 z-50 overflow-hidden p-4 space-y-4 backdrop-blur-xl"
                                >
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Student Navigation</span>
                                        </div>
                                        <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 rounded-md border border-primary-200/50 dark:border-primary-500/20">
                                            Jump To
                                        </span>
                                    </div>

                                    <div className="max-h-96 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                        {studentModules.map((group, idx) => (
                                            <div key={idx} className="space-y-1.5">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2">
                                                    {group.category}
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                    {group.items.map((item) => {
                                                        const Icon = item.icon;
                                                        const isActive = location.pathname === item.path || (item.path !== '/dashboard' && item.path !== '/' && location.pathname.startsWith(item.path));
                                                        return (
                                                            <Link
                                                                key={item.path}
                                                                to={item.path}
                                                                onClick={() => setIsMenuOpen(false)}
                                                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                                    isActive
                                                                        ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white font-extrabold shadow-sm shadow-primary-500/20'
                                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-primary-600 dark:hover:text-primary-400'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                                                                    <span className="truncate">{item.title}</span>
                                                                </div>
                                                                {item.badge && (
                                                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                                                                        isActive 
                                                                            ? 'bg-white/20 text-white' 
                                                                            : 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                                                                    }`}>
                                                                        {item.badge}
                                                                    </span>
                                                                )}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Optional Premium Hero Header Banner */}
            {showHero && (subtitle || customTitle) && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white p-6 sm:p-7 shadow-xl border border-primary-500/20">
                    {/* Atmospheric Ambient Glow Effects */}
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3.5 bg-gradient-to-tr from-primary-600 to-blue-600 rounded-2xl shadow-lg shadow-primary-500/30 border border-primary-400/30 text-white flex-shrink-0">
                                <IconComponent className="w-7 h-7" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                        {displayTitle}
                                    </h1>
                                    {badge && (
                                        <span className="px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-primary-500/20 border border-primary-400/30 text-primary-200">
                                            {badge}
                                        </span>
                                    )}
                                </div>
                                {subtitle && (
                                    <p className="text-sm font-medium text-slate-300 max-w-2xl leading-relaxed">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Optional Right Action Slot */}
                        {actions && (
                            <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentHeader;
