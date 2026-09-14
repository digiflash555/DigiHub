import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    History, Bot, Users, Calendar, Clock, Trophy,
    CheckCircle, XCircle, Shield, Loader2, ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import StudentHeader from '../components/layout/StudentHeader';

const FILTERS = ['All', 'Wins', 'Losses', 'Draws', 'DigiHub', 'Friend'];

const TicTacToeHistory = () => {
    const [filter, setFilter] = useState('All');
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/games/tictactoe/history?filter=${filter}&page=${page}`);
            setHistoryData(res.data.games || []);
            setTotalPages(res.data.pages || 1);
        } catch (err) {
            console.error('Failed to load history:', err);
            toast.error('Failed to load match history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [filter, page]);

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-8">
            <StudentHeader
                title="Tic-Tac-Toe Match History"
                subtitle="Review your past games against DigiHub AI and multiplayer friends."
                icon={History}
                showHero={false}
                backPath="/games"
            />

            {/* Filter Pills Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => {
                            setFilter(f);
                            setPage(1);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex-shrink-0 ${
                            filter === f
                                ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Match History Table / Cards */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : historyData.length === 0 ? (
                <div className="bg-white dark:bg-[#1a1e26] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-16 text-center space-y-4">
                    <History className="w-12 h-12 text-slate-400 mx-auto" />
                    <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">
                        No matches found for "{filter}"
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                        Play a match vs DigiHub AI or a friend to see your history here!
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1a1e26] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="py-4 px-6">Date & Time</th>
                                    <th className="py-4 px-6">Mode</th>
                                    <th className="py-4 px-6">Opponent</th>
                                    <th className="py-4 px-6">Difficulty</th>
                                    <th className="py-4 px-6">Moves</th>
                                    <th className="py-4 px-6 text-right">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300">
                                {historyData.map((match) => (
                                    <tr key={match.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>
                                                    {new Date(match.date).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[11px]">
                                                {match.mode === 'ai' ? <Bot className="w-3.5 h-3.5 text-primary-500" /> : <Users className="w-3.5 h-3.5 text-blue-500" />}
                                                {match.mode === 'ai' ? 'DigiHub AI' : 'Friend 1v1'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-extrabold text-slate-900 dark:text-white">
                                            {match.opponent}
                                        </td>
                                        <td className="py-4 px-6">
                                            {match.aiDifficulty ? (
                                                <span className={`text-[11px] font-black ${
                                                    match.aiDifficulty === 'Hard' ? 'text-rose-500' : match.aiDifficulty === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                                                }`}>
                                                    {match.aiDifficulty}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="py-4 px-6 text-slate-400 font-medium">
                                            {match.movesCount || '-'} moves ({match.durationSeconds || 0}s)
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                                                match.result === 'Win'
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                                    : match.result === 'Loss'
                                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                                                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                            }`}>
                                                {match.result === 'Win' ? <CheckCircle className="w-3.5 h-3.5" /> : match.result === 'Loss' ? <XCircle className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                                {match.result}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs font-bold">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(prev => prev - 1)}
                                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300"
                            >
                                Previous
                            </button>
                            <span className="text-slate-400">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(prev => prev + 1)}
                                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TicTacToeHistory;
