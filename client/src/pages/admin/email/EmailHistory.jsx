import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { History, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

const statusIcon = {
    Sent: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    Failed: <XCircle className="w-4 h-4 text-red-500" />,
    Pending: <Clock className="w-4 h-4 text-amber-500" />,
};

const statusColors = {
    Sent: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200',
    Failed: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200',
    Pending: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200',
};

const EmailHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        setLoading(true);
        axios.get('/api/email/history')
            .then(r => setHistory(r.data))
            .catch(() => toast.error('Failed to load history'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'All' ? history : history.filter(h => h.status === filter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Email History</h2>
                <div className="flex gap-2">
                    {['All', 'Sent', 'Failed', 'Pending'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                filter === f
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                    <History className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
                    <p className="text-slate-400 font-bold">No emails found</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                                <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Subject</th>
                                <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Recipients</th>
                                <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {filtered.map(h => (
                                <tr key={h._id} className="bg-white dark:bg-[#20242B] hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-5 py-4">
                                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{h.subject}</p>
                                        {h.failureReason && (
                                            <p className="text-xs text-red-500 mt-0.5 truncate max-w-[200px]">{h.failureReason}</p>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                                            h.emailType === 'Manual'
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
                                                : 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300'
                                        }`}>{h.emailType}</span>
                                    </td>
                                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300 font-bold">{h.recipientCount}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${statusColors[h.status]}`}>
                                            {statusIcon[h.status]} {h.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-slate-400 text-xs font-medium">
                                        {new Date(h.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EmailHistory;
