import { getImageUrl } from '../utils/imageUrl';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
    Send, Award, User, BookOpen, 
    CheckCircle, AlertCircle, FileText,
    ArrowRight, Loader2, Sparkles, Camera, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const NominationSubmission = () => {
    const { user } = useAuth();
    const [forms, setForms] = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [settings, setSettings] = useState({ nominationFormsEnabled: true });
    const [candidatePhoto, setCandidatePhoto] = useState('');
    const [photoPreview, setPhotoPreview] = useState('');
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [formData, setFormData] = useState({
        postAppliedFor: '',
        personalInfo: { name: '', year: '', section: '', gender: '', dateOfBirth: '', rollNumber: '' },
        academicProficiency: { tenthPercentage: '', diplomaPercentage: '', cgpa: '', noOfArrears: '' },
        previousPositions: [{ nameOfBody: '', position: '', period: '' }],
        contributions: { academic: '', coCurricular: '', extracurricular: '', otherNotable: '' },
        customFields: {}
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [settingsRes, formsRes] = await Promise.all([
                    axios.get(`/api/settings`),
                    axios.get(`/api/nominations/forms`)
                ]);
                setSettings(settingsRes.data);
                setForms(formsRes.data.filter(f => f.isActive));
            } catch (error) {
                toast.error('Failed to load data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFormSelect = (form) => {
        setSelectedForm(form);
        setFormData({
            ...formData,
            postAppliedFor: form.title,
            personalInfo: {
                name: user?.username || '',
                year: user?.yearAndDept || '',
                section: user?.section || '',
                gender: user?.gender || '',
                dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                rollNumber: user?.registrationNumber || ''
            },
            customFields: [
                ...form.fields,
                ...(settings.defaultQuestionFields || []),
                ...(settings.additionalDetailsFields || [])
            ].reduce((acc, field) => {
                acc[field.label] = '';
                return acc;
            }, {})
        });
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('photo', file);

        setIsUploadingPhoto(true);
        try {
            const res = await axios.post(`/api/nominations/upload-photo`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setCandidatePhoto(res.data.filename);
            setPhotoPreview(getImageUrl(res.data.filename));
            toast.success('Photo uploaded successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload photo');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post(`/api/nominations`, {
                ...formData,
                candidatePhoto,
                form: selectedForm._id
            });
            toast.success('Nomination submitted successfully!');
            setSelectedForm(null);
            setCandidatePhoto('');
            setPhotoPreview('');
            // Reset all form fields to initial state
            setFormData({
                postAppliedFor: '',
                personalInfo: { name: '', year: '', section: '', gender: '', dateOfBirth: '', rollNumber: '' },
                academicProficiency: { tenthPercentage: '', diplomaPercentage: '', cgpa: '', noOfArrears: '' },
                previousPositions: [{ nameOfBody: '', position: '', period: '' }],
                contributions: { academic: '', coCurricular: '', extracurricular: '', otherNotable: '' },
                customFields: {}
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

    // Check if nomination forms are enabled
    if (!settings.nominationFormsEnabled) {
        return (
            <div className="max-w-2xl mx-auto text-center py-32 space-y-8">
                <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-red-100 dark:border-red-500/20">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white">Submissions Closed</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-md mx-auto leading-relaxed">
                        The nomination portal is currently closed. Please contact the administrator for more information.
                    </p>
                </div>
            </div>
        );
    }

    // Only Participants (students) and Association Members can submit nominations
    if (user?.role && user.role !== 'Participant' && user.role !== 'Association Member') {
        return (
            <div className="max-w-2xl mx-auto text-center py-32 space-y-8">
                <div className="w-24 h-24 bg-amber-50 dark:bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-500/20">
                    <AlertCircle className="w-12 h-12 text-amber-500" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white">Restricted Access</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-md mx-auto leading-relaxed">
                        The nomination form is exclusively available to <strong>Student Participants and Association Members</strong>.
                    </p>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Your role: {user?.role}</p>
                </div>
            </div>
        );
    }

    const renderDynamicField = (field, idx) => {
        // ── TABLE FIELD ──────────────────────────────────
        if (field.type === 'table') {
            const columns = field.options || [];
            // Parse stored JSON rows or init with 1 empty row
            let rows;
            try {
                rows = JSON.parse(formData.customFields[field.label] || 'null');
                if (!Array.isArray(rows)) throw new Error();
            } catch {
                rows = [Object.fromEntries(columns.map(c => [c, '']))];
            }

            const updateTableRows = (newRows) => {
                setFormData({ ...formData, customFields: { ...formData.customFields, [field.label]: JSON.stringify(newRows) } });
            };

            const addRow = () => updateTableRows([...rows, Object.fromEntries(columns.map(c => [c, '']))]);
            const removeRow = (rIdx) => updateTableRows(rows.filter((_, i) => i !== rIdx));
            const updateCell = (rIdx, col, val) => {
                const newRows = rows.map((r, i) => i === rIdx ? { ...r, [col]: val } : r);
                updateTableRows(newRows);
            };

            return (
                <div key={idx} className="space-y-3">
                    <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-12">#</th>
                                    {columns.map(col => (
                                        <th key={col} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider">{col}</th>
                                    ))}
                                    <th className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, rIdx) => (
                                    <tr key={rIdx} className={`border-t border-slate-100 dark:border-slate-800 ${rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60 dark:text-white'}`}>
                                        <td className="px-4 py-2 text-xs font-black text-slate-400">{rIdx + 1}</td>
                                        {columns.map(col => (
                                            <td key={col} className="px-2 py-1.5">
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white rounded-xl outline-none text-sm text-slate-800 transition-all dark:text-white"
                                                    value={row[col] || ''}
                                                    onChange={e => updateCell(rIdx, col, e.target.value)}
                                                    placeholder="—"
                                                />
                                            </td>
                                        ))}
                                        <td className="px-2 py-1.5 text-center">
                                            {rows.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(rIdx)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Remove row"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button
                        type="button"
                        onClick={addRow}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 rounded-xl transition-colors"
                    >
                        + Add Row
                    </button>
                </div>
            );
        }

        // ── STANDARD FIELDS ──────────────────────────────
        return (
            <div key={idx} className="space-y-2">
                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                    <textarea
                        className="input-premium min-h-[100px]"
                        required={field.required}
                        value={formData.customFields[field.label] || ''}
                        onChange={e => setFormData({ ...formData, customFields: { ...formData.customFields, [field.label]: e.target.value } })}
                    />
                ) : field.type === 'dropdown' ? (
                    <select
                        className="input-premium"
                        required={field.required}
                        value={formData.customFields[field.label] || ''}
                        onChange={e => setFormData({ ...formData, customFields: { ...formData.customFields, [field.label]: e.target.value } })}
                    >
                        <option value="">Select Option</option>
                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                ) : (
                    <input
                        type={field.type}
                        className="input-premium"
                        required={field.required}
                        value={formData.customFields[field.label] || ''}
                        onChange={e => setFormData({ ...formData, customFields: { ...formData.customFields, [field.label]: e.target.value } })}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-40">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-500/10 rounded-full text-primary-700 dark:text-primary-300 text-xs font-black uppercase tracking-widest border border-primary-100 dark:border-primary-500/20">
                    <Sparkles className="w-4 h-4" /> Leadership Opportunities
                </div>
                <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                    Candidate <span className="text-reveal">Nomination.</span>
                </h1>
                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
                    Step forward to lead. Apply for various association posts and share your vision for the community.
                </p>
            </div>

            <AnimatePresence mode="wait">
                {!selectedForm ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {forms.map(form => (
                            <div 
                                key={form._id} 
                                onClick={() => handleFormSelect(form)}
                                className="bg-white dark:bg-[#20242B] p-10 rounded-[3rem] border-2 border-slate-50 hover:border-primary-500 transition-all cursor-pointer group hover:shadow-2xl hover:shadow-primary-100/30 dark:text-white"
                            >
                                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform duration-500">
                                    <Award className="w-8 h-8" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{form.title}</h3>
                                {form.description ? (
                                    <div
                                        className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed line-clamp-3 rich-text-display"
                                        dangerouslySetInnerHTML={{ __html: form.description }}
                                    />
                                ) : (
                                    <p className="text-slate-300 font-medium mb-8 italic">No description provided.</p>
                                )}
                                <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-black text-sm uppercase tracking-widest pt-6 border-t border-slate-50">
                                    Apply Now <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-[#20242B] rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden dark:text-white"
                    >
                        {/* Form Header */}
                        <div className="bg-slate-900 p-12 text-white">
                            <button 
                                onClick={() => setSelectedForm(null)}
                                className="text-slate-400 hover:text-white font-bold text-sm mb-6 flex items-center gap-2"
                            >
                                <ArrowRight className="w-4 h-4 rotate-180" /> Change Post
                            </button>
                            <h2 className="text-4xl font-black tracking-tight">{selectedForm.title}</h2>
                            {selectedForm.description && (
                                <div
                                    className="mt-5 text-slate-300 font-medium max-w-3xl leading-relaxed rich-text-display"
                                    dangerouslySetInnerHTML={{ __html: selectedForm.description }}
                                />
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="p-12 space-y-12">
                            {/* Candidate Photo Upload */}
                            <section className="space-y-8 bg-slate-50 dark:bg-[#1a1d24] p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-8">
                                <div className="shrink-0 relative group">
                                    {photoPreview ? (
                                        <div className="w-32 h-32 rounded-3xl border-2 border-primary-500 overflow-hidden bg-white dark:bg-[#20242B] flex items-center justify-center shadow-lg dark:text-white">
                                            <img src={photoPreview} className="w-full h-full object-cover" alt="Candidate Preview" />
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center bg-white dark:bg-[#20242B] text-slate-400 dark:text-white">
                                            <Camera className="w-10 h-10" />
                                            <span className="text-[10px] font-bold mt-1">No Photo</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3 flex-1 text-left">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Candidate Photograph</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                        Please upload a formal profile picture (JPG, PNG, WEBP, max 5MB). This image will be printed on the official nomination sheets.
                                    </p>
                                    <label className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#20242B] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#2a2e36] rounded-xl cursor-pointer font-bold text-xs text-slate-700 transition-colors shadow-sm dark:text-white">
                                        {isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Upload className="w-4 h-4 text-slate-400" />}
                                        {isUploadingPhoto ? 'Uploading...' : candidatePhoto ? 'Change Photograph' : 'Upload Photograph'}
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={handlePhotoUpload} 
                                        />
                                    </label>
                                </div>
                            </section>

                                {/* Post Applied For */}
                                <section className="space-y-6">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white border-l-4 border-primary-500 pl-6">
                                        1. Post Applied For
                                    </h3>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                            Select Role <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            className="input-premium"
                                            required
                                            value={formData.postAppliedFor}
                                            onChange={e => setFormData({ ...formData, postAppliedFor: e.target.value })}
                                        >
                                            <option value="">— Select a Role —</option>
                                            <option value="President">President</option>
                                            <option value="Secretary">Secretary</option>
                                            <option value="General Secretary">General Secretary</option>
                                            <option value="Treasurer">Treasurer</option>
                                            <option value="Vice – President">Vice – President</option>
                                            <option value="Joint Secretary">Joint Secretary</option>
                                            <option value="Technical Coordinator">Technical Coordinator</option>
                                            <option value="Event Coordinator">Event Coordinator</option>
                                            <option value="Media & Social Media Coordinator">Media &amp; Social Media Coordinator</option>
                                            <option value="Photography & Design Coordinator">Photography &amp; Design Coordinator</option>
                                            <option value="Chief Editor & Head of Digitimes">Chief Editor &amp; Head of Digitimes</option>
                                            <option value="Digitimes Incharge">Digitimes Incharge</option>
                                            <option value="Byte Bulletin Incharge">Byte Bulletin Incharge</option>
                                            <option value="Digitimes Magazine Team">Digitimes Magazine Team</option>
                                            <option value="Executive Member">Executive Member</option>
                                            <option value="Documentation Incharge">Documentation Incharge</option>
                                        </select>
                                    </div>
                                </section>

                                {/* Personal Info */}
                            {!['name', 'rollNumber', 'gender', 'dateOfBirth', 'year', 'section'].every(k => settings.disabledDefaultFields?.includes(k)) && (
                                <section className="space-y-8">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white border-l-4 border-primary-500 pl-6">
                                        2. Personal Information
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-8">
                                        {!settings.disabledDefaultFields?.includes('name') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.name || 'Name'}
                                                </label>
                                                <input 
                                                    type="text" className="input-premium bg-slate-50 dark:bg-[#1a1d24] text-slate-500 dark:text-slate-400" disabled
                                                    value={formData.personalInfo.name}
                                                />
                                            </div>
                                        )}
                                        {!settings.disabledDefaultFields?.includes('rollNumber') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.rollNumber || 'Roll Number'}
                                                </label>
                                                <input 
                                                    type="text" className="input-premium bg-slate-50 dark:bg-[#1a1d24] text-slate-500 dark:text-slate-400" disabled
                                                    value={formData.personalInfo.rollNumber}
                                                />
                                            </div>
                                        )}
                                        {!settings.disabledDefaultFields?.includes('gender') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.gender || 'Gender'}
                                                </label>
                                                <input 
                                                    type="text" className="input-premium bg-slate-50 dark:bg-[#1a1d24] text-slate-500 dark:text-slate-400" disabled
                                                    value={formData.personalInfo.gender}
                                                />
                                            </div>
                                        )}
                                        {!settings.disabledDefaultFields?.includes('dateOfBirth') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.dateOfBirth || 'Date of Birth'}
                                                </label>
                                                <input 
                                                    type="text" className="input-premium bg-slate-50 dark:bg-[#1a1d24] text-slate-500 dark:text-slate-400" disabled
                                                    value={formData.personalInfo.dateOfBirth}
                                                />
                                            </div>
                                        )}
                                        {!settings.disabledDefaultFields?.includes('year') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.year || 'Year & Dept'}
                                                </label>
                                                <input 
                                                    type="text" className="input-premium bg-slate-50 dark:bg-[#1a1d24] text-slate-500 dark:text-slate-400" disabled
                                                    value={formData.personalInfo.year}
                                                />
                                            </div>
                                        )}
                                        {!settings.disabledDefaultFields?.includes('section') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.section || 'Section'}
                                                </label>
                                                <input 
                                                    type="text" className="input-premium bg-slate-50 dark:bg-[#1a1d24] text-slate-500 dark:text-slate-400" disabled
                                                    value={formData.personalInfo.section}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Academic Prof */}
                            {!['tenthPercentage', 'diplomaPercentage', 'cgpa', 'noOfArrears'].every(k => settings.disabledDefaultFields?.includes(k)) && (
                                <section className="space-y-8">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white border-l-4 border-primary-500 pl-6">
                                        3. Academic Performance
                                    </h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {!settings.disabledDefaultFields?.includes('tenthPercentage') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.tenthPercentage || '10th %'}
                                                </label>
                                                <input 
                                                    type="text" className="input-premium" placeholder="e.g. 92" required
                                                    value={formData.academicProficiency.tenthPercentage}
                                                    onChange={e => setFormData({...formData, academicProficiency: {...formData.academicProficiency, tenthPercentage: e.target.value}})}
                                                />
                                            </div>
                                        )}
                                        {!settings.disabledDefaultFields?.includes('diplomaPercentage') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.diplomaPercentage || 'Diploma / XII %'}
                                                </label>
                                                <input 
                                                    type="text" className="input-premium" placeholder="e.g. 95" required
                                                    value={formData.academicProficiency.diplomaPercentage}
                                                    onChange={e => setFormData({...formData, academicProficiency: {...formData.academicProficiency, diplomaPercentage: e.target.value}})}
                                                />
                                            </div>
                                        )}
                                        {!settings.disabledDefaultFields?.includes('cgpa') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.cgpa || 'Current CGPA'}
                                                </label>
                                                <input 
                                                    type="text" className="input-premium" placeholder="e.g. 8.5" required
                                                    value={formData.academicProficiency.cgpa}
                                                    onChange={e => setFormData({...formData, academicProficiency: {...formData.academicProficiency, cgpa: e.target.value}})}
                                                />
                                            </div>
                                        )}
                                        {!settings.disabledDefaultFields?.includes('noOfArrears') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.noOfArrears || 'No. of Arrears'}
                                                </label>
                                                <input 
                                                    type="number" className="input-premium" placeholder="0" required min="0"
                                                    value={formData.academicProficiency.noOfArrears}
                                                    onChange={e => setFormData({...formData, academicProficiency: {...formData.academicProficiency, noOfArrears: e.target.value}})}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Previous Positions */}
                            {!['prevNameOfBody', 'prevPosition', 'prevPeriod'].every(k => settings.disabledDefaultFields?.includes(k)) && (
                                <section className="space-y-8">
                                    <div className="flex justify-between items-center border-l-4 border-primary-500 pl-6">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">4. Previous Positions Held</h3>
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData({...formData, previousPositions: [...formData.previousPositions, { nameOfBody: '', position: '', period: '' }]})}
                                            className="text-primary-600 dark:text-primary-400 font-black text-sm uppercase tracking-widest hover:bg-primary-50 px-4 py-2 rounded-xl transition-all"
                                        >
                                            + Add Position
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {formData.previousPositions.map((pos, idx) => (
                                            <div key={idx} className="bg-slate-50 dark:bg-[#1a1d24] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex gap-4 items-start">
                                                <div className="flex-1 grid md:grid-cols-3 gap-6">
                                                    {!settings.disabledDefaultFields?.includes('prevNameOfBody') && (
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                                {settings.customDefaultLabels?.prevNameOfBody || 'Name of the Body'}
                                                            </label>
                                                            <input 
                                                                type="text" className="input-premium bg-white dark:bg-[#20242B] py-2 dark:text-white" placeholder="e.g. Computer Society" required
                                                                value={pos.nameOfBody}
                                                                onChange={(e) => {
                                                                    const newPos = [...formData.previousPositions];
                                                                    newPos[idx].nameOfBody = e.target.value;
                                                                    setFormData({...formData, previousPositions: newPos});
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                    {!settings.disabledDefaultFields?.includes('prevPosition') && (
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                                {settings.customDefaultLabels?.prevPosition || 'Position'}
                                                            </label>
                                                            <input 
                                                                type="text" className="input-premium bg-white dark:bg-[#20242B] py-2 dark:text-white" placeholder="e.g. Secretary" required
                                                                value={pos.position}
                                                                onChange={(e) => {
                                                                    const newPos = [...formData.previousPositions];
                                                                    newPos[idx].position = e.target.value;
                                                                    setFormData({...formData, previousPositions: newPos});
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                    {!settings.disabledDefaultFields?.includes('prevPeriod') && (
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                                {settings.customDefaultLabels?.prevPeriod || 'Period'}
                                                            </label>
                                                            <input 
                                                                type="text" className="input-premium bg-white dark:bg-[#20242B] py-2 dark:text-white" placeholder="e.g. 2022 - 2023" required
                                                                value={pos.period}
                                                                onChange={(e) => {
                                                                    const newPos = [...formData.previousPositions];
                                                                    newPos[idx].period = e.target.value;
                                                                    setFormData({...formData, previousPositions: newPos});
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                {formData.previousPositions.length > 1 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => {
                                                            const newPos = [...formData.previousPositions];
                                                            newPos.splice(idx, 1);
                                                            setFormData({...formData, previousPositions: newPos});
                                                        }}
                                                        className="mt-6 p-2 text-red-400 hover:bg-white hover:text-red-500 rounded-xl transition-all dark:text-white"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Contributions */}
                            {!['contribAcademic', 'contribCoCurricular', 'contribExtracurricular', 'contribOtherNotable'].every(k => settings.disabledDefaultFields?.includes(k)) && (
                                <section className="space-y-8">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white border-l-4 border-primary-500 pl-6">5. Contributions & Achievements</h3>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        {!settings.disabledDefaultFields?.includes('contribAcademic') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.contribAcademic || '1. Academic'}
                                                </label>
                                                <textarea 
                                                    className="input-premium min-h-[100px] p-4 text-sm"
                                                    placeholder="Paper presentations, hackathons..."
                                                    value={formData.contributions.academic}
                                                    onChange={e => setFormData({...formData, contributions: {...formData.contributions, academic: e.target.value}})}
                                                />
                                            </div>
                                        )}
                                        {!settings.disabledDefaultFields?.includes('contribCoCurricular') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.contribCoCurricular || '2. Co-Curricular'}
                                                </label>
                                                <textarea 
                                                    className="input-premium min-h-[100px] p-4 text-sm"
                                                    placeholder="Club activities, events organized..."
                                                    value={formData.contributions.coCurricular}
                                                    onChange={e => setFormData({...formData, contributions: {...formData.contributions, coCurricular: e.target.value}})}
                                                />
                                            </div>
                                        )}
                                        {!settings.disabledDefaultFields?.includes('contribExtracurricular') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.contribExtracurricular || '3. Extracurricular'}
                                                </label>
                                                <textarea 
                                                    className="input-premium min-h-[100px] p-4 text-sm"
                                                    placeholder="Sports, cultural, NSS..."
                                                    value={formData.contributions.extracurricular}
                                                    onChange={e => setFormData({...formData, contributions: {...formData.contributions, extracurricular: e.target.value}})}
                                                />
                                            </div>
                                        )}
                                        {!settings.disabledDefaultFields?.includes('contribOtherNotable') && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">
                                                    {settings.customDefaultLabels?.contribOtherNotable || '4. Any Other Notable Contributions'}
                                                </label>
                                                <textarea 
                                                    className="input-premium min-h-[100px] p-4 text-sm"
                                                    placeholder="Volunteering, outreach programs..."
                                                    value={formData.contributions.otherNotable}
                                                    onChange={e => setFormData({...formData, contributions: {...formData.contributions, otherNotable: e.target.value}})}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* ── Default Questions Extra Fields ── */}
                            {settings.defaultQuestionFields?.length > 0 && (
                                <section className="space-y-8">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white border-l-4 border-violet-500 pl-6">
                                        More Questions
                                    </h3>
                                    <div className="space-y-8">
                                        {settings.defaultQuestionFields.map(renderDynamicField)}
                                    </div>
                                </section>
                            )}

                            {/* ── Additional Details Section ── */}
                            {settings.additionalDetailsFields?.length > 0 && (
                                <section className="space-y-8">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white border-l-4 border-rose-500 pl-6">
                                        {settings.additionalDetailsSectionTitle || 'Additional Details'}
                                    </h3>
                                    <div className="space-y-8">
                                        {settings.additionalDetailsFields.map(renderDynamicField)}
                                    </div>
                                </section>
                            )}

                            {/* Custom Fields (From the specific Form) */}
                            {selectedForm.fields.length > 0 && (
                                <section className="space-y-8">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white border-l-4 border-primary-500 pl-6">Additional Information</h3>
                                    <div className="space-y-8">
                                        {selectedForm.fields.map(renderDynamicField)}
                                    </div>
                                </section>
                            )}

                            <div className="pt-10 flex flex-wrap items-center justify-between gap-6 border-t border-slate-50">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <AlertCircle className="w-5 h-5" />
                                    <p className="text-xs font-medium italic">Make sure all details are accurate before submitting.</p>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="px-12 py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 shadow-2xl shadow-primary-200"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin w-6 h-6" /> : <Send className="w-6 h-6" />}
                                    Submit Application
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NominationSubmission;
