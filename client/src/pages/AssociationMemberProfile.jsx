import { getImageUrl } from '../utils/imageUrl';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { downloadCertificateAsPDF } from '../utils/renderCertificateCanvas';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    User, Mail, Phone, Building2, Briefcase, Save,
    Loader2, Camera, Shield, Lock, Eye, EyeOff,
    Users, Calendar, CheckCircle, Clock, XCircle, Award,
    Handshake, Star, PenTool, BadgeCheck, Tag,
    Zap, Download, ArrowRight, Sparkles, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../contexts/ConfirmContext';
import { Navigate } from 'react-router-dom';
import StudentHeader from '../components/layout/StudentHeader';

const TABS = ['Profile', 'My Applications', 'Security'];

const statusConfig = {
    Pending: { color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20', Icon: Clock, dot: 'bg-amber-400', glow: 'shadow-amber-500/20' },
    Approved: { color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20', Icon: CheckCircle, dot: 'bg-emerald-400', glow: 'shadow-emerald-500/20' },
    Rejected: { color: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20', Icon: XCircle, dot: 'bg-red-400', glow: 'shadow-red-500/20' }
};

const StatCard = ({ icon: Icon, label, value, color }) => (
    <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        className="flex flex-col items-center gap-2 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 min-w-[90px]"
    >
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-3xl font-black text-white leading-none">{value}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{label}</span>
    </motion.div>
);

const FormField = ({ label, icon: Icon, children }) => (
    <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
        </label>
        {children}
    </div>
);

const AssociationMemberProfile = () => {
    const { user, updateUser } = useAuth();
    const { confirm } = useConfirm();

    if (user && user.role !== 'Association Member') {
        return <Navigate to="/profile" replace />;
    }

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

    useEffect(() => { fetchVolunteerApps(); }, []);

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

    const approvedCount = volunteerApps.filter(a => a.status === 'Approved').length;
    const onDutyCount = volunteerApps.filter(a => a.onDutyIssued).length;
    const pendingCount = volunteerApps.filter(a => a.status === 'Pending').length;
    const skillsList = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-0">
            <StudentHeader
                title="My Profile"
                subtitle={`${user?.username} · Association Member · ${user?.associationRole || 'Volunteer'}`}
                icon={Handshake}
                showHero={false}
            />

            {/* ─── PREMIUM HERO BANNER ─── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative rounded-[2.5rem] overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #312e81 80%, #4c1d95 100%)' }}
            >
                {/* Animated ambient blobs */}
                <motion.div
                    animate={{ scale: [1, 1.3, 1], x: [0, 40, 0], y: [0, -20, 0] }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-32 -left-24 w-[500px] h-[500px] bg-violet-600 rounded-full filter blur-[120px] opacity-25 pointer-events-none"
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], x: [0, -30, 0], y: [0, 30, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute -bottom-24 -right-16 w-[400px] h-[400px] bg-indigo-500 rounded-full filter blur-[100px] opacity-20 pointer-events-none"
                />

                {/* Orbital rings */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                            transition={{ duration: 30 + i * 10, repeat: Infinity, ease: 'linear' }}
                            className="absolute rounded-full border border-white/[0.04]"
                            style={{
                                width: `${200 + i * 120}px`,
                                height: `${200 + i * 120}px`,
                                top: '-100px',
                                right: '-100px',
                            }}
                        />
                    ))}
                    {/* Shimmer dots */}
                    <div className="absolute top-8 right-20 w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse opacity-70" />
                    <div className="absolute bottom-16 left-1/3 w-1 h-1 bg-indigo-300 rounded-full animate-pulse opacity-50" />
                    <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-purple-300 rounded-full animate-pulse opacity-40" />
                </div>

                {/* Shiny horizontal line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative p-8 md:p-10 pb-0">
                    {/* Top row: Avatar + Info + Stats */}
                    <div className="flex flex-col lg:flex-row items-start gap-8 mb-8">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="relative w-28 h-28 md:w-32 md:h-32"
                            >
                                <div className="w-full h-full rounded-[2rem] overflow-hidden border-2 border-white/20 shadow-2xl bg-indigo-600/30 flex items-center justify-center backdrop-blur-sm">
                                    {profileImageUrl ? (
                                        <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white font-black text-5xl select-none">
                                            {user?.username?.[0]?.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                {/* Glow ring */}
                                <div className="absolute inset-0 rounded-[2rem] ring-2 ring-violet-500/40 ring-offset-4 ring-offset-transparent pointer-events-none" />
                                {/* Upload button */}
                                <label className="absolute -bottom-2 -right-2 w-9 h-9 bg-white dark:bg-[#20242B] text-slate-900 dark:text-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-xl border border-white/20">
                                    {uploadingImage
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <Camera className="w-3.5 h-3.5" />}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                                </label>
                            </motion.div>
                        </div>

                        {/* Name & Role block */}
                        <div className="flex-1 min-w-0">
                            {/* Badges row */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/25 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                                    <Shield className="w-3 h-3" /> Association Member
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/20 border border-violet-400/25 rounded-full text-violet-300 text-[10px] font-black uppercase tracking-widest">
                                    <Award className="w-3 h-3" /> {user?.associationRole || 'Volunteer'}
                                </span>
                                {formData.membershipStatus === 'Present' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-400/20 rounded-full text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                                        <motion.div
                                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                                        />
                                        Active Member
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight truncate mb-1">
                                {user?.username}
                            </h1>
                            <p className="text-slate-400 font-medium text-sm flex flex-wrap items-center gap-3">
                                {user?.email && (
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" /> {user.email}
                                    </span>
                                )}
                                {formData.registrationNumber && (
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5" /> {formData.registrationNumber}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5" /> {formData.yearAndDept} (Sec {formData.section})
                                </span>
                            </p>

                            {/* Skills preview */}
                            {skillsList.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {skillsList.slice(0, 5).map((skill, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-white/8 border border-white/10 rounded-full text-white/70 text-[10px] font-bold">
                                            {skill}
                                        </span>
                                    ))}
                                    {skillsList.length > 5 && (
                                        <span className="px-2.5 py-1 bg-white/8 border border-white/10 rounded-full text-white/40 text-[10px] font-bold">
                                            +{skillsList.length - 5}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-3 shrink-0">
                            <StatCard icon={Users} label="Applied" value={volunteerApps.length} color="text-slate-300" />
                            <StatCard icon={CheckCircle} label="Approved" value={approvedCount} color="text-emerald-400" />
                            <StatCard icon={Award} label="On-Duty" value={onDutyCount} color="text-violet-300" />
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div className="flex border-t border-white/[0.08]">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all relative flex items-center justify-center gap-2 ${
                                    activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {tab}
                                {tab === 'My Applications' && pendingCount > 0 && (
                                    <span className="inline-flex items-center justify-center w-4 h-4 bg-amber-400 text-amber-900 rounded-full text-[9px] font-black">
                                        {pendingCount}
                                    </span>
                                )}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="am-tab-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ─── TAB CONTENT ─── */}
            <AnimatePresence mode="wait">

                {/* ─── PROFILE TAB ─── */}
                {activeTab === 'Profile' && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-6 mt-6">

                            {/* Identity read-only strip */}
                            <div className="flex flex-wrap items-center gap-4 px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                    <Mail className="w-4 h-4 text-slate-400" /> {user?.email}
                                </div>
                                <div className="w-px h-4 bg-slate-200 dark:bg-white/10" />
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                    <Building2 className="w-4 h-4 text-slate-400" /> {formData.registrationNumber || 'No Roll Number'}
                                </div>
                                <div className="w-px h-4 bg-slate-200 dark:bg-white/10" />
                                <div className="flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-400">
                                    <Award className="w-4 h-4" /> {user?.associationRole || 'Volunteer'}
                                </div>
                                <div className="w-px h-4 bg-slate-200 dark:bg-white/10" />
                                <div className={`flex items-center gap-1.5 text-sm font-bold ${formData.membershipStatus === 'Present' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                    <Star className="w-4 h-4" />
                                    {formData.membershipStatus === 'Past' ? 'Alumni' : 'Active Member'}
                                </div>
                            </div>

                            {/* Card: Basic Info */}
                            <div className="bg-white dark:bg-[#20242B] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02]">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center">
                                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Basic Information</h2>
                                        <p className="text-xs text-slate-400 font-medium">Your personal details</p>
                                    </div>
                                </div>
                                <div className="p-8 grid md:grid-cols-2 gap-6">
                                    <FormField label="Full Name" icon={User}>
                                        <div className="relative">
                                            <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="text"
                                                name="username"
                                                className="input-premium pl-11 w-full"
                                                value={formData.username}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </FormField>
                                    <FormField label="Phone Number" icon={Phone}>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                className="input-premium pl-11 w-full"
                                                placeholder="+91 99999 00000"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </FormField>
                                    <FormField label="Gender">
                                        <select name="gender" className="input-premium w-full" value={formData.gender} onChange={handleChange}>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Membership Status">
                                        <select name="membershipStatus" className="input-premium w-full" value={formData.membershipStatus} onChange={handleChange}>
                                            <option value="Present">Present Member</option>
                                            <option value="Past">Alumni</option>
                                        </select>
                                    </FormField>
                                </div>
                            </div>

                            {/* Card: Academic Details */}
                            <div className="bg-white dark:bg-[#20242B] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02]">
                                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Academic Details</h2>
                                        <p className="text-xs text-slate-400 font-medium">Your college information</p>
                                    </div>
                                </div>
                                <div className="p-8 grid md:grid-cols-3 gap-6">
                                    <FormField label="Roll / Reg Number" icon={Briefcase}>
                                        <div className="relative">
                                            <Briefcase className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="text"
                                                name="registrationNumber"
                                                className="input-premium pl-11 w-full"
                                                placeholder="e.g. 810020104001"
                                                value={formData.registrationNumber}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </FormField>
                                    <FormField label="Year & Department">
                                        <select name="yearAndDept" className="input-premium w-full" value={formData.yearAndDept} onChange={handleChange}>
                                            <option value="I B.E. CSE">I B.E. CSE</option>
                                            <option value="II B.E. CSE">II B.E. CSE</option>
                                            <option value="III B.E. CSE">III B.E. CSE</option>
                                            <option value="IV B.E. CSE">IV B.E. CSE</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Section">
                                        <select name="section" className="input-premium w-full" value={formData.section} onChange={handleChange}>
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                        </select>
                                    </FormField>
                                </div>
                            </div>

                            {/* Card: Bio & Skills */}
                            <div className="bg-white dark:bg-[#20242B] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02]">
                                    <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">About & Skills</h2>
                                        <p className="text-xs text-slate-400 font-medium">Tell others about yourself</p>
                                    </div>
                                </div>
                                <div className="p-8 space-y-6">
                                    <FormField label={`Bio (${formData.bio.length}/500)`}>
                                        <textarea
                                            name="bio"
                                            className="input-premium w-full h-28 resize-none"
                                            placeholder="Describe your role in the association and what you bring to the team..."
                                            maxLength={500}
                                            value={formData.bio}
                                            onChange={handleChange}
                                        />
                                    </FormField>
                                    <FormField label="Skills & Expertise" icon={Tag}>
                                        <div className="relative">
                                            <Tag className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="text"
                                                name="skills"
                                                className="input-premium pl-11 w-full"
                                                placeholder="Leadership, Event Planning, Public Speaking (comma-separated)"
                                                value={formData.skills}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        {skillsList.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {skillsList.map((s, i) => (
                                                    <motion.span
                                                        key={i}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-black border border-indigo-100 dark:border-indigo-500/20"
                                                    >
                                                        {s}
                                                    </motion.span>
                                                ))}
                                            </div>
                                        )}
                                    </FormField>
                                </div>
                            </div>

                            {/* Card: Signature */}
                            <div className="bg-white dark:bg-[#20242B] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02]">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                                        <PenTool className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Digital Signature</h2>
                                        <p className="text-xs text-slate-400 font-medium">Used on official documents & certificates</p>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="grid md:grid-cols-2 gap-6 items-start">
                                        <FormField label="Upload Signature Image">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleSignatureUpload}
                                                className="input-premium w-full cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 dark:file:bg-indigo-500/10 file:text-indigo-700 dark:file:text-indigo-300 file:font-black file:text-xs"
                                            />
                                        </FormField>
                                        {signaturePreview && (
                                            <div className="p-5 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.07] rounded-2xl flex flex-col items-center gap-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signature Preview</p>
                                                <img src={signaturePreview} alt="Signature preview" className="h-16 object-contain opacity-80" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Save button */}
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-5 btn-premium flex items-center justify-center gap-3 text-base font-black disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isLoading
                                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving Changes...</>
                                    : <><Save className="w-5 h-5" /> Save Profile</>
                                }
                            </motion.button>
                        </form>
                    </motion.div>
                )}

                {/* ─── MY APPLICATIONS TAB ─── */}
                {activeTab === 'My Applications' && (
                    <motion.div
                        key="applications"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 space-y-6"
                    >
                        {/* Summary stats bar */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Pending', count: pendingCount, icon: Clock, bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
                                { label: 'Approved', count: approvedCount, icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
                                { label: 'On-Duty Issued', count: onDutyCount, icon: Award, bg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' },
                            ].map(({ label, count, icon: Icon, bg, text }) => (
                                <div key={label} className={`flex items-center gap-4 p-5 rounded-2xl border ${bg}`}>
                                    <Icon className={`w-6 h-6 ${text}`} />
                                    <div>
                                        <p className={`text-2xl font-black ${text}`}>{count}</p>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Applications list */}
                        {appsLoading ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                            </div>
                        ) : volunteerApps.length === 0 ? (
                            <div className="bg-white dark:bg-[#20242B] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-20 text-center space-y-5">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-[#1a1d24] rounded-[2rem] flex items-center justify-center mx-auto">
                                    <Handshake className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-black text-slate-300">No Applications Yet</h3>
                                <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto">
                                    Apply to volunteer for events from the Events page and your applications will appear here.
                                </p>
                                <a href="/events" className="inline-flex items-center gap-2 btn-premium px-8 py-3">
                                    Browse Events <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {volunteerApps.map((app, idx) => {
                                    const cfg = statusConfig[app.status] || statusConfig.Pending;
                                    const { Icon } = cfg;
                                    return (
                                        <motion.div
                                            key={app._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group bg-white dark:bg-[#20242B] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300 overflow-hidden"
                                        >
                                            {/* Status accent bar */}
                                            <div className={`h-1 w-full ${app.status === 'Approved' ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : app.status === 'Rejected' ? 'bg-gradient-to-r from-red-400 to-rose-400' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} />

                                            <div className="p-7 flex flex-col md:flex-row items-start justify-between gap-6">
                                                {/* Left: Event info */}
                                                <div className="flex items-start gap-5 flex-1 min-w-0">
                                                    <div className="w-14 h-14 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shrink-0 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/30 transition-colors">
                                                        <Calendar className="w-6 h-6 text-indigo-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight truncate">
                                                            {app.event?.title || 'Unnamed Event'}
                                                        </h3>
                                                        <p className="text-sm text-slate-400 font-bold mt-0.5">
                                                            {app.role} · {app.event?.eventDate
                                                                ? new Date(app.event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                                : 'Date TBA'}
                                                        </p>
                                                        {app.motivation && (
                                                            <p className="text-xs text-slate-400 mt-2 italic line-clamp-1">
                                                                "{app.motivation}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right: Actions & Status */}
                                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                                    {app.onDutyIssued && (
                                                        <span className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs font-black">
                                                            <BadgeCheck className="w-3.5 h-3.5" /> On-Duty Issued
                                                        </span>
                                                    )}

                                                    <span className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black border ${cfg.color}`}>
                                                        <Icon className="w-3.5 h-3.5" /> {app.status}
                                                    </span>

                                                    {app.status === 'Approved' && (
                                                        <button
                                                            onClick={() => handleDownloadVolCertificate(app._id, app.event?.title)}
                                                            className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all px-3 py-1.5 rounded-xl"
                                                        >
                                                            <Download className="w-3.5 h-3.5" /> Certificate
                                                        </button>
                                                    )}

                                                    {app.status === 'Pending' && (
                                                        <button
                                                            onClick={() => handleWithdraw(app._id)}
                                                            className="text-xs font-black text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10"
                                                        >
                                                            Withdraw
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ─── SECURITY TAB ─── */}
                {activeTab === 'Security' && (
                    <motion.div
                        key="security"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6"
                    >
                        <div className="bg-white dark:bg-[#20242B] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            {/* Section header */}
                            <div className="flex items-center gap-3 px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02]">
                                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-rose-500" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Account Security</h2>
                                    <p className="text-xs text-slate-400 font-medium">Change your login password</p>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordUpdate} className="p-8 space-y-6 max-w-lg">
                                {/* Current password */}
                                <FormField label="Current Password" icon={Lock}>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            required
                                            type={showCurrentPw ? 'text' : 'password'}
                                            className="input-premium pl-11 pr-12 w-full"
                                            placeholder="Enter current password"
                                            value={passwordData.currentPassword}
                                            onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPw(!showCurrentPw)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                        >
                                            {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </FormField>

                                {/* New password */}
                                <FormField label="New Password" icon={Lock}>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            required
                                            type={showNewPw ? 'text' : 'password'}
                                            className="input-premium pl-11 pr-12 w-full"
                                            placeholder="Minimum 6 characters"
                                            value={passwordData.newPassword}
                                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPw(!showNewPw)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                        >
                                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </FormField>

                                {/* Confirm password */}
                                <FormField label="Confirm New Password" icon={Lock}>
                                    <input
                                        required
                                        type="password"
                                        className="input-premium w-full"
                                        placeholder="Repeat new password"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    />
                                    <AnimatePresence>
                                        {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                className="text-xs text-red-500 font-bold pl-1 flex items-center gap-1 mt-1"
                                            >
                                                <XCircle className="w-3.5 h-3.5" /> Passwords don't match
                                            </motion.p>
                                        )}
                                        {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length >= 6 && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                className="text-xs text-emerald-500 font-bold pl-1 flex items-center gap-1 mt-1"
                                            >
                                                <BadgeCheck className="w-3.5 h-3.5" /> Passwords match
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </FormField>

                                <motion.button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    whileHover={{ scale: isChangingPassword ? 1 : 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-4 bg-slate-900 dark:bg-white/5 dark:border dark:border-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-700 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isChangingPassword
                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Updating Password...</>
                                        : <><Lock className="w-5 h-5" /> Update Password</>
                                    }
                                </motion.button>
                            </form>
                        </div>

                        {/* Security tips */}
                        <div className="mt-4 p-6 bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-100 dark:border-amber-500/20 rounded-2xl">
                            <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" /> Security Tips
                            </p>
                            <ul className="space-y-1.5">
                                {[
                                    'Use at least 8 characters with a mix of letters, numbers & symbols',
                                    'Avoid using your name, email or registration number as your password',
                                    'Use a unique password not used on any other site',
                                ].map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 font-medium">
                                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssociationMemberProfile;
