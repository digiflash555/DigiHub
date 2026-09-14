import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Trash2, Send, Loader2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmailDrafts = () => {
    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchDrafts = () => {
        setLoading(true);
        axios.get('/api/email/drafts')
            .then(r => setDrafts(r.data))
            .catch(() => toast.error('Failed to load drafts'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDrafts(); }, []);

    const deleteDraft = async (id) => {
        try {
            await axios.delete(`/api/email/drafts/${id}`);
            toast.success('Draft deleted');
            fetchDrafts();
        } catch {
            toast.error('Failed to delete draft');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Drafts</h2>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
            ) : drafts.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                    <FileText className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto" />
                    <p className="text-slate-400 font-bold">No drafts saved yet</p>
                    <button onClick={() => navigate('/admin/email/compose')}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all">
                        Compose Email
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {drafts.map(d => (
                        <div key={d._id} className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#20242B] border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 dark:text-white truncate">{d.subject || '(No subject)'}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {d.recipientGroups?.join(', ') || 'No groups'} • Saved {new Date(d.updatedAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => navigate('/admin/email/compose', { state: { draft: d } })}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all">
                                    <Send className="w-3.5 h-3.5" /> Open
                                </button>
                                <button onClick={() => deleteDraft(d._id)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmailDrafts;
