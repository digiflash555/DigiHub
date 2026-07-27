import { getImageUrl } from '../../utils/imageUrl';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    DollarSign, Calendar, FileText, ArrowLeft, Loader2, 
    X, Send, User, ChevronRight, CheckCircle, Plus, Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';


const ManageExpenses = () => {
    const [balances, setBalances] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userTransactions, setUserTransactions] = useState([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isReimburseOpen, setIsReimburseOpen] = useState(false);
    const [reimburseAmount, setReimburseAmount] = useState('');
    const [reimburseDesc, setReimburseDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchBalances = async () => {
        try {
            const res = await axios.get(`/api/transactions/balances`);
            setBalances(res.data);
        } catch (error) {
            toast.error('Failed to load expense balances');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBalances();
    }, []);

    const handleViewHistory = async (member) => {
        setSelectedUser(member);
        setIsHistoryOpen(true);
        try {
            const res = await axios.get(`/api/transactions/user/${member._id}`);
            setUserTransactions(res.data);
        } catch (error) {
            toast.error('Failed to load transaction history');
        }
    };

    const handleOpenReimburse = (member) => {
        setSelectedUser(member);
        setReimburseAmount('');
        setReimburseDesc('');
        setIsReimburseOpen(true);
    };

    const handleReimburseSubmit = async (e) => {
        e.preventDefault();
        if (!reimburseAmount || Number(reimburseAmount) <= 0) {
            return toast.error('Please enter a valid amount');
        }

        setIsSubmitting(true);
        try {
            await axios.post(`/api/transactions/reimburse`, {
                amount: Number(reimburseAmount),
                description: reimburseDesc || 'Admin reimbursement paid',
                targetUserId: selectedUser._id
            });
            toast.success(`Successfully reimbursed ₹${reimburseAmount} to ${selectedUser.username}`);
            setIsReimburseOpen(false);
            await fetchBalances();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Reimbursement failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-12 pb-40">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div className="space-y-4">
                    <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white dark:text-white font-bold transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
                        Expenses & <span className="text-reveal">Reimbursements</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-md">
                        Track event expenses logged by Association Members and reimburse their outstanding balances.
                    </p>
                </div>
            </div>

            {/* Balances Board */}
            <div className="bg-white dark:bg-[#20242B] rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden dark:text-white">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Outstanding Balances</h2>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Sorted by Spent Amount</span>
                </div>

                <div className="p-8">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading balances...
                        </div>
                    ) : balances.length === 0 ? (
                        <p className="text-slate-400 font-medium text-center py-12">No Association Members found or no expenses logged.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="pb-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Member</th>
                                        <th className="pb-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Department</th>
                                        <th className="pb-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                                        <th className="pb-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Pending Balance</th>
                                        <th className="pb-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {balances.map(member => (
                                        <tr key={member._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#20242B] flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shrink-0">
                                                        {member?.username?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-extrabold text-slate-900 dark:text-white">{member.username}</p>
                                                        <p className="text-xs text-slate-450 font-bold">{member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-200">{member.department || 'N/A'}</td>
                                            <td className="py-4 px-6">
                                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-[#20242B] text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right font-black text-slate-900 dark:text-white text-lg">
                                                ₹{member.reimbursementBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex justify-center gap-3">
                                                    <button 
                                                        onClick={() => handleViewHistory(member)}
                                                        className="py-2.5 px-4 bg-slate-900 text-white font-black rounded-xl text-xs hover:bg-slate-800 transition-all shadow-sm"
                                                    >
                                                        View History
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenReimburse(member)}
                                                        className="py-2.5 px-4 bg-emerald-600 text-white font-black rounded-xl text-xs hover:bg-emerald-500 transition-all shadow-sm"
                                                    >
                                                        Reimburse
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* History Modal */}
            <AnimatePresence>
                {isHistoryOpen && selectedUser && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-[#20242B] p-8 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative dark:text-white"
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => setIsHistoryOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-[#20242B] rounded-2xl flex items-center justify-center text-slate-700 dark:text-slate-200">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{selectedUser.username}'s Ledger</h3>
                                    <p className="text-gray-500 font-medium">Reimbursement Ledger & Proofs</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {userTransactions.length === 0 ? (
                                    <p className="text-slate-400 font-medium text-center py-12">No transactions recorded for this user.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                                                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Description</th>
                                                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Logged By</th>
                                                    <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Proof</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userTransactions.map(t => (
                                                    <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                                                        <td className="py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${ t.type === 'Spent' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 dark:text-emerald-300 border border-emerald-100' }`}>{t.type}</span>
                                                        </td>
                                                        <td className="py-4 text-sm font-bold text-slate-900 dark:text-white">
                                                            <div>{t.description}</div>
                                                            {t.event && <div className="text-[10px] text-indigo-500 font-extrabold mt-0.5">Event: {t.event.title}</div>}
                                                        </td>
                                                        <td className={`py-4 text-right text-sm font-black ${ t.type === 'Spent' ? 'text-amber-600' : 'text-emerald-600' }`}>
                                                            {t.type === 'Spent' ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 font-bold">{t.addedBy?.username || 'System'}</td>
                                                        <td className="py-4 text-center text-sm">
                                                            {t.proof ? (
                                                                <a 
                                                                    href={getImageUrl(t.proof)} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 text-indigo-650 hover:text-indigo-800 font-extrabold"
                                                                >
                                                                    <FileText className="w-4 h-4" /> View
                                                                </a>
                                                            ) : (
                                                                <span className="text-slate-350 font-medium">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Reimburse Modal */}
            <AnimatePresence>
                {isReimburseOpen && selectedUser && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsReimburseOpen(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-[#20242B] p-8 rounded-3xl max-w-md w-full shadow-2xl relative dark:text-white"
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => setIsReimburseOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-650">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Record Reimbursement</h3>
                                    <p className="text-gray-500 font-medium">Reimburse money to {selectedUser.username}</p>
                                </div>
                            </div>

                            <form onSubmit={handleReimburseSubmit} className="space-y-6">
                                <div className="bg-slate-50 dark:bg-[#1a1d24] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                                    <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-200">
                                        <span>Current Outstanding Balance:</span>
                                        <span className="text-slate-900 dark:text-white">₹{selectedUser.reimbursementBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">Reimbursement Amount (₹) *</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        className="input-field" 
                                        placeholder="0.00"
                                        value={reimburseAmount}
                                        onChange={e => setReimburseAmount(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">Description / Reference ID</label>
                                    <textarea 
                                        className="input-field h-24" 
                                        placeholder="e.g., Paid via GPay Ref #12345, Cash reimbursed..."
                                        value={reimburseDesc}
                                        onChange={e => setReimburseDesc(e.target.value)}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full btn-primary bg-emerald-600 hover:bg-emerald-500 py-4 font-black text-lg flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    Confirm Reimbursement
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageExpenses;
