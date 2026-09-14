import { useState, useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Lock, Gamepad2, ShieldAlert, ArrowLeft, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const GameRoute = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [gamesEnabled, setGamesEnabled] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkGameSettings = async () => {
            try {
                const res = await axios.get('/api/settings');
                setGamesEnabled(res.data.gamesEnabled !== false);
            } catch (error) {
                console.error('Failed to load system settings for games:', error);
                setGamesEnabled(true);
            } finally {
                setLoading(false);
            }
        };

        checkGameSettings();
    }, []);

    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold text-sm tracking-wide">Checking Game Permissions...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If games are disabled and user is not an Admin, block access
    if (!gamesEnabled && user.role !== 'Admin') {
        return (
            <div className="max-w-2xl mx-auto py-16 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="bg-white dark:bg-[#1a1e26] rounded-[2.5rem] p-10 md:p-14 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-8 relative overflow-hidden"
                >
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center space-y-6">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-xl shadow-red-500/20">
                            <Lock className="w-12 h-12" />
                        </div>

                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest border border-red-200 dark:border-red-500/30">
                                <ShieldAlert className="w-4 h-4" />
                                Access Restricted
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                Gaming Arcade Disabled
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-base max-w-md mx-auto leading-relaxed">
                                Playing games has been temporarily turned off by the system administrator. Please check back later!
                            </p>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Admin view notice if games are disabled
    if (!gamesEnabled && user.role === 'Admin') {
        return (
            <div className="space-y-6">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl flex items-center justify-between gap-4 max-w-5xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                            <strong>Admin Notice:</strong> Gaming arcade is currently <strong>disabled for all users</strong>. As an admin, you can still view/test game modes or change this setting in System Settings.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/settings')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-700 rounded-xl text-xs font-black shrink-0 transition-colors"
                    >
                        <Settings className="w-3.5 h-3.5" />
                        Manage Settings
                    </button>
                </div>
                <Outlet />
            </div>
        );
    }

    return <Outlet />;
};

export default GameRoute;
