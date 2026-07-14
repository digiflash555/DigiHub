import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Handshake, Users, Calendar, CheckCircle, XCircle,
    Clock, Award, Loader2, Search, Filter, ArrowLeft,
    BookOpen, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const statusColors = {
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

const ManageVolunteers = () => {
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState('');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`/api/volunteers/all`);
            setApplications(res.data);
        } catch {
            toast.error('Failed to load volunteer applications');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (id, updates) => {
        setUpdatingId(id);
        try {
            await axios.put(`/api/volunteers/${id}`, updates);
            toast.success('Application updated!');
            fetchApplications();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setUpdatingId('');
        }
    };

    const filtered = applications.filter(app => {
        const matchStatus = filterStatus === 'All' || app.status === filterStatus;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q
            || app.applicant?.username?.toLowerCase().includes(q)
            || app.event?.title?.toLowerCase().includes(q)
            || app.applicant?.registrationNumber?.toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'Pending').length,
        approved: applications.filter(a => a.status === 'Approved').length,
        onDuty: applications.filter(a => a.onDutyIssued).length
    };

    return (
        <div className="space-y-12 pb-40">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-4">
                    <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
                        Volunteer <span className="text-reveal">Applications.</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-lg">
                        Review volunteer applications from Association Members. Approve and issue On-Duty letters for academics.
                    </p>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-100' },

                    { label: 'Approved', value: stats.approved, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },

                ].map(stat => (
                    <div key={stat.label} className={`p-6 rounded-[2rem] border ${stat.bg} text-center`}>
                        <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[#20242B] rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center dark:text-white">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                        type="text"
                        className="input-premium pl-14 w-full"
                        placeholder="Search by name, event, or reg number..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['All', 'Approved'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 dark:text-slate-400 hover:bg-slate-100'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Applications List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-[#20242B] rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 py-24 text-center space-y-4 dark:text-white">
                    <Handshake className="w-16 h-16 text-slate-100 mx-auto" />
                    <h3 className="text-2xl font-black text-slate-300">No Applications Found</h3>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(app => (
                        <motion.div
                            key={app._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-[#20242B] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 dark:text-white"
                        >
                            <div className="flex flex-wrap items-start gap-6">
                                {/* Member Info */}
                                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Users className="w-7 h-7 text-indigo-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h3 className="font-black text-xl text-slate-900 dark:text-white">{app.applicant?.username}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${statusColors[app.status]}`}>
                                            {app.status}
                                        </span>
                                        {app.onDutyIssued && (
                                            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 text-xs font-black">
                                                <Award className="w-3 h-3" /> On-Duty Issued
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500 dark:text-slate-400 font-bold">
                                        <span>{app.applicant?.registrationNumber || app.applicant?.email}</span>
                                        {app.applicant?.yearAndDept && <span>{app.applicant.yearAndDept} · Sec {app.applicant.section}</span>}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-bold">
                                        <Calendar className="w-4 h-4 text-indigo-400" />
                                        {app.event?.title} · {app.event?.eventDate ? new Date(app.event.eventDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                    {app.motivation && (
                                        <p className="mt-2 text-sm text-slate-400 italic max-w-xl">"{app.motivation}"</p>
                                    )}
                                    {app.onDutyNote && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                                            <BookOpen className="w-3.5 h-3.5" /> Note: {app.onDutyNote}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageVolunteers;
