import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    UserPlus, Users, Mail, Lock,
    Loader2, ShieldCheck,
    ArrowLeft, User, Phone, Hash, GraduationCap, School,
    CheckCircle, UserCheck, Briefcase, Edit2, Trash2, Save, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../../contexts/ConfirmContext';

const ManageFaculty = () => {
    const { confirm } = useConfirm();
    const [faculty, setFaculty] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        employeeId: '',
        phone: '',
        gender: 'Male',
        department: 'Computer Science and Engineering',
        designation: 'Assistant Professor',
        role: 'Faculty',
        assignedYear: 'I',
        assignedSection: 'A'
    });
    const [showForm, setShowForm] = useState(false);

    const fetchFaculty = async () => {
        try {
            const res = await axios.get(`/api/auth/users`);
            const facultyRoles = ['Faculty', 'Admin'];
            setFaculty(res.data.filter(u => facultyRoles.includes(u.role)));
        } catch (error) {
            toast.error('Failed to load faculty accounts');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchFaculty(); }, []);

    const resetForm = () => {
        setForm({
            username: '', email: '', password: '',
            employeeId: '', phone: '', gender: 'Male',
            department: 'Computer Science and Engineering',
            designation: 'Assistant Professor',
            role: 'Faculty',
            assignedYear: 'I',
            assignedSection: 'A'
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (fac) => {
        setEditingId(fac._id);
        setForm({
            username: fac.username,
            email: fac.email,
            password: '',
            employeeId: fac.employeeId || '',
            phone: fac.phone || '',
            gender: fac.gender || 'Female',
            department: fac.department || 'Computer Science and Engineering',
            designation: fac.designation || 'Assistant Professor',
            role: fac.role,
            assignedYear: fac.assignedYear || 'I',
            assignedSection: fac.assignedSection || 'A'
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm('Delete this faculty account?');
        if (!confirmed) return;
        try {
            await axios.delete(`/api/auth/users/${id}`);
            toast.success('Account deleted');
            fetchFaculty();
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            if (editingId) {
                const updateData = { ...form };
                if (!updateData.password) delete updateData.password;
                await axios.put(`/api/auth/users/${editingId}`, updateData);
                toast.success('Account updated successfully!');
            } else {
                await axios.post(`/api/auth/create-faculty`, form);
                toast.success(`${form.role} account created for ${form.username}!`);
            }
            resetForm();
            fetchFaculty();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-12 pb-40">
            <div className="flex flex-wrap justify-between items-end gap-6">
                <div className="space-y-4">
                    <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Faculty <span className="text-reveal">Registry.</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-md">
                        Manage Admin and Coordinator accounts.
                    </p>
                </div>
                <button
                    onClick={() => showForm ? resetForm() : setShowForm(true)}
                    className="btn-premium flex items-center gap-3"
                >
                    {showForm ? <X className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
                    {showForm ? 'Cancel' : 'Add Faculty'}
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-[#20242B] rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm dark:text-white"
                    >
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8">{editingId ? 'Edit Faculty' : 'New Faculty Account'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                    <div className="relative">

                                        <input
                                            type="text" className="input-premium pl-14"
                                            placeholder="Faculty Name" required
                                            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Email</label>
                                    <div className="relative">

                                        <input
                                            type="email" className="input-premium pl-14"
                                            placeholder="faculty@domain.com" required
                                            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Password {editingId && '(Leave blank to keep current)'}</label>
                                    <div className="relative">

                                        <input
                                            type="text" className="input-premium pl-14"
                                            placeholder={editingId ? "New Password" : "Min. 6 chars"}
                                            required={!editingId} minLength={6}
                                            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Employee ID</label>
                                    <div className="relative">

                                        <input
                                            type="text" className="input-premium pl-14"
                                            placeholder="EMP001" required
                                            value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Department</label>
                                    <input
                                        type="text" className="input-premium"
                                        placeholder="Dept Name" required
                                        value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Designation</label>
                                    <input
                                        type="text" className="input-premium"
                                        placeholder="e.g. Assistant Professor" required
                                        value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Role</label>
                                    <select
                                        className="input-premium"
                                        value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                    >
                                        <option value="Faculty">Faculty</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={resetForm} className="px-8 py-3 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-[#2a2e36] transition-all">Cancel</button>
                                <button type="submit" disabled={isCreating} className="btn-premium flex items-center gap-3 py-3 px-10">
                                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? <Save className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                    {isCreating ? 'Saving...' : editingId ? 'Update Account' : 'Create Faculty Account'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white dark:bg-[#20242B] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden dark:text-white">
                <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Faculty Directory</h2>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-16 text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-slate-200 mx-auto" />
                        </div>
                    ) : faculty.length === 0 ? (
                        <div className="p-20 text-center space-y-6">
                            <Users className="w-16 h-16 text-slate-100 mx-auto" />
                            <h3 className="text-2xl font-black text-slate-300">No faculty accounts found</h3>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-[#20242B]/50">
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Faculty Info</th>
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Designation & Dept</th>
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Responsibility</th>
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {faculty.map(fac => (
                                    <tr key={fac._id} className="hover:bg-slate-50 dark:hover:bg-[#2a2e36] transition-colors group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-lg">
                                                    {fac?.username?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 dark:text-white">{fac.username}</span>
                                                    <span className="text-xs text-slate-400 font-bold">{fac.email}</span>
                                                    <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">ID: {fac.employeeId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                                                    <Briefcase className="w-3.5 h-3.5" /> {fac.designation}
                                                </div>
                                                <div className="text-xs text-slate-400 font-medium">
                                                    {fac.department}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${fac.role === 'Admin' ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400'}`}>
                                                <UserCheck className="w-3 h-3" />
                                                {fac.role}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleEdit(fac)}
                                                    className="p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2e36] rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-800"
                                                    title="Edit Account"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(fac._id)}
                                                    className={`p-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-800 ${fac.role === 'Admin' ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                    title="Delete Account"
                                                    disabled={fac.role === 'Admin'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageFaculty;
