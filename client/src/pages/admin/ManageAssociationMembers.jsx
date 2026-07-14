import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    UserPlus, Users, Mail, Lock,
    Loader2, ShieldCheck,
    ArrowLeft, User, Phone, Hash, GraduationCap, School,
    CheckCircle, History, RefreshCcw, Edit2, Trash2, X, Save, Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../../contexts/ConfirmContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ManageAssociationMembers = () => {
    const { confirm } = useConfirm();
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [activeTab, setActiveTab] = useState('Present'); // 'Present' or 'Past'
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        registrationNumber: '',
        phone: '',
        gender: 'Male',
        yearAndDept: 'I B.E. CSE',
        section: 'A',
        membershipStatus: 'Present',
        associationRole: '',
        role: 'Association Member'
    });
    const [showForm, setShowForm] = useState(false);

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`/api/auth/users`);
            const roles = ['Association Member'];
            setMembers(res.data.filter(u => roles.includes(u.role)));
        } catch (error) {
            toast.error('Failed to load association members');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchMembers(); }, []);

    const handleDownloadPDF = (filterType = 'All') => {
        let membersToExport = members;
        if (filterType === 'Present') {
            membersToExport = members.filter(m => m.membershipStatus === 'Present');
        } else if (filterType === 'Past') {
            membersToExport = members.filter(m => m.membershipStatus === 'Past');
        }

        if (membersToExport.length === 0) {
            toast.error(`No ${filterType === 'Past' ? 'Alumni' : filterType} members found to download.`);
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

        // Header bar
        doc.setFillColor(30, 41, 59); // slate-900
        doc.rect(0, 0, pageW, 22, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        let title = 'ASSOCIATION MEMBER DIRECTORY';
        if (filterType === 'Present') title = 'PRESENT ASSOCIATION MEMBERS';
        if (filterType === 'Past') title = 'ALUMNI ASSOCIATION MEMBERS';
        doc.text(title, pageW / 2, 10, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on ${today}`, pageW / 2, 17, { align: 'center' });

        // Sub-header chips
        const presentCount = membersToExport.filter(m => m.membershipStatus === 'Present').length;
        const pastCount = membersToExport.filter(m => m.membershipStatus === 'Past').length;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(`Total Exported: ${membersToExport.length}   |   Present: ${presentCount}   |   Alumni: ${pastCount}`, pageW / 2, 30, { align: 'center' });

        const tableData = membersToExport.map((m, idx) => [
            idx + 1,
            m.username || '-',
            m.email || '-',
            m.registrationNumber || '-',
            m.associationRole || '-',
            m.phone || '-',
            m.gender || '-',
            m.yearAndDept || '-',
            `Sec ${m.section || '-'}`,
            m.membershipStatus === 'Past' ? 'Alumni' : (m.membershipStatus || '-')
        ]);

        autoTable(doc, {
            head: [['#', 'Name', 'Email', 'Roll No.', 'Role', 'Phone', 'Gender', 'Year & Dept', 'Section', 'Status']],
            body: tableData,
            startY: 35,
            styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                8: { halign: 'center' }
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 8) {
                    const status = data.cell.raw;
                    if (status === 'Present') {
                        doc.setTextColor(5, 150, 105);
                    } else {
                        doc.setTextColor(100, 116, 139);
                    }
                }
            }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text(`Page ${i} of ${pageCount}  |  Association Member Directory  |  Confidential`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
        }

        doc.save(`Association_Members_${filterType}_${new Date().toISOString().slice(0, 10)}.pdf`);
        toast.success(`${filterType} Members PDF downloaded successfully!`);
    };

    const resetForm = () => {
        setForm({
            username: '', email: '', password: '',
            registrationNumber: '', phone: '', gender: 'Male',
            yearAndDept: 'I B.E. CSE', section: 'A', membershipStatus: 'Present',
            associationRole: '',
            role: 'Association Member'
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (member) => {
        setEditingId(member._id);
        setForm({
            username: member.username,
            email: member.email,
            password: '', // leave empty for security
            registrationNumber: member.registrationNumber || '',
            phone: member.phone || '',
            gender: member.gender || 'Male',
            yearAndDept: member.yearAndDept || 'I B.E. CSE',
            section: member.section || 'A',
            membershipStatus: member.membershipStatus || 'Present',
            associationRole: member.associationRole || '',
            role: member.role
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm('Delete this member account?');
        if (!confirmed) return;
        try {
            await axios.delete(`/api/auth/users/${id}`);
            toast.success('Member deleted');
            fetchMembers();
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            if (editingId) {
                // If password is empty, don't send it
                const updateData = { ...form };
                if (!updateData.password) delete updateData.password;
                await axios.put(`/api/auth/users/${editingId}`, updateData);
                toast.success('Member updated successfully!');
            } else {
                await axios.post(`/api/auth/create-association-member`, form);
                toast.success(`Member account created for ${form.username}!`);
            }
            resetForm();
            fetchMembers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setIsCreating(false);
        }
    };

    const toggleMemberStatus = async (memberId, currentStatus) => {
        const nextStatus = currentStatus === 'Present' ? 'Past' : 'Present';
        try {
            await axios.put(`/api/auth/member-status/${memberId}`, { membershipStatus: nextStatus });
            toast.success(`Status updated to ${nextStatus}`);
            fetchMembers();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleMoveAllToPast = async () => {
        const confirmed = await confirm('Are you sure you want to move ALL present members to the Alumni section?');
        if (!confirmed) return;
        try {
            const res = await axios.put(`/api/auth/move-all-past`);
            toast.success(res.data.message || 'All members moved to Alumni');
            fetchMembers();
            setActiveTab('Past');
        } catch (error) {
            toast.error('Failed to move members to Alumni');
        }
    };

    const filteredMembers = members.filter(m => m.membershipStatus === activeTab);

    return (
        <div className="space-y-12 pb-40">
            <div className="flex flex-wrap justify-between items-end gap-6">
                <div className="space-y-4">
                    <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Association <span className="text-reveal">Network.</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-md">
                        Manage student association member accounts.
                    </p>
                </div>
                <button
                    onClick={() => showForm ? resetForm() : setShowForm(true)}
                    className="btn-premium flex items-center gap-3"
                >
                    {showForm ? <X className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
                    {showForm ? 'Cancel' : 'Add Member'}
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
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8">{editingId ? 'Edit Member' : 'New Association Member'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                    <div className="relative">

                                        <input
                                            type="text" className="input-premium pl-14"
                                            placeholder="Member Name" required
                                            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Email</label>
                                    <div className="relative">

                                        <input
                                            type="email" className="input-premium pl-14"
                                            placeholder="member@domain.com" required
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
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Roll Number</label>
                                    <div className="relative">

                                        <input
                                            type="text" className="input-premium pl-14"
                                            placeholder="Roll No" required
                                            value={form.registrationNumber} onChange={e => setForm({ ...form, registrationNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                                    <div className="relative">

                                        <input
                                            type="text" className="input-premium pl-14"
                                            placeholder="Phone Number" required
                                            value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Gender</label>
                                    <select
                                        className="input-premium"
                                        value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Year and Dept</label>
                                    <select
                                        className="input-premium"
                                        value={form.yearAndDept} onChange={e => setForm({ ...form, yearAndDept: e.target.value })}
                                    >
                                        <option value="I B.E. CSE">I B.E. CSE</option>
                                        <option value="II B.E. CSE">II B.E. CSE</option>
                                        <option value="III B.E. CSE">III B.E. CSE</option>
                                        <option value="IV B.E. CSE">IV B.E. CSE</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Section</label>
                                    <select
                                        className="input-premium"
                                        value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}
                                    >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Membership Status</label>
                                    <select
                                        className="input-premium"
                                        value={form.membershipStatus} onChange={e => setForm({ ...form, membershipStatus: e.target.value })}
                                    >
                                        <option value="Present">Present</option>
                                        <option value="Past">Alumni</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Association Role</label>
                                    <select
                                        className="input-premium"
                                        value={form.associationRole} onChange={e => setForm({ ...form, associationRole: e.target.value })}
                                    >
                                        <option value="">Select Role</option>
                                        <option value="President">President</option>
                                        <option value="Secretary">Secretary</option>
                                        <option value="General Secretary">General Secretary</option>
                                        <option value="Treasurer">Treasurer</option>
                                        <option value="Vice – President">Vice – President</option>
                                        <option value="Joint Secretary">Joint Secretary</option>
                                        <option value="Technical Coordinator">Technical Coordinator</option>
                                        <option value="Event Coordinator">Event Coordinator</option>
                                        <option value="Media & Social Media Coordinator">Media & Social Media Coordinator</option>
                                        <option value="Photography & Design Coordinator">Photography & Design Coordinator</option>
                                        <option value="Chief Editor & Head of Digitimes">Chief Editor & Head of Digitimes</option>
                                        <option value="Digitimes Incharge">Digitimes Incharge</option>
                                        <option value="Byte Bulletin Incharge">Byte Bulletin Incharge</option>
                                        <option value="Digitimes Magazine Team">Digitimes Magazine Team</option>
                                        <option value="Executive Members">Executive Members</option>
                                        <option value="Documentation Incharge">Documentation Incharge</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={resetForm} className="px-8 py-3 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-[#2a2e36] transition-all">Cancel</button>
                                <button type="submit" disabled={isCreating} className="btn-premium flex items-center gap-3 py-3 px-10">
                                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? <Save className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                    {isCreating ? 'Saving...' : editingId ? 'Update Member' : 'Create Member'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white dark:bg-[#20242B] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden dark:text-white">
                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-50 space-y-4 md:space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Member Directory</h2>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4">
                            <button
                                onClick={handleMoveAllToPast}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-black hover:bg-amber-200 transition-all"
                            >
                                <History className="w-4 h-4" /> Move All to Alumni
                            </button>
                            <div className="flex bg-slate-900 text-white rounded-xl overflow-hidden text-xs font-black shadow-sm">
                                <button
                                    onClick={() => handleDownloadPDF('Present')}
                                    disabled={members.length === 0}
                                    className="px-4 py-2 hover:bg-slate-700 transition-all border-r border-slate-700 flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Download className="w-3.5 h-3.5" /> Present PDF
                                </button>
                                <button
                                    onClick={() => handleDownloadPDF('Past')}
                                    disabled={members.length === 0}
                                    className="px-4 py-2 hover:bg-slate-700 transition-all border-r border-slate-700 flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Download className="w-3.5 h-3.5" /> Alumni PDF
                                </button>
                                <button
                                    onClick={() => handleDownloadPDF('All')}
                                    disabled={members.length === 0}
                                    className="px-4 py-2 hover:bg-slate-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Download className="w-3.5 h-3.5" /> All PDF
                                </button>
                            </div>
                            <div className="flex bg-slate-50 dark:bg-[#1a1d24] p-1.5 rounded-2xl gap-2">
                                <button
                                    onClick={() => setActiveTab('Present')}
                                    className={`px-4 md:px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Present' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'} dark:text-white`}
                                >
                                    Present
                                </button>
                                <button
                                    onClick={() => setActiveTab('Past')}
                                    className={`px-4 md:px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Past' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-400 hover:text-slate-600'} dark:text-white`}
                                >
                                    Alumni
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-0">
                    {isLoading ? (
                        <div className="p-16 text-center">
                            <Loader2 className="w-10 h-10 animate-spin text-slate-200 mx-auto" />
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="p-20 text-center space-y-6">
                            <Users className="w-16 h-16 text-slate-100 mx-auto" />
                            <h3 className="text-2xl font-black text-slate-300">No members found</h3>
                        </div>
                    ) : (
                        <table className="w-full text-left min-w-[640px]">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Member Info</th>
                                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Academic</th>
                                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredMembers.map(member => (
                                    <tr key={member._id} className="hover:bg-slate-50 dark:hover:bg-[#2a2e36] transition-colors group border-b border-slate-50 dark:border-slate-800/50">
                                        <td className="px-6 md:px-10 py-4 md:py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl font-black flex items-center justify-center text-lg ${member.membershipStatus === 'Present' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {member?.username?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 dark:text-white">{member.username}</span>
                                                    <span className="text-xs text-slate-400 font-bold">{member.email}</span>
                                                    {member.associationRole && (
                                                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded w-fit">
                                                            {member.associationRole}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-10 py-4 md:py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    <GraduationCap className="w-3.5 h-3.5" /> {member.yearAndDept}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                                    <School className="w-3.5 h-3.5" /> Section {member.section}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-10 py-4 md:py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${member.membershipStatus === 'Present' ? 'bg-emerald-50 text-emerald-600 dark:text-emerald-400 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                {member.membershipStatus === 'Present' ? <CheckCircle className="w-3 h-3" /> : <History className="w-3 h-3" />}
                                                {member.membershipStatus === 'Past' ? 'Alumni' : member.membershipStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 md:px-10 py-4 md:py-6">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleMemberStatus(member._id, member.membershipStatus)}
                                                    className="p-3 text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-800 dark:text-white"
                                                    title={`Move to ${member.membershipStatus === 'Present' ? 'Alumni' : 'Present'}`}
                                                >
                                                    <RefreshCcw className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(member)}
                                                    className="p-3 text-slate-600 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-800 dark:text-white"
                                                    title="Edit Member"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(member._id)}
                                                    className="p-3 text-red-600 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-800 dark:text-white"
                                                    title="Delete Member"
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

export default ManageAssociationMembers;
