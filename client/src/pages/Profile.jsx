import { getImageUrl } from '../utils/imageUrl';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    User, Mail, Phone, FileText, Tag, Building2, Camera, Save,
    Loader2, Calendar, PenTool, Lock, Eye, EyeOff,
    Shield, BookOpen, GraduationCap, BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';



const TABS = ['Personal', 'Academic / Work', 'Security'];

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('Personal');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [signatureFile, setSignatureFile] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        bio: '',
        skills: '',
        registrationNumber: '',
        dateOfBirth: '',
        signature: '',
        gender: '',
        yearAndDept: '',
        section: '',
        passoutYear: '',
        employeeId: '',
        department: '',
        designation: '',
        assignedYear: '',
        assignedSection: '',
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
                email: user.email || '',
                phone: user.phone || '',
                bio: user.bio || '',
                skills: user.skills ? user.skills.join(', ') : '',
                registrationNumber: user.registrationNumber || '',
                dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
                signature: user.signature || '',
                gender: user.gender || 'Male',
                yearAndDept: user.yearAndDept || 'I B.E. CSE',
                section: user.section !== undefined ? user.section : 'A',
                passoutYear: user.passoutYear || '',
                employeeId: user.employeeId || '',
                department: user.department || '',
                designation: user.designation || '',
                assignedYear: user.assignedYear || 'I',
                assignedSection: user.assignedSection || 'A',
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingImage(true);
        const fd = new FormData();
        fd.append('profileImage', file);
        try {
            const response = await axios.post(`/api/auth/upload-profile`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
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
            fd.append('username', formData.username);
            fd.append('phone', formData.phone);
            fd.append('bio', formData.bio);
            fd.append('skills', formData.skills);
            fd.append('registrationNumber', formData.registrationNumber);
            fd.append('dateOfBirth', formData.dateOfBirth);
            fd.append('gender', formData.gender);
            fd.append('yearAndDept', formData.yearAndDept);
            fd.append('section', formData.section);
            fd.append('passoutYear', formData.passoutYear);
            fd.append('employeeId', formData.employeeId);
            fd.append('department', formData.department);
            fd.append('designation', formData.designation);
            fd.append('assignedYear', formData.assignedYear);
            fd.append('assignedSection', formData.assignedSection);
            if (signatureFile) {
                fd.append('signature', signatureFile);
            } else if (formData.signature) {
                fd.append('signature', formData.signature);
            }
            const response = await axios.put(`/api/auth/profile`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
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
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error('New passwords do not match');
        }
        if (passwordData.newPassword.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }
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

    const isStudent = !user?.role || user.role === 'Participant' || user.role === 'Association Member' || user.role === 'Volunteer';
    const profileImageUrl = user?.profileImage && user.profileImage !== 'default-profile.png'
        ? getImageUrl(user.profileImage)
        : null;

    // Extract department from user's yearAndDept to filter options
    const userDepartment = user?.yearAndDept?.split(' ').slice(2).join(' ') || 'CSE';
    const departmentOptions = [
        'CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'IT', 'AI&DS', 'Mechatronics', 'AIML(CSE)', 'ACT', 'VLSI', 'CYBER(CSE)'
    ];
    const filteredYearDeptOptions = ['I', 'II', 'III', 'IV'].map(year => `${year} B.E. ${userDepartment}`);

    const roleColors = {
        'Admin': 'from-rose-500 to-orange-500',
        'Association Member': 'from-indigo-500 to-blue-600',
        'Participant': 'from-emerald-500 to-teal-600',
        'Volunteer': 'from-amber-500 to-orange-500',
    };
    const gradientClass = roleColors[user?.role] || 'from-slate-600 to-slate-900';

    return (
        <div className="max-w-5xl mx-auto space-y-0 pb-24">

            {/* ─── HERO BANNER ─── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-[3rem] overflow-hidden mb-0"
            >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-90`} />
                {/* Decorative circles */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full border border-white/10"
                            style={{
                                width: `${150 + i * 100}px`, height: `${150 + i * 100}px`,
                                top: '-60px', right: '-60px',
                                transform: `translate(${i * 25}px, ${i * -15}px)`
                            }}
                        />
                    ))}
                </div>

                <div className="relative p-6 md:p-10 pb-0">
                    {/* Top row */}
                    <div className="flex flex-col items-center justify-center text-center gap-6 mb-0">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0 mx-auto">
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2.5rem] overflow-hidden border-4 border-white/20 shadow-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm dark:text-white mx-auto">
                                {profileImageUrl ? (
                                    <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-black text-5xl">{user?.username?.[0]?.toUpperCase()}</span>
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-[#20242B] text-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2a2e36] transition-all shadow-xl dark:text-white">
                                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImage} />
                            </label>
                        </div>

                        {/* Name / Role */}
                        <div className="flex-1 min-w-0">
                            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-white/15 rounded-full text-white/80 text-xs font-black uppercase tracking-widest mb-3 border border-white/20 backdrop-blur-sm">
                                <BadgeCheck className="w-3 h-3" /> {user?.role || 'Member'}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight truncate max-w-[280px] sm:max-w-md mx-auto">{user?.username}</h1>
                            <p className="text-white/60 font-medium mt-1 truncate max-w-[280px] sm:max-w-md mx-auto">{user?.email}</p>
                        </div>

                        {/* Quick info pills */}
                        <div className="flex flex-wrap justify-center gap-2 md:gap-3 w-full">
                            {isStudent && user?.registrationNumber && (
                                <div className="px-3 md:px-4 py-2 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm dark:text-white">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Reg. No</p>
                                    <p className="text-xs md:text-sm font-black text-white">{user.registrationNumber}</p>
                                </div>
                            )}
                            {isStudent && user?.yearAndDept && (
                                <div className="px-3 md:px-4 py-2 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm dark:text-white">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Year &amp; Dept</p>
                                    <p className="text-xs md:text-sm font-black text-white">{user.yearAndDept}</p>
                                </div>
                            )}
                            {isStudent && user?.section && (
                                <div className="px-3 md:px-4 py-2 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm dark:text-white">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Section</p>
                                    <p className="text-xs md:text-sm font-black text-white">{user.section}</p>
                                </div>
                            )}
                            {isStudent && user?.passoutYear && (
                                <div className="px-3 md:px-4 py-2 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm dark:text-white">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Passout Year</p>
                                    <p className="text-xs md:text-sm font-black text-white">{user.passoutYear}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-t border-white/10 mt-6 md:mt-8 overflow-x-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-4 md:py-5 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap px-2 ${activeTab === tab ? 'text-white border-b-2 border-white' : 'text-white/40 hover:text-white/70'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ─── TAB CONTENT ─── */}
            <AnimatePresence mode="wait">

                {/* PERSONAL TAB */}
                {activeTab === 'Personal' && (
                    <motion.div
                        key="personal"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-[#20242B] rounded-b-[3rem] border border-t-0 border-slate-100 dark:border-slate-800 shadow-sm dark:text-white"
                    >
                        <form onSubmit={handleSubmit} className="p-10 space-y-10">
                            {/* Section: Identity */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-500/15 rounded-xl flex items-center justify-center">

                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Basic Information</h2>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                        <div className="relative">

                                            <input type="text" name="username" className="input-premium pl-12" value={formData.username} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                        <div className="relative">

                                            <input type="email" name="email" className="input-premium pl-12 bg-slate-50 dark:bg-[#1a1d24] cursor-not-allowed" value={formData.email} disabled />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                                        <div className="relative">

                                            <input type="tel" name="phone" className="input-premium pl-12" placeholder="+91 99999 00000" value={formData.phone} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Date of Birth</label>
                                        <div className="relative">

                                            <input type="date" name="dateOfBirth" className="input-premium pl-12" value={formData.dateOfBirth} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Bio & Skills */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/15 rounded-xl flex items-center justify-center">

                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">About You</h2>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Bio <span className="text-slate-300 font-medium normal-case tracking-normal">({formData.bio.length}/500)</span></label>
                                    <textarea
                                        name="bio"
                                        className="input-premium h-32 resize-none"
                                        placeholder="Tell us about yourself..."
                                        maxLength={500}
                                        value={formData.bio}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Skills</label>
                                    <div className="relative">

                                        <input
                                            type="text"
                                            name="skills"
                                            className="input-premium pl-12"
                                            placeholder="JavaScript, React, Python (comma separated)"
                                            value={formData.skills}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    {formData.skills && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {formData.skills.split(',').map((s, i) => s.trim() && (
                                                <span key={i} className="px-3 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 rounded-full text-xs font-black border border-primary-100 dark:border-primary-500/20">
                                                    {s.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section: Signature */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-violet-100 dark:bg-violet-500/15 rounded-xl flex items-center justify-center">

                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Signature</h2>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6 items-start">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Upload Signature</label>
                                        <input
                                            type="file"
                                            accept=".png,image/png"
                                            onChange={handleSignatureUpload}
                                            className="input-premium cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:bg-primary-50 dark:file:bg-primary-500/10 file:text-primary-700 dark:file:text-primary-400 file:font-black file:text-xs"
                                        />
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-1 leading-relaxed">
                                            Only <span className="font-black text-primary-600 dark:text-primary-400">.png</span> files are allowed for the signature upload. If your signature has a background or is in another format,{' '}
                                            <a
                                                href="https://www.remove.bg/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-black text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                            >
                                                click here
                                            </a>{' '}
                                            to remove the background and convert it to .png format before uploading.
                                        </p>
                                    </div>
                                    {signaturePreview && (
                                        <div className="p-4 bg-slate-50 dark:bg-[#1a1d24] border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center gap-3">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Preview</p>
                                            <img src={signaturePreview} alt="Signature" className="h-20 object-contain" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-premium w-full flex items-center justify-center gap-3 py-4 text-base"
                                >
                                    {isLoading
                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving Changes...</>
                                        : <><Save className="w-5 h-5" /> Save Personal Information</>
                                    }
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* ACADEMIC / WORK TAB */}
                {activeTab === 'Academic / Work' && (
                    <motion.div
                        key="academic"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-[#20242B] rounded-b-[3rem] border border-t-0 border-slate-100 dark:border-slate-800 shadow-sm dark:text-white"
                    >
                        <form onSubmit={handleSubmit} className="p-10 space-y-10">
                            {isStudent ? (
                                <>
                                    {/* Student Academic Fields */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/15 rounded-xl flex items-center justify-center">

                                            </div>
                                            <h2 className="text-lg font-black text-slate-900 dark:text-white">Academic Details</h2>
                                        </div>
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Registration Number</label>
                                                <div className="relative">

                                                    <input type="text" name="registrationNumber" className="input-premium pl-12" placeholder="e.g. 21CS101" value={formData.registrationNumber} onChange={handleChange} />
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
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Class Section</label>
                                                <select name="section" className="input-premium disabled:opacity-50 disabled:cursor-not-allowed" value={formData.section} onChange={handleChange} disabled>
                                                    <option value="A">Section A</option>
                                                    <option value="B">Section B</option>
                                                    <option value="C">Section C</option>
                                                    <option value="None">None</option>
                                                    <option value="">None</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Year & Department</label>
                                            <select name="yearAndDept" className="input-premium" value={formData.yearAndDept} onChange={handleChange}>
                                                {filteredYearDeptOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Passout Year</label>
                                            <input
                                                type="number"
                                                name="passoutYear"
                                                className="input-premium"
                                                placeholder="e.g., 2026"
                                                value={formData.passoutYear}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Staff / Coordinator Fields */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/15 rounded-xl flex items-center justify-center">

                                            </div>
                                            <h2 className="text-lg font-black text-slate-900 dark:text-white">Professional Details</h2>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Identity (Read-only)</p>
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">

                                                <span>{user?.employeeId || 'No Employee ID assigned'}</span>
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Designation</label>
                                                <input type="text" name="designation" className="input-premium disabled:opacity-50 disabled:cursor-not-allowed" placeholder="e.g. Assistant Professor" value={formData.designation} onChange={handleChange} disabled={user?.role !== 'Admin'} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Department</label>
                                                <input type="text" name="department" className="input-premium disabled:opacity-50 disabled:cursor-not-allowed" value={formData.department} onChange={handleChange} disabled={user?.role !== 'Admin'} />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-premium w-full flex items-center justify-center gap-3 py-4 text-base"
                                >
                                    {isLoading
                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                                        : <><Save className="w-5 h-5" /> Save Academic Details</>
                                    }
                                </button>
                            </div>
                        </form>
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
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-rose-100 dark:bg-rose-500/15 rounded-xl flex items-center justify-center">
                                        <Lock className="w-4 h-4 text-rose-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white">Change Password</h2>
                                        <p className="text-xs text-slate-400 font-medium">Use a strong password with at least 6 characters</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Current Password</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type={showCurrentPw ? 'text' : 'password'}
                                            className="input-premium pr-14"
                                            placeholder="Enter current password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        />
                                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                                            {showCurrentPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type={showNewPw ? 'text' : 'password'}
                                            className="input-premium pr-14"
                                            placeholder="Minimum 6 characters"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        />
                                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                                            {showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Confirm New Password</label>
                                    <input
                                        required
                                        type="password"
                                        className="input-premium"
                                        placeholder="Repeat new password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    />
                                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                        <p className="text-xs text-red-500 font-bold pl-1">Passwords don't match</p>
                                    )}
                                    {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword.length >= 6 && (
                                        <p className="text-xs text-emerald-500 font-bold pl-1 flex items-center gap-1">
                                            <BadgeCheck className="w-3.5 h-3.5" /> Passwords match
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isChangingPassword}
                                className="w-full py-4 bg-slate-900 dark:bg-[#1a1d24] dark:border dark:border-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-[#252930] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
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

export default Profile;
