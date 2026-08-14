import { getImageUrl } from '../../utils/imageUrl';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, CheckCircle, XCircle, Clock,
    ChevronDown, ChevronUp, User, Search,
    Plus, Filter, Award, Send, MessageSquare, Edit2, Trash2, Download, FileSpreadsheet, ChevronRight, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';


const ManageNominations = () => {
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const [nominations, setNominations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNomination, setSelectedNomination] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        postAppliedFor: '',
        personalInfo: { name: '', gender: '', dateOfBirth: '', rollNumber: '', year: '', section: '' },
        academicProficiency: { tenthPercentage: '', diplomaPercentage: '', cgpa: '', noOfArrears: '' },
        contributions: { academic: '', coCurricular: '', extracurricular: '', otherNotable: '' }
    });
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const exportRef = useRef(null);

    const [settings, setSettings] = useState({ disabledDefaultFields: [], customDefaultLabels: {} });

    useEffect(() => {
        fetchNominations();
        fetchSettings();
    }, []);

    const fetchNominations = async () => {
        try {
            const res = await axios.get(`/api/nominations`);
            setNominations(res.data);
        } catch (error) {
            toast.error('Failed to load nominations');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`/api/settings`);
            setSettings({
                ...res.data,
                disabledDefaultFields: res.data.disabledDefaultFields || [],
                customDefaultLabels: res.data.customDefaultLabels || {}
            });
        } catch (error) {
            toast.error('Failed to load settings');
        }
    };

    const handleApprove = async (id) => {
        if (!remarks) {
            toast.error('Please add remarks before approving');
            return;
        }

        try {
            const res = await axios.put(`/api/nominations/${id}/approve`, {
                status: 'Approved',
                remarks
            });
            toast.success('Nomination approved and moved to next stage');
            setNominations(nominations.map(n => n._id === id ? res.data : n));
            setSelectedNomination(res.data);
            setRemarks('');
        } catch (error) {
            toast.error('Approval failed');
        }
    };

    const handleReject = async (id) => {
        if (!remarks) {
            toast.error('Please add remarks before rejecting');
            return;
        }

        try {
            const res = await axios.put(`/api/nominations/${id}/approve`, {
                status: 'Rejected',
                remarks
            });
            toast.success('Nomination rejected');
            setNominations(nominations.map(n => n._id === id ? res.data : n));
            setSelectedNomination(res.data);
            setRemarks('');
        } catch (error) {
            toast.error('Rejection failed');
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm('Are you sure you want to delete this nomination?');
        if (!confirmed) return;
        try {
            await axios.delete(`/api/nominations/${id}`);
            toast.success('Nomination deleted successfully');
            setNominations(nominations.filter(n => n._id !== id));
            setSelectedNomination(null);
            setIsEditing(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    const handleDownloadXLSX = async (id) => {
        try {
            const res = await axios.get(`/api/nominations/${id}/xlsx`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Nomination_${id}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('XLSX downloaded');
        } catch (error) {
            toast.error('Failed to download XLSX');
        }
    };
    const handleDownloadPDF = async (id) => {
        try {
            const res = await axios.get(`/api/nominations/${id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Nomination_${id}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('PDF downloaded');
        } catch (error) {
            toast.error('Failed to download PDF');
        }
    };
    const startEdit = () => {
        setEditData({
            postAppliedFor: selectedNomination?.postAppliedFor || '',
            personalInfo: {
                name: selectedNomination?.personalInfo?.name || '',
                gender: selectedNomination?.personalInfo?.gender || '',
                dateOfBirth: selectedNomination?.personalInfo?.dateOfBirth || '',
                rollNumber: selectedNomination?.personalInfo?.rollNumber || '',
                year: selectedNomination?.personalInfo?.year || '',
                section: selectedNomination?.personalInfo?.section || ''
            },
            academicProficiency: {
                tenthPercentage: selectedNomination?.academicProficiency?.tenthPercentage || '',
                diplomaPercentage: selectedNomination?.academicProficiency?.diplomaPercentage || '',
                cgpa: selectedNomination?.academicProficiency?.cgpa || '',
                noOfArrears: selectedNomination?.academicProficiency?.noOfArrears || ''
            },
            contributions: {
                academic: selectedNomination?.contributions?.academic || '',
                coCurricular: selectedNomination?.contributions?.coCurricular || '',
                extracurricular: selectedNomination?.contributions?.extracurricular || '',
                otherNotable: selectedNomination?.contributions?.otherNotable || ''
            }
        });
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditData({
            postAppliedFor: '',
            personalInfo: { name: '', gender: '', dateOfBirth: '', rollNumber: '', year: '', section: '' },
            academicProficiency: { tenthPercentage: '', diplomaPercentage: '', cgpa: '', noOfArrears: '' },
            contributions: { academic: '', coCurricular: '', extracurricular: '', otherNotable: '' }
        });
    };

    const saveEdit = async () => {
        try {
            const res = await axios.put(`/api/nominations/${selectedNomination._id}`, editData);
            toast.success('Nomination updated');
            setNominations(nominations.map(n => n._id === selectedNomination._id ? res.data : n));
            setSelectedNomination(res.data);
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update nomination');
        }
    };

    const filteredNominations = nominations.filter(n => {
        const matchesStatus = filterStatus === 'All' || n.status === filterStatus;
        const matchesSearch = n.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.postAppliedFor?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleDownloadAll = async (format) => {
        if (nominations.length === 0) {
            toast.error('No nominations to download');
            return;
        }
        setIsExporting(true);
        setShowExportMenu(false);
        try {
            const endpoint = format === 'pdf'
                ? `/api/nominations/export/pdf`
                : `/api/nominations/export/xlsx`;
            const mimeType = format === 'pdf'
                ? 'application/pdf'
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            const filename = format === 'pdf' ? 'All_Nominations.pdf' : 'All_Nominations.xlsx';

            const res = await axios.get(endpoint, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }));
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(`Nominations exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error(`Failed to export as ${format.toUpperCase()}`);
        } finally {
            setIsExporting(false);
        }
    };

    // Close export menu on outside click
    useEffect(() => {
        const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="space-y-8 pb-40">
            <div className="flex items-center gap-2 mb-[-1rem]">
                <Link to="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
            </div>
            <div className="bg-white dark:bg-[#20242B] p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-6 dark:text-white">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-primary-100 rounded-3xl flex items-center justify-center text-primary-700 dark:text-primary-300">
                        <Award className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Nomination Review</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium italic">Multi-stage approval workflow</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Export Dropdown */}
                    <div className="relative" ref={exportRef}>
                        <button
                            onClick={() => setShowExportMenu(v => !v)}
                            disabled={isExporting}
                            className="btn-premium flex items-center gap-2 pr-3"
                            title="Export Nominations"
                        >
                            {isExporting ? (
                                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isExporting ? 'Exporting...' : 'Export List'}
                            <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#20242B] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/60 z-50 overflow-hidden dark:text-white"
                                >
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => handleDownloadAll('pdf')}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors text-left group"
                                        >
                                            <div className="w-8 h-8 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors">
                                                <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-red-700">Export as PDF</p>
                                                <p className="text-[10px] text-slate-400">All fields, all candidates</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleDownloadAll('xlsx')}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-left group"
                                        >
                                            <div className="w-8 h-8 bg-emerald-100 group-hover:bg-emerald-200 rounded-lg flex items-center justify-center transition-colors">
                                                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-700">Export as XLSX</p>
                                                <p className="text-[10px] text-slate-400">Spreadsheet with all data</p>
                                            </div>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search names..."
                            className="input-premium pl-12 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="input-premium"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending Admin">Admin Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Nomination List */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Nominations ({filteredNominations.length})</h2>
                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50 dark:bg-[#1a1d24] rounded-3xl animate-pulse" />)
                        ) : filteredNominations.length === 0 ? (
                            <div className="bg-white dark:bg-[#20242B] p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 text-center dark:text-white">
                                <p className="text-slate-400 font-bold">No nominations found</p>
                            </div>
                        ) : (
                            filteredNominations.map(n => (
                                <motion.button
                                    key={n._id}
                                    whileHover={{ x: 5 }}
                                    onClick={() => { setSelectedNomination(n); setIsEditing(false); }}
                                    className={`w-full text-left p-6 rounded-[2.5rem] border transition-all ${selectedNomination?._id === n._id ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-200' : 'bg-white border-slate-100 dark:border-slate-800 hover:border-primary-200'}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <p className="font-black text-lg">{n.postAppliedFor}</p>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${n.status.includes('Approved') ? 'bg-emerald-500/20 text-emerald-500' : n.status.includes('Rejected') ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                            {n.status.replace('Pending ', '')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${selectedNomination?._id === n._id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {n?.user?.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{n.user?.username}</p>
                                            <p className={`text-xs ${selectedNomination?._id === n._id ? 'text-slate-400' : 'text-slate-400'}`}>
                                                {n.user?.yearAndDept} • {n.user?.section}
                                            </p>
                                        </div>
                                    </div>
                                </motion.button>
                            ))
                        )}
                    </div>
                </div>

                {/* Nomination Detail */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {!selectedNomination ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white dark:bg-[#20242B] rounded-[3rem] border border-slate-100 dark:border-slate-800 p-24 text-center space-y-6 dark:text-white"
                            >
                                <div className="w-20 h-20 bg-slate-50 dark:bg-[#1a1d24] rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto">
                                    <FileText className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-300">Select a nomination to review</h3>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={selectedNomination._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-[#20242B] rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden dark:text-white"
                            >
                                {/* Detail Header */}
                                <div className="bg-slate-900 p-10 text-white flex flex-wrap justify-between items-center gap-6">
                                    <div className="flex items-center gap-6">
                                        {/* Candidate Photo */}
                                        <div className="flex-shrink-0">
                                            {selectedNomination.candidatePhoto ? (
                                                <img
                                                    src={getImageUrl(selectedNomination.candidatePhoto)}
                                                    alt={`${selectedNomination.personalInfo?.name || 'Candidate'} Photo`}
                                                    className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-700 shadow-lg"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                                                    <User className="w-9 h-9 text-slate-500 dark:text-slate-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="input-premium bg-slate-800 text-white border-slate-700 text-2xl font-black mb-2"
                                                    value={editData.postAppliedFor}
                                                    onChange={(e) => setEditData({ ...editData, postAppliedFor: e.target.value })}
                                                />
                                            ) : (
                                                <h2 className="text-3xl font-black">{selectedNomination.postAppliedFor}</h2>
                                            )}
                                            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs mt-2">Candidate: {selectedNomination.user?.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Current Status</p>
                                            <p className="text-xl font-black text-primary-400">{selectedNomination.status}</p>
                                        </div>
                                        <div className="flex items-center gap-3 border-l border-slate-700 pl-6">
                                            <button onClick={() => handleDownloadPDF(selectedNomination._id)} className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all" title="Download PDF">
                                                <Download className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDownloadXLSX(selectedNomination._id)} className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all ml-2" title="Download XLSX">
                                                <FileSpreadsheet className="w-5 h-5" />
                                            </button>
                                            {isEditing ? (
                                                <>
                                                    <button onClick={cancelEdit} className="p-2 bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest px-4">
                                                        Cancel
                                                    </button>
                                                    <button onClick={saveEdit} className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest px-4">
                                                        Save
                                                    </button>
                                                </>
                                            ) : (
                                                user?.role === 'Admin' && (
                                                    <button onClick={startEdit} className="p-2 bg-slate-800 text-slate-300 hover:text-primary-400 rounded-xl transition-all" title="Edit Nomination">
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                )
                                            )}
                                            {user?.role === 'Admin' && !isEditing && (
                                                <button onClick={() => handleDelete(selectedNomination._id)} className="p-2 bg-slate-800 text-slate-300 hover:text-red-400 rounded-xl transition-all" title="Delete Nomination">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 space-y-10">
                                    {/* Personal & Academic Info */}
                                    <div className="grid grid-cols-2 gap-10">
                                        {!['name', 'rollNumber', 'gender', 'dateOfBirth', 'year', 'section'].every(k => settings.disabledDefaultFields?.includes(k)) && (
                                            <div className="space-y-6">
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                                    <User className="w-4 h-4" /> Personal Information
                                                </h3>
                                                <div className="space-y-4">
                                                    {!settings.disabledDefaultFields?.includes('name') && (
                                                        <div className="flex justify-between items-center text-sm gap-2">
                                                            <span className="text-slate-400 font-bold">{settings.customDefaultLabels?.name || 'Name'}</span>
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text" className="input-premium text-right text-sm py-1 px-3" style={{ maxWidth: '160px' }}
                                                                        value={editData.personalInfo?.name || ''}
                                                                        onChange={(e) => setEditData({ ...editData, personalInfo: { ...editData.personalInfo, name: e.target.value } })}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditData({ ...editData, personalInfo: { ...editData.personalInfo, name: '' } })}
                                                                        className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wider"
                                                                        title="Clear/Delete field value"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-900 dark:text-white font-black">{selectedNomination.personalInfo?.name || 'N/A'}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!settings.disabledDefaultFields?.includes('rollNumber') && (
                                                        <div className="flex justify-between items-center text-sm gap-2">
                                                            <span className="text-slate-400 font-bold">{settings.customDefaultLabels?.rollNumber || 'Roll Number'}</span>
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text" className="input-premium text-right text-sm py-1 px-3" style={{ maxWidth: '160px' }}
                                                                        value={editData.personalInfo?.rollNumber || ''}
                                                                        onChange={(e) => setEditData({ ...editData, personalInfo: { ...editData.personalInfo, rollNumber: e.target.value } })}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditData({ ...editData, personalInfo: { ...editData.personalInfo, rollNumber: '' } })}
                                                                        className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wider"
                                                                        title="Clear/Delete field value"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-900 dark:text-white font-black">{selectedNomination.personalInfo?.rollNumber || 'N/A'}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!settings.disabledDefaultFields?.includes('gender') && (
                                                        <div className="flex justify-between items-center text-sm gap-2">
                                                            <span className="text-slate-400 font-bold">{settings.customDefaultLabels?.gender || 'Gender'}</span>
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-2">
                                                                    <select
                                                                        className="input-premium text-sm py-1 px-3" style={{ maxWidth: '160px' }}
                                                                        value={editData.personalInfo?.gender || ''}
                                                                        onChange={(e) => setEditData({ ...editData, personalInfo: { ...editData.personalInfo, gender: e.target.value } })}
                                                                    >
                                                                        <option value="">Select</option>
                                                                        <option value="Male">Male</option>
                                                                        <option value="Female">Female</option>
                                                                        <option value="Other">Other</option>
                                                                    </select>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditData({ ...editData, personalInfo: { ...editData.personalInfo, gender: '' } })}
                                                                        className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wider"
                                                                        title="Clear/Delete field value"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-900 dark:text-white font-black">{selectedNomination.personalInfo?.gender || 'N/A'}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!settings.disabledDefaultFields?.includes('dateOfBirth') && (
                                                        <div className="flex justify-between items-center text-sm gap-2">
                                                            <span className="text-slate-400 font-bold">{settings.customDefaultLabels?.dateOfBirth || 'Date of Birth'}</span>
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="date" className="input-premium text-sm py-1 px-3" style={{ maxWidth: '180px' }}
                                                                        value={editData.personalInfo?.dateOfBirth || ''}
                                                                        onChange={(e) => setEditData({ ...editData, personalInfo: { ...editData.personalInfo, dateOfBirth: e.target.value } })}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditData({ ...editData, personalInfo: { ...editData.personalInfo, dateOfBirth: '' } })}
                                                                        className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wider"
                                                                        title="Clear/Delete field value"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-900 dark:text-white font-black">{selectedNomination.personalInfo?.dateOfBirth || 'N/A'}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!settings.disabledDefaultFields?.includes('year') && (
                                                        <div className="flex justify-between items-center text-sm gap-2">
                                                            <span className="text-slate-400 font-bold">{settings.customDefaultLabels?.year || 'Year'}</span>
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text" className="input-premium text-right text-sm py-1 px-3" style={{ maxWidth: '160px' }}
                                                                        value={editData.personalInfo?.year || ''}
                                                                        onChange={(e) => setEditData({ ...editData, personalInfo: { ...editData.personalInfo, year: e.target.value } })}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditData({ ...editData, personalInfo: { ...editData.personalInfo, year: '' } })}
                                                                        className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wider"
                                                                        title="Clear/Delete field value"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-900 dark:text-white font-black">{selectedNomination.personalInfo?.year || 'N/A'}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!settings.disabledDefaultFields?.includes('section') && (
                                                        <div className="flex justify-between items-center text-sm gap-2">
                                                            <span className="text-slate-400 font-bold">{settings.customDefaultLabels?.section || 'Section'}</span>
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text" className="input-premium text-right text-sm py-1 px-3" style={{ maxWidth: '160px' }}
                                                                        value={editData.personalInfo?.section || ''}
                                                                        onChange={(e) => setEditData({ ...editData, personalInfo: { ...editData.personalInfo, section: e.target.value } })}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditData({ ...editData, personalInfo: { ...editData.personalInfo, section: '' } })}
                                                                        className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wider"
                                                                        title="Clear/Delete field value"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-900 dark:text-white font-black">{selectedNomination.personalInfo?.section || 'N/A'}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {!['tenthPercentage', 'diplomaPercentage', 'cgpa', 'noOfArrears'].every(k => settings.disabledDefaultFields?.includes(k)) && (
                                            <div className="space-y-6">
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4" /> Academic Proficiency
                                                </h3>
                                                <div className="space-y-4">
                                                    {!settings.disabledDefaultFields?.includes('tenthPercentage') && (
                                                        <div className="flex justify-between items-center text-sm gap-2">
                                                            <span className="text-slate-400 font-bold">{settings.customDefaultLabels?.tenthPercentage || '10th %'}</span>
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text" className="input-premium text-right text-sm py-1 px-3" style={{ maxWidth: '120px' }}
                                                                        value={editData.academicProficiency?.tenthPercentage || ''}
                                                                        onChange={(e) => setEditData({ ...editData, academicProficiency: { ...editData.academicProficiency, tenthPercentage: e.target.value } })}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditData({ ...editData, academicProficiency: { ...editData.academicProficiency, tenthPercentage: '' } })}
                                                                        className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wider"
                                                                        title="Clear/Delete field value"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-primary-600 dark:text-primary-400 font-black">{selectedNomination.academicProficiency?.tenthPercentage || 'N/A'}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!settings.disabledDefaultFields?.includes('diplomaPercentage') && (
                                                        <div className="flex justify-between items-center text-sm gap-2">
                                                            <span className="text-slate-400 font-bold">{settings.customDefaultLabels?.diplomaPercentage || 'Diploma / XII %'}</span>
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text" className="input-premium text-right text-sm py-1 px-3" style={{ maxWidth: '120px' }}
                                                                        value={editData.academicProficiency?.diplomaPercentage || ''}
                                                                        onChange={(e) => setEditData({ ...editData, academicProficiency: { ...editData.academicProficiency, diplomaPercentage: e.target.value } })}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditData({ ...editData, academicProficiency: { ...editData.academicProficiency, diplomaPercentage: '' } })}
                                                                        className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wider"
                                                                        title="Clear/Delete field value"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-primary-600 dark:text-primary-400 font-black">{selectedNomination.academicProficiency?.diplomaPercentage || 'N/A'}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!settings.disabledDefaultFields?.includes('cgpa') && (
                                                        <div className="flex justify-between items-center text-sm gap-2">
                                                            <span className="text-slate-400 font-bold">{settings.customDefaultLabels?.cgpa || 'CGPA'}</span>
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text" className="input-premium text-right text-sm py-1 px-3" style={{ maxWidth: '120px' }}
                                                                        value={editData.academicProficiency?.cgpa || ''}
                                                                        onChange={(e) => setEditData({ ...editData, academicProficiency: { ...editData.academicProficiency, cgpa: e.target.value } })}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditData({ ...editData, academicProficiency: { ...editData.academicProficiency, cgpa: '' } })}
                                                                        className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wider"
                                                                        title="Clear/Delete field value"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-primary-600 dark:text-primary-400 font-black">{selectedNomination.academicProficiency?.cgpa || 'N/A'}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {!settings.disabledDefaultFields?.includes('noOfArrears') && (
                                                        <div className="flex justify-between items-center text-sm gap-2">
                                                            <span className="text-slate-400 font-bold">{settings.customDefaultLabels?.noOfArrears || 'No. of Arrears'}</span>
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number" className="input-premium text-right text-sm py-1 px-3" style={{ maxWidth: '120px' }} min="0"
                                                                        value={editData.academicProficiency?.noOfArrears || ''}
                                                                        onChange={(e) => setEditData({ ...editData, academicProficiency: { ...editData.academicProficiency, noOfArrears: e.target.value } })}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditData({ ...editData, academicProficiency: { ...editData.academicProficiency, noOfArrears: '' } })}
                                                                        className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase tracking-wider"
                                                                        title="Clear/Delete field value"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-black">{selectedNomination.academicProficiency?.noOfArrears || 0}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Previous Positions */}
                                    <div className="bg-slate-50 dark:bg-[#1a1d24] rounded-[2rem] p-8 space-y-6 border border-slate-100 dark:border-slate-800">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Award className="w-4 h-4 text-primary-500" /> Previous Positions Held
                                        </h3>
                                        <div className="space-y-4">
                                            {selectedNomination.previousPositions?.length > 0 ? (
                                                selectedNomination.previousPositions.map((pos, idx) => (
                                                    <div key={idx} className="bg-white dark:bg-[#20242B] p-4 rounded-2xl border border-slate-200 dark:border-slate-700 grid md:grid-cols-3 gap-4 dark:text-white">
                                                        <div>
                                                            <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest">Body</span>
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{pos.nameOfBody}</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest">Position</span>
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{pos.position}</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest">Period</span>
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{pos.period}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-slate-500 dark:text-slate-400 italic text-sm">No previous positions declared.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contributions */}
                                    <div className="bg-slate-50 dark:bg-[#1a1d24] rounded-[2rem] p-8 space-y-6 border border-slate-100 dark:border-slate-800">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4 text-primary-500" /> Contributions & Achievements
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="bg-white dark:bg-[#20242B] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 dark:text-white">
                                                <span className="block text-xs text-primary-600 dark:text-primary-400 font-black uppercase tracking-widest">1. Academic</span>
                                                {isEditing ? (
                                                    <textarea
                                                        className="input-premium w-full min-h-[100px]"
                                                        value={editData.contributions?.academic}
                                                        onChange={(e) => setEditData({ ...editData, contributions: { ...editData.contributions, academic: e.target.value } })}
                                                    />
                                                ) : (
                                                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedNomination.contributions?.academic || 'N/A'}</p>
                                                )}
                                            </div>
                                            <div className="bg-white dark:bg-[#20242B] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 dark:text-white">
                                                <span className="block text-xs text-primary-600 dark:text-primary-400 font-black uppercase tracking-widest">2. Co-Curricular</span>
                                                {isEditing ? (
                                                    <textarea
                                                        className="input-premium w-full min-h-[100px]"
                                                        value={editData.contributions?.coCurricular}
                                                        onChange={(e) => setEditData({ ...editData, contributions: { ...editData.contributions, coCurricular: e.target.value } })}
                                                    />
                                                ) : (
                                                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedNomination.contributions?.coCurricular || 'N/A'}</p>
                                                )}
                                            </div>
                                            <div className="bg-white dark:bg-[#20242B] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 dark:text-white">
                                                <span className="block text-xs text-primary-600 dark:text-primary-400 font-black uppercase tracking-widest">3. Extracurricular</span>
                                                {isEditing ? (
                                                    <textarea
                                                        className="input-premium w-full min-h-[100px]"
                                                        value={editData.contributions?.extracurricular}
                                                        onChange={(e) => setEditData({ ...editData, contributions: { ...editData.contributions, extracurricular: e.target.value } })}
                                                    />
                                                ) : (
                                                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedNomination.contributions?.extracurricular || 'N/A'}</p>
                                                )}
                                            </div>
                                            <div className="bg-white dark:bg-[#20242B] p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 dark:text-white">
                                                <span className="block text-xs text-primary-600 dark:text-primary-400 font-black uppercase tracking-widest">4. Notable Contributions</span>
                                                {isEditing ? (
                                                    <textarea
                                                        className="input-premium w-full min-h-[100px]"
                                                        value={editData.contributions?.otherNotable}
                                                        onChange={(e) => setEditData({ ...editData, contributions: { ...editData.contributions, otherNotable: e.target.value } })}
                                                    />
                                                ) : (
                                                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedNomination.contributions?.otherNotable || 'N/A'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Approval History */}
                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                            <Clock className="w-4 h-4" /> Approval Timeline
                                        </h3>
                                        <div className="space-y-4">
                                            {selectedNomination.approvalHistory.length === 0 ? (
                                                <p className="text-sm text-slate-400 pl-4 py-4 border-l-2 border-dashed border-slate-200 dark:border-slate-700">No approval history yet.</p>
                                            ) : (
                                                selectedNomination.approvalHistory.map((history, i) => (
                                                    <div key={i} className="flex gap-6 relative">
                                                        {i !== selectedNomination.approvalHistory.length - 1 && (
                                                            <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-slate-100 dark:bg-[#20242B]" />
                                                        )}
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${history.status === 'Approved' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                                            {history.status === 'Approved' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                                        </div>
                                                        <div className="flex-1 bg-white dark:bg-[#20242B] p-6 rounded-3xl border border-slate-50 shadow-sm dark:text-white">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-black text-slate-900 dark:text-white">{history.stage}</p>
                                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">By {history.approvedBy?.username || 'System'}</p>
                                                                </div>
                                                                <span className="text-[10px] text-slate-300 font-black">{new Date(history.updatedAt).toLocaleString()}</span>
                                                            </div>
                                                            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-[#1a1d24] p-4 rounded-2xl italic">"{history.remarks || 'No remarks provided.'}"</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Decision Area */}
                                    {selectedNomination.status !== 'Approved' && selectedNomination.status !== 'Rejected' && (
                                        (user?.role === 'Admin' && selectedNomination.status === 'Pending Admin') ||
                                        (user?.role === 'Class Coordinator' && selectedNomination.status === 'Pending Class Coordinator') ||
                                        (user?.role === 'Program Coordinator' && selectedNomination.status === 'Pending Program Coordinator')
                                    ) && (
                                            <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-6">
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Your Decision</h3>
                                                <textarea
                                                    className="input-premium w-full min-h-[120px] p-6 text-sm"
                                                    placeholder="Add your remarks or reasons for approval/rejection..."
                                                    value={remarks}
                                                    onChange={(e) => setRemarks(e.target.value)}
                                                />
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => handleReject(selectedNomination._id)}
                                                        className="flex-1 py-4 border-2 border-red-500 text-red-500 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3"
                                                    >
                                                        <XCircle className="w-6 h-6" /> Reject Nomination
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(selectedNomination._id)}
                                                        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-100"
                                                    >
                                                        <CheckCircle className="w-6 h-6" /> Approve Nomination
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ManageNominations;
