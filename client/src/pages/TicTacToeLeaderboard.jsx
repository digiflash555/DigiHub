import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Award, Medal, Loader2, ArrowLeft, Gamepad2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import StudentHeader from '../components/layout/StudentHeader';

const TicTacToeLeaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get('/api/games/tictactoe/leaderboard');
                setLeaderboard(res.data);
            } catch (err) {
                console.error('Failed to load leaderboard:', err);
                toast.error('Failed to load leaderboard');
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const topThree = leaderboard.slice(0, 3);
    const restList = leaderboard.slice(3);

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-10">
            <StudentHeader
                title="Tic-Tac-Toe Leaderboard"
                subtitle="Top players ranked by total wins and win percentage."
                icon={Trophy}
                showHero={false}
                backPath="/games"
            />

            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="bg-white dark:bg-[#1a1e26] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-16 text-center space-y-4">
                    <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
                    <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">
                        No Leaderboard Data Yet
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                        Be the first to play Tic-Tac-Toe and claim the top spot!
                    </p>
                </div>
            ) : (
                <div className="space-y-10">

                    {/* Top 3 Podium Cards */}
                    {topThree.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                            {/* 2nd Place */}
                            {topThree[1] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white dark:bg-[#1a1e26] rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4 relative order-2 sm:order-1"
                                >
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white rounded-full text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                                        <span>🥈 2nd Place</span>
                                    </div>
                                    <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-2xl font-black overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-md">
                                        {topThree[1].user?.profileImage ? (
                                            <img src={topThree[1].user.profileImage} alt={topThree[1].user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            topThree[1].user?.username?.[0]?.toUpperCase() || '?'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                                            {topThree[1].user?.username || 'Unknown'}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">
                                            {topThree[1].user?.yearAndDept || 'CSE Student'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-around text-xs font-extrabold">
                                        <div>
                                            <span className="text-emerald-500 text-lg block font-black">{topThree[1].wins}</span>
                                            <span className="text-[10px] text-slate-400 uppercase">Wins</span>
                                        </div>
                                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                                        <div>
                                            <span className="text-indigo-400 text-lg block font-black">{topThree[1].winRate}%</span>
                                            <span className="text-[10px] text-slate-400 uppercase">Win Rate</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* 1st Place Champion */}
                            {topThree[0] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-slate-900/40 dark:bg-[#1a1e26] rounded-[2.5rem] p-8 border-2 border-amber-400/60 shadow-2xl shadow-amber-500/10 text-center space-y-4 relative order-1 sm:order-2 scale-105"
                                >
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 rounded-full text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                                        <Trophy className="w-4 h-4 text-slate-950" />
                                        <span>🥇 Champion</span>
                                    </div>
                                    <div className="w-24 h-24 rounded-3xl bg-amber-400/20 flex items-center justify-center mx-auto text-3xl font-black overflow-hidden border-4 border-amber-400 shadow-xl shadow-amber-500/30">
                                        {topThree[0].user?.profileImage ? (
                                            <img src={topThree[0].user.profileImage} alt={topThree[0].user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            topThree[0].user?.username?.[0]?.toUpperCase() || '?'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white text-xl">
                                            {topThree[0].user?.username || 'Unknown'}
                                        </h3>
                                        <p className="text-xs text-amber-500 font-bold">
                                            {topThree[0].user?.yearAndDept || 'CSE Student'}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-around text-xs font-extrabold">
                                        <div>
                                            <span className="text-amber-400 text-2xl block font-black">{topThree[0].wins}</span>
                                            <span className="text-[10px] text-amber-300 uppercase">Wins</span>
                                        </div>
                                        <div className="w-px h-8 bg-amber-400/20" />
                                        <div>
                                            <span className="text-amber-400 text-2xl block font-black">{topThree[0].winRate}%</span>
                                            <span className="text-[10px] text-amber-300 uppercase">Win Rate</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* 3rd Place */}
                            {topThree[2] && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-white dark:bg-[#1a1e26] rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4 relative order-3"
                                >
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-800 text-amber-100 rounded-full text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                                        <span>🥉 3rd Place</span>
                                    </div>
                                    <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-2xl font-black overflow-hidden border-2 border-amber-700 shadow-md">
                                        {topThree[2].user?.profileImage ? (
                                            <img src={topThree[2].user.profileImage} alt={topThree[2].user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            topThree[2].user?.username?.[0]?.toUpperCase() || '?'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                                            {topThree[2].user?.username || 'Unknown'}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">
                                            {topThree[2].user?.yearAndDept || 'CSE Student'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-around text-xs font-extrabold">
                                        <div>
                                            <span className="text-emerald-500 text-lg block font-black">{topThree[2].wins}</span>
                                            <span className="text-[10px] text-slate-400 uppercase">Wins</span>
                                        </div>
                                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                                        <div>
                                            <span className="text-indigo-400 text-lg block font-black">{topThree[2].winRate}%</span>
                                            <span className="text-[10px] text-slate-400 uppercase">Win Rate</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* Rankings Table (4+) */}
                    {restList.length > 0 && (
                        <div className="bg-white dark:bg-[#1a1e26] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                    Rankings (4th - {leaderboard.length}th)
                                </h3>
                                <span className="text-xs font-bold text-slate-400">Total Players</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <th className="py-4 px-6">Rank</th>
                                            <th className="py-4 px-6">Student</th>
                                            <th className="py-4 px-6">Department & Class</th>
                                            <th className="py-4 px-6">Played</th>
                                            <th className="py-4 px-6">Wins</th>
                                            <th className="py-4 px-6 text-right">Win Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {restList.map((item) => (
                                            <tr key={item.user?._id || item.rank} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="py-4 px-6 font-black text-slate-400">
                                                    #{item.rank}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-black overflow-hidden shrink-0">
                                                            {item.user?.profileImage ? (
                                                                <img src={item.user.profileImage} alt={item.user.username} className="w-full h-full object-cover" />
                                                            ) : (
                                                                item.user?.username?.[0]?.toUpperCase() || '?'
                                                            )}
                                                        </div>
                                                        <span className="font-extrabold text-slate-900 dark:text-white">
                                                            {item.user?.username || 'Student'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-slate-400 font-medium">
                                                    {item.user?.yearAndDept || 'CSE Student'}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {item.gamesPlayed}
                                                </td>
                                                <td className="py-4 px-6 text-emerald-500 font-black">
                                                    {item.wins}
                                                </td>
                                                <td className="py-4 px-6 text-right font-black text-indigo-400">
                                                    {item.winRate}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default TicTacToeLeaderboard;
