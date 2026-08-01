import { getImageUrl } from '../utils/imageUrl';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    User, Mail, Phone, Building2, Briefcase, Save,
    Loader2, Camera, Shield, Lock, Eye, EyeOff,
    Users, Calendar, CheckCircle, Clock, XCircle, Award,
    Handshake, FileText, Star, PenTool, BadgeCheck, Tag,
    TrendingUp, Zap, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../contexts/ConfirmContext';


const TABS = ['Profile', 'My Applications', 'Security'];

const statusConfig = {
    Pending: { color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20', Icon: Clock, dot: 'bg-amber-400' },
    Approved: { color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20', Icon: CheckCircle, dot: 'bg-emerald-400' },
    Rejected: { color: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20', Icon: XCircle, dot: 'bg-red-400' }
};

const AssociationMemberProfile = () => {
    const { user, updateUser } = useAuth();
    const { confirm } = useConfirm();
    const [activeTab, setActiveTab] = useState('Profile');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [volunteerApps, setVolunteerApps] = useState([]);
    const [appsLoading, setAppsLoading] = useState(false);
    const [signatureFile, setSignatureFile] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        phone: '',
        bio: '',
        skills: '',
        registrationNumber: '',
        yearAndDept: 'I B.E. CSE',
        section: 'A',
        gender: '',
        membershipStatus: '',
        signature: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                phone: user.phone || '',
                bio: user.bio || '',
                skills: user.skills ? user.skills.join(', ') : '',
                registrationNumber: user.registrationNumber || '',
                yearAndDept: user.yearAndDept || 'I B.E. CSE',
                section: user.section || 'A',
                gender: user.gender || 'Male',
                membershipStatus: user.membershipStatus || 'Present',
                signature: user.signature || ''
            });
            if (user.signature) {
                if (user.signature.startsWith('http') || user.signature.startsWith('data:')) {
                    setSignaturePreview(user.signature);
                } else {
                    setSignaturePreview(getImageUrl(user.signature));
                }
            }
        }
    }, [user]);

    useEffect(() => {
        fetchVolunteerApps();
    }, []);

    const fetchVolunteerApps = async () => {
        setAppsLoading(true);
        try {
            const res = await axios.get(`/api/volunteers/my`);
            setVolunteerApps(res.data);
        } catch {
            toast.error('Failed to load volunteer applications');
        } finally {
            setAppsLoading(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingImage(true);
        const fd = new FormData();
        fd.append('profileImage', file);
        try {
            const response = await axios.post(`/api/auth/upload-profile`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateUser({ ...user, profileImage: response.data.profileImage });
            toast.success('Profile picture updated!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSignatureFile(file);
        setSignaturePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const fd = new FormData();
            Object.entries(formData).forEach(([k, v]) => {
                if (k !== 'signature') fd.append(k, v);
            });
            if (signatureFile) {
                fd.append('signature', signatureFile);
            } else if (formData.signature) {
                fd.append('signature', formData.signature);
            }
            const response = await axios.put(`/api/auth/profile`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateUser(response.data);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) return toast.error('Passwords do not match');
        if (passwordData.newPassword.length < 6) return toast.error('Minimum 6 characters required');
        setIsChangingPassword(true);
        try {
            await axios.put(`/api/auth/update-password`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password updated successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Password update failed');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleDownloadVolCertificate = async (appId, eventTitle) => {
        try {
            const { data } = await axios.get(`/api/certificates/volunteer-data/${appId}`);
            const { downloadCertificateAsPDF } = await import('../utils/renderCertificateCanvas');
            await downloadCertificateAsPDF(
                data.participant,
                data.event,
                data.config,
                data.registrationId,
                `Certificate_${data.registrationId}_${(eventTitle || 'Volunteer').replace(/\s+/g, '_')}.pdf`
            );
            toast.success('Certificate downloaded!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Certificate download failed');
        }
    };


    const handleWithdraw = async (appId) => {
        const confirmed = await confirm('Withdraw this application?');
        if (!confirmed) return;
        try {
            await axios.delete(`/api/volunteers/${appId}`);
            toast.success('Application withdrawn');
            fetchVolunteerApps();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to withdraw');
        }
    };

    const profileImageUrl = user?.profileImage && user.profileImage !== 'default-profile.png'
        ? getImageUrl(user.profileImage)
        : null;

    // Derived stats
    const approvedCount = volunteerApps.filter(a => a.status === 'Approved').length;
    const onDutyCount = volunteerApps.filter(a => a.onDutyIssued).length;
    const pendingCount = volunteerApps.filter(a => a.status === 'Pending').length;

    return (
        <div className="max-w-5xl mx-auto pb-24">

            {/* ─── HERO BANNER ─── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-[3rem] overflow-hidden mb-0"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #312e81 100%)' }}
            >
                {/* Animated orbital rings */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full border border-indigo-500/10"
                            style={{
                                width: `${160 + i * 100}px`, height: `${160 + i * 100}px`,
                                top: '-70px', right: '-70px',
                                transform: `translate(${i * 20}px, ${i * -12}px)`
                            }}
                        />
                    ))}
                    <div className="absolute top-8 right-16 w-2 h-2 bg-indigo-400 rounded-full animate-pulse opacity-60" />
                    <div className="absolute bottom-16 left-1/3 w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse opacity-40" />
                </div>

                <div className="relative p-10 pb-0">
                    {/* Top row */}
                    <div className="flex flex-wrap items-center gap-8 mb-8">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-indigo-500/30 shadow-2xl bg-indigo-600/30 flex items-center justify-center backdrop-blur-sm">
                                {profileImageUrl ? (
                                    <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <Handshake className="w-16 h-16 text-indigo-300" />
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-[#20242B] text-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2a2e36] transition-all shadow-xl dark:text-white">
                                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                            </label>
                        </div>

                        {/* Name / Role block */}
                        <div className="flex-1 min-w-0">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/20 rounded-full text-indigo-300 text-xs font-black uppercase tracking-widest mb-3">
                                <Shield className="w-3 h-3" /> Association Member
                            </div>
                            {/* Association role badge */}
                            <div className="mb-3">
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-500/20 border border-violet-400/30 rounded-full text-violet-300 text-xs font-black uppercase tracking-widest">
                                    <Award className="w-3.5 h-3.5" />
                                    {user?.associationRole || 'Volunteer'}
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tight truncate">{user?.username}</h1>
                            <p className="text-slate-400 font-medium mt-1">
                                {formData.registrationNumber || 'No Roll Number'} · {formData.yearAndDept} (Sec {formData.section})
                            </p>
                            {user?.email && (
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5" /> {user.email}
                                </p>
                            )}
                        </div>

                        {/* Stats block */}
                        <div className="flex gap-6 mr-2">
                            {[
                                { label: 'Applied', value: volunteerApps.length, icon: Users, color: 'text-slate-300' },
                                { label: 'Approved', value: approvedCount, icon: CheckCircle, color: 'text-emerald-400' },
                                { label: 'On-Duty', value: onDutyCount, icon: Award, color: 'text-indigo-300' },
                            ].map(stat => (
                                <div key={stat.label} className="text-center">
                                    <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                                    <p className="text-3xl font-black text-white">{stat.value}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Membership badge */}
                    {formData.membershipStatus === 'Present' && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-black">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            Active Member
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex border-t border-white/10">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <motion.div layoutId="am-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 rounded-full" />
                                )}
                                {tab === 'My Applications' && pendingCount > 0 && (
                                    <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-amber-400 text-amber-900 rounded-full text-[9px] font-black">
                                        {pendingCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ─── TAB CONTENT ─── */}
            <AnimatePresence mode="wait">

                {/* PROFILE TAB */}
                {activeTab === 'Profile' && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-[#20242B] rounded-b-[3rem] border border-t-0 border-slate-100 dark:border-slate-800 shadow-sm dark:text-white"
                    >
                        <form onSubmit={handleSubmit} className="p-10 space-y-10">

                            {/* Identity (read-only) */}
                            <div className="p-5 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl border border-slate-100 dark:border-slate-800 grid md:grid-cols-4 gap-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                    <span className="truncate">{user?.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                    <span>{formData.registrationNumber || 'No Roll Number'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                    <span>{formData.membershipStatus === 'Past' ? 'Alumni' : formData.membershipStatus + ' Member'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Award className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                    <span className="text-violet-600 dark:text-violet-400 font-black">{user?.associationRole || 'Volunteer'}</span>
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/15 rounded-xl flex items-center justify-center">
                                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Basic Information</h2>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                        <div className="relative">
                                            <User className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input type="text" name="username" className="input-premium pl-12" value={formData.username} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input type="tel" name="phone" className="input-premium pl-12" placeholder="+91 99999 00000" value={formData.phone} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Gender</label>
                                        <select name="gender" className="input-premium" value={formData.gender} onChange={handleChange}>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Membership Status</label>
                                        <select name="membershipStatus" className="input-premium" value={formData.membershipStatus} onChange={handleChange}>
                                            <option value="Present">Present Member</option>
                                            <option value="Past">Alumni</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Academic Details */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/15 rounded-xl flex items-center justify-center">
                                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Academic Details</h2>
                                </div>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Roll / Reg Number</label>
                                        <div className="relative">
                                            <Briefcase className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input type="text" name="registrationNumber" className="input-premium pl-12" placeholder="e.g. 810020104001" value={formData.registrationNumber} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Year & Department</label>
                                        <select name="yearAndDept" className="input-premium" value={formData.yearAndDept} onChange={handleChange}>
                                            <option value="I B.E. CSE">I B.E. CSE</option>
                                            <option value="II B.E. CSE">II B.E. CSE</option>
                                            <option value="III B.E. CSE">III B.E. CSE</option>
                                            <option value="IV B.E. CSE">IV B.E. CSE</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Section</label>
                                        <select name="section" className="input-premium" value={formData.section} onChange={handleChange}>
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Bio & Skills */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-violet-100 dark:bg-violet-500/15 rounded-xl flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">About & Skills</h2>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Bio <span className="font-normal normal-case tracking-normal text-slate-300">({formData.bio.length}/500)</span></label>
                                    <textarea name="bio" className="input-premium h-28 resize-none" placeholder="Describe your role in the association and what you do..." maxLength={500} value={formData.bio} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Skills & Expertise</label>
                                    <div className="relative">
                                        <Tag className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input type="text" name="skills" className="input-premium pl-12" placeholder="Leadership, Event Planning, Public Speaking (comma-separated)" value={formData.skills} onChange={handleChange} />
                                    </div>
                                    {formData.skills && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {formData.skills.split(',').map((s, i) => s.trim() && (
                                                <span key={i} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-black border border-indigo-100 dark:border-indigo-500/20">
                                                    {s.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Signature */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/15 rounded-xl flex items-center justify-center">
                                        <PenTool className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Signature</h2>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6 items-start">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Upload Signature</label>
                                        <input type="file" accept="image/*" onChange={handleSignatureUpload} className="input-premium cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-black file:text-xs" />
                                    </div>
                                    {signaturePreview && (
                                        <div className="p-4 bg-slate-50 dark:bg-[#1a1d24] border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center gap-3">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Preview</p>
                                            <img src={signaturePreview} alt="Signature preview" className="h-20 object-contain" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <button type="submit" disabled={isLoading} className="btn-premium w-full flex items-center justify-center gap-3 py-4 text-base">
                                    {isLoading
                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                                        : <><Save className="w-5 h-5" /> Save Profile</>
                                    }
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* MY APPLICATIONS TAB */}
                {activeTab === 'My Applications' && (
                    <motion.div
                        key="volunteer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-[#20242B] rounded-b-[3rem] border border-t-0 border-slate-100 dark:border-slate-800 shadow-sm dark:text-white"
                    >
                        <div className="p-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                                        <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white">Volunteer Applications</h2>
                                        <p className="text-xs text-slate-400 font-medium">Approved applications enable On-Duty letters</p>
                                    </div>
                                </div>
                                {/* Summary pills */}
                                <div className="flex gap-2">
                                    {[
                                        { label: 'Pending', count: pendingCount, color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' },
                                        { label: 'Approved', count: approvedCount, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' },
                                        { label: 'On-Duty', count: onDutyCount, color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20' },
                                    ].map(p => p.count > 0 && (
                                        <span key={p.label} className={`px-3 py-1 rounded-full text-xs font-black border ${p.color}`}>
                                            {p.count} {p.label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {appsLoading ? (
                                <div className="flex items-center justify-center py-24">
                                    <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                                </div>
                            ) : volunteerApps.length === 0 ? (
                                <div className="text-center py-24 space-y-4">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-[#1a1d24] rounded-[2rem] flex items-center justify-center mx-auto">
                                        <Handshake className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-300">No Applications Yet</h3>
                                    <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto">
                                        Apply to volunteer for events from the Events page.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {volunteerApps.map(app => {
                                        const cfg = statusConfig[app.status] || statusConfig.Pending;
                                        const { Icon } = cfg;
                                        return (
                                            <div key={app._id} className="p-6 bg-slate-50 dark:bg-[#1a1d24] hover:bg-slate-100/80 dark:hover:bg-[#20242B] rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-5 transition-colors group">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-white dark:bg-[#20242B] rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 group-hover:shadow-md transition-shadow dark:text-white">
                                                        <Calendar className="w-7 h-7 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">{app.event?.title || 'Unnamed Event'}</h3>
                                                        <p className="text-sm text-slate-400 font-bold mt-0.5">
                                                            {app.role} · {app.event?.eventDate ? new Date(app.event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBA'}
                                                        </p>
                                                        {app.motivation && (
                                                            <p className="text-xs text-slate-400 mt-1.5 italic line-clamp-1 max-w-md">"{app.motivation}"</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    {app.onDutyIssued && (
                                                        <span className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1.5 rounded-full text-xs font-black">
                                                            <Award className="w-3.5 h-3.5" /> On Duty Issued
                                                        </span>
                                                    )}
                                                    <span className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black border ${cfg.color}`}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                        {app.status}
                                                    </span>
                                                    {app.status === 'Approved' && (
                                                        <button
                                                            onClick={() => handleDownloadVolCertificate(app._id, app.event?.title)}
                                                            className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors px-3 py-1.5 rounded-xl"
                                                            title="Download your volunteer certificate"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> Certificate
                                                        </button>
                                                    )}
                                                    {app.status === 'Pending' && (
                                                        <button
                                                            onClick={() => handleWithdraw(app._id)}
                                                            className="text-xs font-black text-red-400 hover:text-red-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50"
                                                        >
                                                            Withdraw
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}


                        </div>
                    </motion.div>
                )}

                {/* SECURITY TAB */}
                {activeTab === 'Security' && (
                    <motion.div
                        key="security"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-[#20242B] rounded-b-[3rem] border border-t-0 border-slate-100 dark:border-slate-800 shadow-sm dark:text-white"
                    >
                        <form onSubmit={handlePasswordUpdate} className="p-10 space-y-8 max-w-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-rose-100 dark:bg-rose-500/15 rounded-xl flex items-center justify-center">
                                    <Lock className="w-4 h-4 text-rose-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Change Password</h2>
                                    <p className="text-xs text-slate-400 font-medium">Use at least 6 characters</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Current Password</label>
                                    <div className="relative">
                                        <input required type={showCurrentPw ? 'text' : 'password'} className="input-premium pr-14" placeholder="Enter current password"
                                            value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
                                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                                            {showCurrentPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">New Password</label>
                                    <div className="relative">
                                        <input required type={showNewPw ? 'text' : 'password'} className="input-premium pr-14" placeholder="Minimum 6 characters"
                                            value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                                        <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                                            {showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Confirm New Password</label>
                                    <input required type="password" className="input-premium" placeholder="Repeat new password"
                                        value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
                                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                        <p className="text-xs text-red-500 font-bold pl-1 flex items-center gap-1">
                                            <XCircle className="w-3.5 h-3.5" /> Passwords don't match
                                        </p>
                                    )}
                                    {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length >= 6 && (
                                        <p className="text-xs text-emerald-500 font-bold pl-1 flex items-center gap-1">
                                            <BadgeCheck className="w-3.5 h-3.5" /> Passwords match
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={isChangingPassword}
                                className="w-full py-4 bg-slate-900 dark:bg-[#1a1d24] dark:border dark:border-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-[#252930] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                {isChangingPassword
                                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Updating...</>
                                    : <><Lock className="w-5 h-5" /> Update Password</>
                                }
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssociationMemberProfile;
