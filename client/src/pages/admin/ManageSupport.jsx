import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
    MessageSquare, CheckCircle2, Clock, 
    AlertCircle, Search, Filter, 
    MoreVertical, ExternalLink, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ManageSupport = () => {
    const [queries, setQueries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [adminRemarks, setAdminRemarks] = useState('');
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        fetchQueries();
    }, []);

    const fetchQueries = async () => {
        try {
            const res = await axios.get(`/api/support`);
            setQueries(res.data);
        } catch (error) {
            toast.error('Failed to load support queries');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/support/${selectedQuery._id}`, {
                status: newStatus,
                adminRemarks
            });
            toast.success('Query updated successfully');
            setSelectedQuery(null);
            fetchQueries();
        } catch (error) {
            toast.error('Failed to update query');
        }
    };

    const filteredQueries = queries.filter(q => {
        const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
        const matchesSearch = 
            q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (q.user?.username || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'In Progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'Closed': return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    return (
        <div className="space-y-12 pb-40">
            <header>
                <Link to="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors mb-4 text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Grievance <span className="text-reveal">Redressal.</span></h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Monitor, manage, and resolve user complaints and support tickets.</p>
            </header>

            <div className="flex flex-col gap-4 p-4 md:p-6 bg-white dark:bg-[#20242B] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm dark:text-white">
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                        type="text" 
                        placeholder="Search by subject, user, or complaint ID..." 
                        className="input-premium pl-12 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {['All', 'Pending', 'In Progress', 'Resolved', 'Closed'].map(status => (
                        <button 
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs font-black transition-all ${ statusFilter === status ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 dark:text-slate-400 hover:bg-slate-100' }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence>
                    {isLoading ? (
                        <div className="text-center py-20 text-slate-400 font-medium">Loading tickets...</div>
                    ) : filteredQueries.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-[#1a1d24] rounded-[2.5rem] p-20 text-center space-y-4">
                            <MessageSquare className="w-16 h-16 text-slate-200 mx-auto" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No tickets found.</h3>
                        </div>
                    ) : (
                        filteredQueries.map((q) => (
                            <motion.div 
                                key={q._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-[#20242B] rounded-[2rem] p-5 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 items-start lg:items-center dark:text-white"
                            >
                                <div className="sm:col-span-2 lg:col-span-2 space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">{q.category}</span>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusStyle(q.status)}`}>
                                            {q.status}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{q.subject}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-1">{q.message}</p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted By</p>
                                    <p className="font-bold text-slate-900 dark:text-white">{q.user?.username}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{q.user?.email}</p>
                                </div>

                                <div className="flex justify-start sm:justify-end gap-3">
                                    <button 
                                        onClick={() => {
                                            setSelectedQuery(q);
                                            setNewStatus(q.status);
                                            setAdminRemarks(q.adminRemarks || '');
                                        }}
                                        className="btn-premium px-6 py-3 text-sm flex items-center gap-2"
                                    >
                                        Handle Ticket <ExternalLink className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Modal for Handling Ticket */}
            <AnimatePresence>
                {selectedQuery && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setSelectedQuery(null)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-[#20242B] rounded-[3rem] shadow-2xl overflow-hidden dark:text-white"
                        >
                            <div className="p-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Grievance Redressal</span>
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">Resolution Form</h2>
                                    </div>
                                    <button onClick={() => setSelectedQuery(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                        <AlertCircle className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-4 bg-slate-50 dark:bg-[#1a1d24] p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Subject</span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{selectedQuery.subject}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 font-medium py-2 border-t border-slate-200 dark:border-slate-700 mt-2">{selectedQuery.message}</p>
                                </div>

                                <form onSubmit={handleUpdate} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Update Status</label>
                                        <select 
                                            className="input-premium w-full appearance-none"
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value)}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Resolved">Resolved</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Admin Remarks</label>
                                        <textarea 
                                            className="input-premium w-full min-h-[120px] py-4 resize-none"
                                            placeholder="Enter your response to the user..."
                                            value={adminRemarks}
                                            onChange={(e) => setAdminRemarks(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <button 
                                            type="button"
                                            onClick={() => setSelectedQuery(null)}
                                            className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest hover:text-slate-900 dark:hover:text-white dark:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            className="flex-[2] btn-premium py-4 font-black"
                                        >
                                            Confirm Update
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageSupport;
