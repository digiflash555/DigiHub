import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Trash2, Clock, Loader2 } from 'lucide-react';

const statusColors = {
    Scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
    Processing: 'bg-blue-50 text-blue-700 border-blue-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Failed: 'bg-red-50 text-red-700 border-red-200',
};

const ScheduledEmails = () => {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEmails = () => {
        setLoading(true);
        axios.get('/api/email/scheduled')
            .then(r => setEmails(r.data))
            .catch(() => toast.error('Failed to load scheduled emails'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchEmails(); }, []);

    const cancel = async (id) => {
        try {
            await axios.delete(`/api/email/scheduled/${id}`);
            toast.success('Scheduled email cancelled');
            fetchEmails();
        } catch {
            toast.error('Failed to cancel');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Scheduled Emails</h2>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
            ) : emails.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                    <Clock className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
                    <p className="text-slate-400 font-bold">No scheduled emails</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {emails.map(e => (
                        <div key={e._id} className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#20242B] border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 dark:text-white truncate">{e.subject}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Scheduled for: <span className="font-bold text-slate-600 dark:text-slate-300">{new Date(e.scheduledDate).toLocaleString()}</span>
                                    {' '}• Groups: {e.recipientGroups?.join(', ') || 'Custom recipients'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className={`px-3 py-1 rounded-lg text-xs font-black border ${statusColors[e.status] || statusColors.Scheduled}`}>
                                    {e.status}
                                </span>
                                {e.status === 'Scheduled' && (
                                    <button onClick={() => cancel(e._id)}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">
                                        <Trash2 className="w-3.5 h-3.5" /> Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScheduledEmails;
