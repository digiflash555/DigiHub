import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';

const EmailHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get('/api/email/history')
            .then(r => setHistory(r.data.filter(h => h.emailType === 'Manual' && h.status === 'Sent')))
            .catch(() => toast.error('Failed to load sent emails'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Sent Emails</h2>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
            ) : history.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                    <Send className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
                    <p className="text-slate-400 font-bold">No sent emails yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map(h => (
                        <div key={h._id} className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#20242B] border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                                <Send className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 dark:text-white truncate">{h.subject}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    To: {h.recipientCount} recipient{h.recipientCount !== 1 ? 's' : ''} •{' '}
                                    {new Date(h.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <span className="flex-shrink-0 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-200">
                                Sent
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmailHistory;
