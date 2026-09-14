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
import AdminHeader from '../../components/layout/AdminHeader';

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
        assignedSection: 'A',
        bio: '',
        profileImage: null,
        displayOrder: 0
    });
    const [showForm, setShowForm] = useState(false);

    const fetchFaculty = async () => {
        try {
            const res = await axios.get(`/api/auth/users`);
            const facultyRoles = ['Faculty', 'Admin', 'Head of the Department'];
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
            assignedSection: 'A',
            bio: '',
            profileImage: null,
            displayOrder: 0
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
            gender: fac.gender || 'Male',
            department: fac.department || 'Computer Science and Engineering',
            designation: fac.designation || 'Assistant Professor',
            role: fac.role,
            assignedYear: fac.assignedYear || 'I',
            assignedSection: fac.assignedSection || 'A',
            bio: fac.bio || '',
            profileImage: null,
            displayOrder: fac.displayOrder || 0
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
            const fd = new FormData();
            Object.keys(form).forEach(key => {
                if (key === 'profileImage') {
                    if (form.profileImage) fd.append('profileImage', form.profileImage);
                } else if (key === 'password' && editingId && !form.password) {
                    // Skip empty password when editing
                } else {
                    fd.append(key, form[key]);
                }
            });

            if (editingId) {
                await axios.put(`/api/auth/users/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Account updated successfully!');
            } else {
                await axios.post(`/api/auth/create-faculty`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
        <div className="space-y-8 pb-40">
            <AdminHeader 
                title="Faculty Registry" 
                subtitle="Manage Faculty, Coordinators, and Admin accounts." 
                icon={School}
                badge="Administration"
                actions={
                    <button
                        onClick={() => showForm ? resetForm() : setShowForm(true)}
                        className="btn-premium flex items-center gap-2 shadow-lg"
                    >
                        {showForm ? <X className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                        {showForm ? 'Cancel' : 'Add Faculty'}
                    </button>
                }
            />

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
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                                        <option value="Head of the Department">Head of the Department</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Display Order</label>
                                    <input
                                        type="number" className="input-premium"
                                        placeholder="Order (1, 2, 3...)"
                                        value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Bio / Message</label>
                                    <textarea
                                        className="input-premium h-24 resize-none"
                                        placeholder="Enter bio or message for home page"
                                        value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Profile Photo</label>
                                    <input
                                        type="file" accept="image/*"
                                        className="input-premium cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:bg-primary-50 dark:file:bg-primary-500/10 file:text-primary-700 dark:file:text-primary-400 file:font-black file:text-xs"
                                        onChange={e => setForm({ ...form, profileImage: e.target.files[0] })}
                                    />
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
                        <div className="p-16 text-center space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
                            <p className="text-slate-400 font-bold">Loading faculty accounts...</p>
                        </div>
                    ) : faculty.length === 0 ? (
                        <div className="p-20 text-center space-y-6">
                            <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto">
                                <Users className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-300">No faculty accounts found</h3>
                            <p className="text-slate-400">Add your first faculty member to get started</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#1a1d24] border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Faculty Info</th>
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Designation & Dept</th>
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Responsibility</th>
                                    <th className="px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {faculty.map((fac, idx) => (
                                    <motion.tr 
                                        key={fac._id} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="hover:bg-slate-50 dark:hover:bg-[#2a2e36] transition-colors group"
                                    >
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white font-black flex items-center justify-center text-lg shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                                    {fac?.username?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 dark:text-white">{fac.username}</span>
                                                    <span className="text-xs text-slate-400 font-bold">{fac.email}</span>
                                                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-tighter">ID: {fac.employeeId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                                                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> {fac.designation}
                                                </div>
                                                <div className="text-xs text-slate-400 font-medium">
                                                    {fac.department}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${fac.role === 'Admin' ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600' : 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-500/20'}`}>
                                                <UserCheck className="w-3 h-3" />
                                                {fac.role}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleEdit(fac)}
                                                    className="group p-3 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30"
                                                    title="Edit Account"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(fac._id)}
                                                    className={`group p-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-500/30 ${fac.role === 'Admin' ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                    title="Delete Account"
                                                    disabled={fac.role === 'Admin'}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
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
