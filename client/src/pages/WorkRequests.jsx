import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Clock, CheckCircle, XCircle, User as UserIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WorkRequests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [associationMembers, setAssociationMembers] = useState([]);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');
    
    // Feedback modal state
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [activeRequestId, setActiveRequestId] = useState(null);
    const [workDetails, setWorkDetails] = useState('');
    const [experienceFeedback, setExperienceFeedback] = useState('');

    const fetchRequests = async () => {
        try {
            let res;
            if (user.role === 'Admin') {
                res = await axios.get(`/api/work-requests`);
                
                // Fetch association members for assignment
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

    useEffect(() => {
        fetchRequests();
    }, [user]);

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/work-requests`, {
                title, description, priority, dueDate
            });
            toast.success('Work request created successfully');
            setShowCreateModal(false);
            setTitle('');
            setDescription('');
            setPriority('Medium');
            setDueDate('');
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create work request');
        }
    };

    const handleAssign = async (requestId, assigneeId) => {
        if (!assigneeId) return;
        try {
            await axios.patch(`/api/work-requests/${requestId}/assign`, {
                assigneeId
            });
            toast.success('Work request assigned successfully');
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign work request');
        }
    };

    const handleUpdateStatus = async (requestId, status, data = {}) => {
        try {
            await axios.patch(`/api/work-requests/${requestId}/status`, {
                status,
                ...data
            });
            toast.success(`Status updated to ${status}`);
            if (status === 'Completed') {
                setShowFeedbackModal(false);
                setWorkDetails('');
                setExperienceFeedback('');
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

    const getStatusColor = (status) => {
        switch(status) {
            case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Assigned': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Accepted': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getPriorityColor = (prio) => {
        switch(prio) {
            case 'High': return 'text-red-600 bg-red-50';
            case 'Medium': return 'text-amber-600 bg-amber-50';
            case 'Low': return 'text-emerald-600 bg-emerald-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-[#20242B] p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 dark:text-white">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Work Requests</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage and track task assignments</p>
                </div>
                {canCreate && (
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> New Request
                    </button>
                )}
            </div>

            {/* List */}
            {requests.length === 0 ? (
                <div className="bg-white dark:bg-[#20242B] p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center shadow-sm dark:text-white">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
                        <AlertCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No requests found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">There are currently no work requests to display.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map(req => {
                        const isRequester = req.requestedBy?._id === user._id || req.requestedBy === user._id;
                        const isAssignee = req.assignedTo?._id === user._id || req.assignedTo === user._id;

                        return (
                            <div key={req._id} className="bg-white dark:bg-[#20242B] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all dark:text-white">
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{req.title}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(req.status)}`}>
                                                    {req.status}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(req.priority)}`}>
                                                    {req.priority} Priority
                                                </span>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{req.description}</p>
                                            
                                            {req.status === 'Completed' && (req.workDetails || req.experienceFeedback) && user.role === 'Admin' && (
                                                <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 space-y-3">
                                                    <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Completion Feedback</h4>
                                                    {req.workDetails && (
                                                        <div>
                                                            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Work Details</span>
                                                            <p className="text-sm text-slate-700 bg-white dark:bg-[#20242B] p-3 rounded-lg border border-emerald-100 dark:border-emerald-500/20 dark:text-white">{req.workDetails}</p>
                                                        </div>
                                                    )}
                                                    {req.experienceFeedback && (
                                                        <div>
                                                            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Experience</span>
                                                            <p className="text-sm text-slate-700 bg-white dark:bg-[#20242B] p-3 rounded-lg border border-emerald-100 dark:border-emerald-500/20 dark:text-white">{req.experienceFeedback}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#1a1d24] p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="w-4 h-4 text-primary-500" />
                                            Requested by: {req.requestedBy?.username || 'Unknown'} ({req.requesterRole})
                                        </div>
                                        {req.dueDate && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-amber-500" />
                                                Due: {new Date(req.dueDate).toLocaleDateString()}
                                            </div>
                                        )}
                                        {req.assignedTo && (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                Assigned to: {req.assignedTo?.username}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 justify-center">
                                    {/* Admin Actions */}
                                    {user.role === 'Admin' && req.status === 'Pending' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Assign To</label>
                                            <select 
                                                className="input-field py-2 text-sm"
                                                onChange={(e) => handleAssign(req._id, e.target.value)}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Select Member...</option>
                                                {associationMembers.map(m => (
                                                    <option key={m._id} value={m._id}>{m.username}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Status Updates (For Assignee or Requester) */}
                                    {(isAssignee || isRequester || user.role === 'Admin') && req.status !== 'Completed' && req.status !== 'Rejected' && (
                                        <div className="flex flex-col gap-2 mt-auto">
                                            {isAssignee && req.status === 'Assigned' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(req._id, 'Accepted')}
                                                    className="w-full py-2 px-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all text-center"
                                                >
                                                    Accept Request
                                                </button>
                                            )}
                                            {(isAssignee || user.role === 'Admin') && req.status === 'Accepted' && (
                                                <button 
                                                    onClick={() => {
                                                        setActiveRequestId(req._id);
                                                        setShowFeedbackModal(true);
                                                    }}
                                                    className="w-full py-2 px-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded-xl font-bold text-sm hover:bg-emerald-600 hover:text-white transition-all text-center"
                                                >
                                                    Mark Done
                                                </button>
                                            )}
                                            {(isRequester || user.role === 'Admin') && (req.status === 'Pending' || req.status === 'Assigned') && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(req._id, 'Rejected')}
                                                    className="flex-1 py-2 px-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all text-center"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#20242B] rounded-3xl p-8 max-w-lg w-full shadow-xl border border-slate-100 dark:border-slate-800 dark:text-white"
                        >
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">New Work Request</h2>
                            <form onSubmit={handleCreateRequest} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Title</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="input-field" 
                                        placeholder="Brief title of the work"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Description</label>
                                    <textarea 
                                        required
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="input-field min-h-[100px] resize-y" 
                                        placeholder="Detailed description of what needs to be done..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Priority</label>
                                        <select 
                                            value={priority}
                                            onChange={e => setPriority(e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Due Date (Optional)</label>
                                        <input 
                                            type="date" 
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            className="input-field" 
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-3 px-4 bg-slate-100 dark:bg-[#20242B] text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 btn-primary py-3"
                                    >
                                        Submit Request
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback Modal */}
            <AnimatePresence>
                {showFeedbackModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#20242B] rounded-3xl p-8 max-w-lg w-full shadow-xl border border-slate-100 dark:border-slate-800 dark:text-white"
                        >
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Complete Work Request</h2>
                            <form onSubmit={handleCompleteSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Work Details</label>
                                    <textarea 
                                        required
                                        value={workDetails}
                                        onChange={e => setWorkDetails(e.target.value)}
                                        className="input-field min-h-[100px] resize-y" 
                                        placeholder="What work did you actually complete?..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Experience Feedback</label>
                                    <textarea 
                                        required
                                        value={experienceFeedback}
                                        onChange={e => setExperienceFeedback(e.target.value)}
                                        className="input-field min-h-[100px] resize-y" 
                                        placeholder="How was your experience doing this work?..."
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowFeedbackModal(false)}
                                        className="flex-1 py-3 px-4 bg-slate-100 dark:bg-[#20242B] text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 btn-primary py-3 bg-emerald-600 hover:bg-emerald-700 ring-emerald-600 shadow-emerald-500/20"
                                    >
                                        Submit & Mark Done
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorkRequests;
