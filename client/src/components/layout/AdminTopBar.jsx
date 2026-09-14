import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Calendar, Users, Award, DollarSign, 
    MessageSquare, Settings, FileText, ChevronRight, ShieldCheck, 
    Sparkles, ArrowLeft, ChevronDown, CheckCircle, Mail, Layers,
    HelpCircle, QrCode, Sliders, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const adminModules = [
    {
        category: 'Core Management',
        items: [
            { title: 'Control Center', path: '/admin/dashboard', icon: LayoutDashboard, badge: 'Main' },
            { title: 'Create Event', path: '/admin/events/create', icon: Calendar, badge: 'New' },
            { title: 'Manage Winners', path: '/admin/winners', icon: Award },
            { title: 'Total Participation', path: '/admin/total-participation', icon: Users },
        ]
    },
    {
        category: 'People & Directory',
        items: [
            { title: 'Association Members', path: '/admin/association-members', icon: Users },
            { title: 'Faculty Registry', path: '/admin/faculty', icon: Users },
            { title: 'Volunteer Applications', path: '/admin/volunteers', icon: CheckCircle },
            { title: 'Attendance Records', path: '/admin/attendance', icon: QrCode },
        ]
    },
    {
        category: 'Forms & Certifications',
        items: [
            { title: 'Certificate Studio', path: '/admin/certificates', icon: Award },
            { title: 'Nomination Forms', path: '/admin/nomination-forms', icon: FileText },
            { title: 'Manage Nominations', path: '/admin/nominations', icon: Award },
            { title: 'Registration Templates', path: '/admin/registration-templates', icon: Layers },
            { title: 'Feedback Templates', path: '/admin/feedback-templates', icon: Layers },
        ]
    },
    {
        category: 'Communication & Operations',
        items: [
            { title: 'Email Hub', path: '/admin/email/compose', icon: Mail },
            { title: 'Feedback Analytics', path: '/admin/feedback', icon: MessageSquare },
            { title: 'User Care & Support', path: '/admin/support', icon: HelpCircle },
            { title: 'Expenses & Ledger', path: '/admin/expenses', icon: DollarSign },
            { title: 'System Settings', path: '/admin/settings', icon: Settings },
        ]
    }
];

const getModuleByPath = (pathname) => {
    for (const group of adminModules) {
        for (const item of group.items) {
            if (pathname === item.path || (item.path !== '/admin/dashboard' && pathname.startsWith(item.path))) {
                return item;
            }
        }
    }
    return { title: 'Admin Workspace', path: '/admin/dashboard', icon: LayoutDashboard };
};

const AdminTopBar = ({ 
    title: customTitle, 
    subtitle, 
    badge,
    icon: CustomIcon,
    actions,
    backPath = '/admin/dashboard',
    showHero = true
}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentModule = getModuleByPath(location.pathname);
    const displayTitle = customTitle || currentModule.title;
    const IconComponent = CustomIcon || currentModule.icon || LayoutDashboard;

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
                        to="/admin/dashboard" 
                        className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-extrabold transition-colors group"
                    >
                        <div className="p-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg group-hover:scale-105 transition-transform">
                            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span>Admin Portal</span>
                    </Link>
                    
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    
                    <span className="text-slate-800 dark:text-slate-200 font-black px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                        {displayTitle}
                    </span>
                </div>

                {/* Right Controls: Quick Switcher & Navigation Back Button */}
                <div className="flex items-center gap-2.5">
                    {location.pathname !== '/admin/dashboard' && (
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
                            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-500/20 active:scale-95 border border-indigo-400/20"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-pulse" />
                            <span>Admin Modules</span>
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
                                            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Admin Control Center</span>
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-500/20">
                                            Quick Switch
                                        </span>
                                    </div>

                                    <div className="max-h-96 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                        {adminModules.map((group, idx) => (
                                            <div key={idx} className="space-y-1.5">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2">
                                                    {group.category}
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                    {group.items.map((item) => {
                                                        const Icon = item.icon;
                                                        const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                                                        return (
                                                            <Link
                                                                key={item.path}
                                                                to={item.path}
                                                                onClick={() => setIsMenuOpen(false)}
                                                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                                    isActive
                                                                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold shadow-sm shadow-indigo-500/20'
                                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400'
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
                                                                            : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
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
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 shadow-xl border border-indigo-500/20">
                    {/* Atmospheric Ambient Glow Effects */}
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 border border-indigo-400/30 text-white flex-shrink-0">
                                <IconComponent className="w-7 h-7" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                        {displayTitle}
                                    </h1>
                                    {badge && (
                                        <span className="px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200">
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

export default AdminTopBar;

