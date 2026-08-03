import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
    MessageSquare, Send, History, 
    CheckCircle2, Clock, AlertCircle,
    ChevronRight, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Support = () => {
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('Query');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myQueries, setMyQueries] = useState([]);
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'

    useEffect(() => {
        if (activeTab === 'history') {
            fetchMyQueries();
        }
    }, [activeTab]);

    const fetchMyQueries = async () => {
        try {
            const res = await axios.get(`/api/support/my`);
            setMyQueries(res.data);
        } catch (error) {
            console.error('Failed to fetch queries');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post(`/api/support`, {
                subject,
                category,
                message
            });
            toast.success('Your message has been sent to admin!');
            setSubject('');
            setCategory('Query');
            setMessage('');
            setActiveTab('history');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send message');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'In Progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Closed': return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Resolved': return <CheckCircle2 className="w-4 h-4" />;
            case 'In Progress': return <Clock className="w-4 h-4 animate-pulse" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-40">
            <header className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                    <HelpCircle className="w-4 h-4" />
                    Help & Grievance Redressal
                </div>
                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                    Complaints & <span className="text-reveal">Feedback Hub.</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                    Submit your complaints, suggestions, or technical issues. Our admin team will review and address them promptly.
                </p>
            </header>

            <div className="flex gap-4 p-2 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl w-fit">
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${ activeTab === 'new' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600' } dark:text-white`}
                >
                    File a Complaint
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${ activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600' } dark:text-white`}
                >
                    Complaint Status
                </button>
            </div>

            <main className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {activeTab === 'new' ? (
                            <motion.div 
                                key="new"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-white dark:bg-[#20242B] rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 dark:text-white"
                            >
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Complaint Subject</label>
                                            <input 
                                                required
                                                type="text" 
                                                className="input-premium w-full"
                                                placeholder="Brief title of your issue"
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Nature of Ticket</label>
                                            <select 
                                                className="input-premium w-full appearance-none"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                            >
                                                <option value="Complaint">Formal Complaint</option>
                                                <option value="Issue">Technical Issue</option>
                                                <option value="Suggestion">Suggestion</option>
                                                <option value="Query">General Query</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Detailed Description</label>
                                        <textarea 
                                            required
                                            className="input-premium w-full min-h-[200px] py-6 resize-none"
                                            placeholder="Please explain your complaint or suggestion in detail..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="btn-premium w-full py-5 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Submitting...' : (
                                            <>
                                                Submit Complaint <Send className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="history"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                {myQueries.length === 0 ? (
                                    <div className="bg-slate-50 dark:bg-[#1a1d24] rounded-[2.5rem] p-20 text-center space-y-4">
                                        <History className="w-16 h-16 text-slate-200 mx-auto" />
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">No requests yet.</h3>
                                        <p className="text-slate-400 font-medium">Your support history will appear here.</p>
                                    </div>
                                ) : (
                                    myQueries.map((q) => (
                                        <div key={q._id} className="bg-white dark:bg-[#20242B] rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 hover:shadow-xl transition-all duration-300 dark:text-white">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{q.category}</span>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{q.subject}</h3>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${getStatusStyle(q.status)}`}>
                                                    {getStatusIcon(q.status)}
                                                    {q.status}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{q.message}</p>
                                            
                                            {q.adminRemarks && (
                                                <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 space-y-2">
                                                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Admin Response</p>
                                                    <p className="text-slate-700 dark:text-slate-200 font-bold">{q.adminRemarks}</p>
                                                </div>
                                            )}

                                            <div className="pt-6 border-t border-slate-50 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>Submitted on {new Date(q.createdAt).toLocaleDateString()}</span>
                                                <span className="text-indigo-600 dark:text-indigo-400">REQ-{q._id.slice(-6).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                        <h3 className="text-xl font-black tracking-tight">Quick Help</h3>
                        <div className="space-y-4">
                            {[
                                'Event registration issues',
                                'Certificate download help',
                                'Team code assistance',
                                'Feedback form errors'
                            ].map((item, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => {
                                        setSubject(item);
                                        setActiveTab('new');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group dark:text-white"
                                >
                                    <HelpCircle className="w-5 h-5 text-indigo-400" />
                                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{item}</span>
                                    <ChevronRight className="w-4 h-4 ml-auto text-slate-600 dark:text-slate-300" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 bg-white dark:bg-[#20242B] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-4 dark:text-white">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Response Time</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Our admin team typically responds within 24-48 business hours.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Support;
