import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
    Loader2, Plus, Clock, CheckCircle, XCircle,
    User as UserIcon, AlertCircle, Settings,
    Calendar, Flame, ChevronDown, X, Send,
    ArrowRight, Sparkles, FileText, Users, BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StudentHeader from '../components/layout/StudentHeader';

// ── Status & Priority configs ──────────────────────────────────────────────
const STATUS_CFG = {
    Pending:   { label: 'Pending',   accent: 'from-amber-400 to-orange-400',  badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',  icon: Clock,        dot: 'bg-amber-400' },
    Assigned:  { label: 'Assigned',  accent: 'from-blue-400 to-indigo-400',   badge: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',        icon: UserIcon,     dot: 'bg-blue-400' },
    Accepted:  { label: 'Accepted',  accent: 'from-indigo-400 to-violet-400', badge: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30', icon: BadgeCheck,   dot: 'bg-indigo-400' },
    Completed: { label: 'Completed', accent: 'from-emerald-400 to-teal-400',  badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30', icon: CheckCircle, dot: 'bg-emerald-400' },
    Rejected:  { label: 'Rejected',  accent: 'from-red-400 to-rose-400',      badge: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',              icon: XCircle,      dot: 'bg-red-400' },
};

const PRIORITY_CFG = {
    High:   { label: 'High',   color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20',       icon: '🔴' },
    Medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20', icon: '🟡' },
    Low:    { label: 'Low',    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20', icon: '🟢' },
};

// ── Helper: Modal wrapper ──────────────────────────────────────────────────
const PremiumModal = ({ children, onClose }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
    >
        <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="bg-white dark:bg-[#1a1d24] rounded-[2rem] max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            onClick={e => e.stopPropagation()}
        >
            {children}
        </motion.div>
    </motion.div>
);

// ── Main Component ────────────────────────────────────────────────────────
const WorkRequests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [associationMembers, setAssociationMembers] = useState([]);
    const [filterStatus, setFilterStatus] = useState('All');

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');

    // Completion modal state
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [activeRequestId, setActiveRequestId] = useState(null);
    const [workDetails, setWorkDetails] = useState('');
    const [experienceFeedback, setExperienceFeedback] = useState('');

    const fetchRequests = async () => {
        try {
            let res;
            if (user.role === 'Admin') {
                res = await axios.get(`/api/work-requests`);
                const usersRes = await axios.get(`/api/auth/users`);
                const members = usersRes.data.filter(u =>
                    ['Association Member', 'Association Coordinator'].includes(u.role)
                );
                setAssociationMembers(members);
            } else {
                res = await axios.get(`/api/work-requests/mine`);
            }
            setRequests(res.data);
        } catch (error) {
            toast.error('Failed to load work requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, [user]);

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/work-requests`, { title, description, priority, dueDate });
            toast.success('Work request created!');
            setShowCreateModal(false);
            setTitle(''); setDescription(''); setPriority('Medium'); setDueDate('');
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create work request');
        }
    };

    const handleAssign = async (requestId, assigneeId) => {
        if (!assigneeId) return;
        try {
            await axios.patch(`/api/work-requests/${requestId}/assign`, { assigneeId });
            toast.success('Assigned successfully');
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign');
        }
    };

    const handleUpdateStatus = async (requestId, status, data = {}) => {
        try {
            await axios.patch(`/api/work-requests/${requestId}/status`, { status, ...data });
            toast.success(`Marked as ${status}`);
            if (status === 'Completed') {
                setShowFeedbackModal(false);
                setWorkDetails(''); setExperienceFeedback('');
            }
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleCompleteSubmit = (e) => {
        e.preventDefault();
        handleUpdateStatus(activeRequestId, 'Completed', { workDetails, experienceFeedback });
    };

    const canCreate = ['Faculty', 'Class Coordinator', 'Program Coordinator'].includes(user.role);

    // Summary stats
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'Pending').length,
        inProgress: requests.filter(r => ['Assigned', 'Accepted'].includes(r.status)).length,
        completed: requests.filter(r => r.status === 'Completed').length,
    };

    const STATUSES = ['All', 'Pending', 'Assigned', 'Accepted', 'Completed', 'Rejected'];
    const filtered = filterStatus === 'All' ? requests : requests.filter(r => r.status === filterStatus);

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <StudentHeader title="Work Requests" subtitle="Manage and track task assignments." icon={Settings} showHero={true} />
                <div className="flex items-center justify-center py-32">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">Loading work requests...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <StudentHeader
                title="Work Requests"
                subtitle="Manage and track task assignments across the association."
                icon={Settings}
                showHero={true}
                actions={canCreate && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl text-sm font-black transition-all backdrop-blur-sm"
                    >
                        <Plus className="w-4 h-4" /> New Request
                    </button>
                )}
            />

            {/* ── Summary Stats ───────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, icon: FileText, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-white/[0.03] border-slate-100 dark:border-white/[0.06]' },
                    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/[0.08] border-amber-100 dark:border-amber-500/20' },
                    { label: 'In Progress', value: stats.inProgress, icon: Sparkles, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/[0.08] border-indigo-100 dark:border-indigo-500/20' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/[0.08] border-emerald-100 dark:border-emerald-500/20' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <motion.div
                        key={label}
                        whileHover={{ y: -3 }}
                        className={`flex items-center gap-4 p-5 rounded-2xl border ${bg} cursor-default`}
                    >
                        <Icon className={`w-6 h-6 shrink-0 ${color}`} />
                        <div>
                            <p className={`text-2xl font-black ${color}`}>{value}</p>
                            <p className="text-xs font-bold text-slate-400">{label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Filter Pills ─────────────────────────────────────── */}
            <div className="flex gap-2 flex-wrap">
                {STATUSES.map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all border ${
                            filterStatus === s
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                                : 'bg-white dark:bg-[#20242B] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                    >
                        {s}
                        {s !== 'All' && requests.filter(r => r.status === s).length > 0 && (
                            <span className="ml-1.5 opacity-60">
                                {requests.filter(r => r.status === s).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Request List ─────────────────────────────────────── */}
            <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-[#20242B] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-20 text-center"
                    >
                        <div className="w-20 h-20 bg-slate-50 dark:bg-[#1a1d24] rounded-[2rem] flex items-center justify-center mx-auto mb-5">
                            <AlertCircle className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-300 mb-2">No requests found</h3>
                        <p className="text-slate-400 text-sm font-medium">
                            {filterStatus !== 'All'
                                ? `No ${filterStatus.toLowerCase()} requests at the moment.`
                                : 'Work requests will appear here once they are created.'}
                        </p>
                        {canCreate && filterStatus === 'All' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-6 inline-flex items-center gap-2 btn-premium px-8 py-3"
                            >
                                <Plus className="w-4 h-4" /> Create First Request
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((req, idx) => {
                            const isRequester = req.requestedBy?._id === user._id || req.requestedBy === user._id;
                            const isAssignee = req.assignedTo?._id === user._id || req.assignedTo === user._id;
                            const scfg = STATUS_CFG[req.status] || STATUS_CFG.Pending;
                            const pcfg = PRIORITY_CFG[req.priority] || PRIORITY_CFG.Medium;
                            const StatusIcon = scfg.icon;

                            return (
                                <motion.div
                                    key={req._id}
                                    layout
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className="group bg-white dark:bg-[#20242B] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-indigo-200/60 dark:hover:border-indigo-500/30 transition-all duration-300 overflow-hidden"
                                >
                                    {/* Color accent bar */}
                                    <div className={`h-1 bg-gradient-to-r ${scfg.accent}`} />

                                    <div className="p-7">
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* ── Left: Content ── */}
                                            <div className="flex-1 min-w-0 space-y-4">
                                                {/* Title row */}
                                                <div className="flex flex-wrap items-start gap-3">
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex-1 min-w-0">
                                                        {req.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${scfg.badge}`}>
                                                            <StatusIcon className="w-3 h-3" /> {req.status}
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-xl text-xs font-black border ${pcfg.color}`}>
                                                            {pcfg.icon} {req.priority}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">
                                                    {req.description}
                                                </p>

                                                {/* Meta info strip */}
                                                <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400">
                                                    <span className="flex items-center gap-1.5">
                                                        <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                                                        {req.requestedBy?.username || 'Unknown'} ({req.requesterRole})
                                                    </span>
                                                    {req.dueDate && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                                            Due {new Date(req.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    )}
                                                    {req.assignedTo && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                                                            Assigned → {req.assignedTo?.username}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Completion feedback (Admin only) */}
                                                {req.status === 'Completed' && (req.workDetails || req.experienceFeedback) && user.role === 'Admin' && (
                                                    <div className="p-5 bg-emerald-50 dark:bg-emerald-500/[0.07] rounded-2xl border border-emerald-100 dark:border-emerald-500/20 space-y-3">
                                                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                                            <CheckCircle className="w-3.5 h-3.5" /> Completion Report
                                                        </p>
                                                        {req.workDetails && (
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Work Done</p>
                                                                <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-[#20242B] p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                                                                    {req.workDetails}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {req.experienceFeedback && (
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</p>
                                                                <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-[#20242B] p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                                                                    {req.experienceFeedback}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* ── Right: Actions ── */}
                                            <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[180px] lg:border-l lg:border-slate-100 lg:dark:border-slate-800 lg:pl-7 lg:justify-center shrink-0">
                                                {/* Admin: Assign */}
                                                {user.role === 'Admin' && req.status === 'Pending' && (
                                                    <div className="space-y-1.5 w-full">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign To</p>
                                                        <select
                                                            className="input-premium text-sm py-2.5 w-full"
                                                            onChange={e => handleAssign(req._id, e.target.value)}
                                                            defaultValue=""
                                                        >
                                                            <option value="" disabled>Select member...</option>
                                                            {associationMembers.map(m => (
                                                                <option key={m._id} value={m._id}>{m.username}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {/* Assignee: Accept */}
                                                {isAssignee && req.status === 'Assigned' && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={() => handleUpdateStatus(req._id, 'Accepted')}
                                                        className="flex-1 lg:w-full py-2.5 px-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-xl font-black text-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all text-center flex items-center justify-center gap-1.5"
                                                    >
                                                        <BadgeCheck className="w-4 h-4" /> Accept
                                                    </motion.button>
                                                )}

                                                {/* Mark Done */}
                                                {(isAssignee || user.role === 'Admin') && req.status === 'Accepted' && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={() => { setActiveRequestId(req._id); setShowFeedbackModal(true); }}
                                                        className="flex-1 lg:w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded-xl font-black text-sm hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all text-center flex items-center justify-center gap-1.5"
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Mark Done
                                                    </motion.button>
                                                )}

                                                {/* Cancel */}
                                                {(isRequester || user.role === 'Admin') && ['Pending', 'Assigned'].includes(req.status) && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={() => handleUpdateStatus(req._id, 'Rejected')}
                                                        className="flex-1 lg:w-full py-2.5 px-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 rounded-xl font-black text-sm hover:bg-red-600 hover:text-white hover:border-red-600 transition-all text-center flex items-center justify-center gap-1.5"
                                                    >
                                                        <X className="w-4 h-4" /> Cancel
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </AnimatePresence>

            {/* ── Create Modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {showCreateModal && (
                    <PremiumModal onClose={() => setShowCreateModal(false)}>
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center">
                                    <Sparkles className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">New Work Request</h2>
                                    <p className="text-xs text-slate-400 font-medium">Assign a task to a member</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRequest} className="p-8 space-y-5">
                            {/* Title */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Task Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="input-premium w-full"
                                    placeholder="Brief, descriptive task title"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Description</label>
                                <textarea
                                    required
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="input-premium w-full min-h-[110px] resize-none"
                                    placeholder="Explain what needs to be done, any deadlines or context..."
                                />
                            </div>

                            {/* Priority + Due Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={e => setPriority(e.target.value)}
                                        className="input-premium w-full"
                                    >
                                        <option value="Low">🟢 Low</option>
                                        <option value="Medium">🟡 Medium</option>
                                        <option value="High">🔴 High</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        className="input-premium w-full"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex-1 btn-premium py-3 flex items-center justify-center gap-2 text-sm"
                                >
                                    <Send className="w-4 h-4" /> Submit Request
                                </motion.button>
                            </div>
                        </form>
                    </PremiumModal>
                )}
            </AnimatePresence>

            {/* ── Completion Feedback Modal ─────────────────────────── */}
            <AnimatePresence>
                {showFeedbackModal && (
                    <PremiumModal onClose={() => setShowFeedbackModal(false)}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-500/[0.05]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Complete Request</h2>
                                    <p className="text-xs text-slate-400 font-medium">Share a summary of what was accomplished</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFeedbackModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCompleteSubmit} className="p-8 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Work Completed</label>
                                <textarea
                                    required
                                    value={workDetails}
                                    onChange={e => setWorkDetails(e.target.value)}
                                    className="input-premium w-full min-h-[100px] resize-none"
                                    placeholder="Describe exactly what work you completed..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Your Experience</label>
                                <textarea
                                    required
                                    value={experienceFeedback}
                                    onChange={e => setExperienceFeedback(e.target.value)}
                                    className="input-premium w-full min-h-[100px] resize-none"
                                    placeholder="How was your experience completing this task?..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowFeedbackModal(false)}
                                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" /> Mark as Done
                                </motion.button>
                            </div>
                        </form>
                    </PremiumModal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorkRequests;
