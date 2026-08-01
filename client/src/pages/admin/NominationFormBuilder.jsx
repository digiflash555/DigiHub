import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Layout, Save, ChevronLeft, Type, CheckSquare, List, Calendar, Edit2, X, Eye, EyeOff, Lock, Unlock, FileText as FormIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RichTextEditor from '../../components/RichTextEditor';
import { useConfirm } from '../../contexts/ConfirmContext';

// Built-in default form sections that every nomination form includes
const DEFAULT_FORM_SECTIONS = [
    {
        title: '1. Personal Information',
        color: 'blue',
        fields: [
            { key: 'name', label: 'Full Name', type: 'text', note: 'Auto-filled from profile', locked: true },
            { key: 'rollNumber', label: 'Roll Number', type: 'text', note: 'Auto-filled from profile', locked: true },
            { key: 'gender', label: 'Gender', type: 'text', note: 'Auto-filled from profile', locked: true },
            { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', note: 'Auto-filled from profile', locked: true },
            { key: 'year', label: 'Year & Department', type: 'text', note: 'Auto-filled from profile', locked: true },
            { key: 'section', label: 'Section', type: 'text', note: 'Auto-filled from profile', locked: true },
        ]
    },
    {
        title: '2. Academic Performance',
        color: 'purple',
        fields: [
            { key: 'tenthPercentage', label: 'X Percentage', type: 'number', note: 'Required', locked: false },
            { key: 'diplomaPercentage', label: 'Diploma / XII Percentage', type: 'number', note: 'Required', locked: false },
            { key: 'cgpa', label: 'Current CGPA', type: 'number', note: 'Required', locked: false },
            { key: 'noOfArrears', label: 'No. of Arrears', type: 'number', note: 'Required (min 0)', locked: false },
        ]
    },
    {
        title: '3. Previous Positions Held',
        color: 'amber',
        fields: [
            { key: 'prevNameOfBody', label: 'Name of the Body', type: 'text', note: 'Repeatable group', locked: false },
            { key: 'prevPosition', label: 'Position', type: 'text', note: 'Repeatable group', locked: false },
            { key: 'prevPeriod', label: 'Period', type: 'text', note: 'Repeatable group (e.g. 2022-23)', locked: false },
        ]
    },
    {
        title: '4. Contributions & Achievements',
        color: 'emerald',
        fields: [
            { key: 'contribAcademic', label: 'Academic', type: 'textarea', note: 'Optional', locked: false },
            { key: 'contribCoCurricular', label: 'Co-Curricular', type: 'textarea', note: 'Optional', locked: false },
            { key: 'contribExtracurricular', label: 'Extracurricular', type: 'textarea', note: 'Optional', locked: false },
            { key: 'contribOtherNotable', label: 'Other Notable Contributions', type: 'textarea', note: 'Optional', locked: false },
        ]
    }
];

const NominationFormBuilder = () => {
    const navigate = useNavigate();
    const { confirm } = useConfirm();
    const [isLoading, setIsLoading] = useState(false);
    const [forms, setForms] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showDefaultPreview, setShowDefaultPreview] = useState(false);
    const [currentForm, setCurrentForm] = useState({
        title: '',
        description: '',
        fields: [],
        isActive: true,
        startDate: '',
        endDate: ''
    });

    const [settings, setSettings] = useState({
        disabledDefaultFields: [],
        customDefaultLabels: {},
        defaultQuestionFields: [],
        additionalDetailsSectionTitle: 'Additional Details',
        additionalDetailsFields: []
    });
    const [editingLabelKey, setEditingLabelKey] = useState(null);
    const [tempLabel, setTempLabel] = useState('');
    const [editingAdditionalTitle, setEditingAdditionalTitle] = useState(false);
    const [tempAdditionalTitle, setTempAdditionalTitle] = useState('');

    useEffect(() => {
        fetchForms();
        fetchSettings();
    }, []);

    const fetchForms = async () => {
        try {
            const res = await axios.get(`/api/nominations/forms`);
            setForms(res.data);
        } catch (error) {
            toast.error('Failed to load forms');
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`/api/settings`);
            setSettings({
                ...res.data,
                disabledDefaultFields: res.data.disabledDefaultFields || [],
                customDefaultLabels: res.data.customDefaultLabels || {},
                defaultQuestionFields: res.data.defaultQuestionFields || [],
                additionalDetailsSectionTitle: res.data.additionalDetailsSectionTitle || 'Additional Details',
                additionalDetailsFields: res.data.additionalDetailsFields || []
            });
        } catch (error) {
            toast.error('Failed to load settings');
        }
    };

    // Generic helper that PUTs updated settings and refreshes local state
    const saveSettingsUpdate = async (updatedSettings) => {
        const res = await axios.put(`/api/settings`, updatedSettings);
        setSettings({
            ...res.data,
            disabledDefaultFields: res.data.disabledDefaultFields || [],
            customDefaultLabels: res.data.customDefaultLabels || {},
            defaultQuestionFields: res.data.defaultQuestionFields || [],
            additionalDetailsSectionTitle: res.data.additionalDetailsSectionTitle || 'Additional Details',
            additionalDetailsFields: res.data.additionalDetailsFields || []
        });
    };

    const handleToggleField = async (fieldKey) => {
        const currentDisabled = [...settings.disabledDefaultFields];
        const index = currentDisabled.indexOf(fieldKey);
        if (index > -1) {
            currentDisabled.splice(index, 1);
        } else {
            currentDisabled.push(fieldKey);
        }

        const updatedSettings = {
            ...settings,
            disabledDefaultFields: currentDisabled
        };

        try {
            const res = await axios.put(`/api/settings`, updatedSettings);
            setSettings({
                ...res.data,
                disabledDefaultFields: res.data.disabledDefaultFields || [],
                customDefaultLabels: res.data.customDefaultLabels || {}
            });
            toast.success('Default field availability updated');
        } catch (error) {
            toast.error('Failed to update settings');
        }
    };

    const handleUpdateLabel = async (fieldKey, newLabel) => {
        if (!newLabel.trim()) {
            toast.error('Label cannot be empty');
            return;
        }
        const currentLabels = { ...settings.customDefaultLabels };
        currentLabels[fieldKey] = newLabel.trim();

        const updatedSettings = {
            ...settings,
            customDefaultLabels: currentLabels
        };

        try {
            const res = await axios.put(`/api/settings`, updatedSettings);
            setSettings({
                ...res.data,
                disabledDefaultFields: res.data.disabledDefaultFields || [],
                customDefaultLabels: res.data.customDefaultLabels || {}
            });
            setEditingLabelKey(null);
            toast.success('Field label updated');
        } catch (error) {
            toast.error('Failed to update label');
        }
    };

    // ─── Default Question Extra Fields handlers ───────────────────────────────
    const handleAddDefaultQuestionField = () => {
        setSettings(prev => ({
            ...prev,
            defaultQuestionFields: [...(prev.defaultQuestionFields || []), { label: '', type: 'text', required: false, options: [] }]
        }));
    };

    const handleUpdateDefaultQuestionField = (idx, key, value) => {
        setSettings(prev => {
            const newFields = [...(prev.defaultQuestionFields || [])];
            newFields[idx] = { ...newFields[idx], [key]: value };
            return { ...prev, defaultQuestionFields: newFields };
        });
    };

    const handleDeleteDefaultQuestionField = async (idx) => {
        const newFields = [...(settings.defaultQuestionFields || [])];
        newFields.splice(idx, 1);
        try {
            await saveSettingsUpdate({ ...settings, defaultQuestionFields: newFields });
            toast.success('Field removed');
        } catch {
            toast.error('Failed to remove field');
        }
    };

    const handleSaveDefaultQuestionFields = async () => {
        if ((settings.defaultQuestionFields || []).some(f => !f.label.trim())) {
            toast.error('All fields must have a label');
            return;
        }
        try {
            await saveSettingsUpdate({ ...settings });
            toast.success('Default question fields saved');
        } catch {
            toast.error('Failed to save fields');
        }
    };

    // ─── Additional Details Section handlers ──────────────────────────────────
    const handleSaveAdditionalTitle = async () => {
        if (!tempAdditionalTitle.trim()) { toast.error('Title cannot be empty'); return; }
        try {
            await saveSettingsUpdate({ ...settings, additionalDetailsSectionTitle: tempAdditionalTitle.trim() });
            setEditingAdditionalTitle(false);
            toast.success('Section title updated');
        } catch {
            toast.error('Failed to update title');
        }
    };

    const handleAddAdditionalField = () => {
        setSettings(prev => ({
            ...prev,
            additionalDetailsFields: [...(prev.additionalDetailsFields || []), { label: '', type: 'text', required: false, options: [] }]
        }));
    };

    const handleUpdateAdditionalField = (idx, key, value) => {
        setSettings(prev => {
            const newFields = [...(prev.additionalDetailsFields || [])];
            newFields[idx] = { ...newFields[idx], [key]: value };
            return { ...prev, additionalDetailsFields: newFields };
        });
    };

    const handleDeleteAdditionalField = async (idx) => {
        const newFields = [...(settings.additionalDetailsFields || [])];
        newFields.splice(idx, 1);
        try {
            await saveSettingsUpdate({ ...settings, additionalDetailsFields: newFields });
            toast.success('Field removed');
        } catch {
            toast.error('Failed to remove field');
        }
    };

    const handleSaveAdditionalFields = async () => {
        if ((settings.additionalDetailsFields || []).some(f => !f.label.trim())) {
            toast.error('All fields must have a label');
            return;
        }
        try {
            await saveSettingsUpdate({ ...settings });
            toast.success('Additional Details fields saved');
        } catch {
            toast.error('Failed to save fields');
        }
    };

    const addField = (e) => {
        e.preventDefault();
        setCurrentForm({
            ...currentForm,
            fields: [
                ...currentForm.fields,
                { label: '', type: 'text', required: true, options: [] }
            ]
        });
    };

    const removeField = (index) => {
        const newFields = [...currentForm.fields];
        newFields.splice(index, 1);
        setCurrentForm({ ...currentForm, fields: newFields });
    };

    const updateField = (index, key, value) => {
        const newFields = [...currentForm.fields];
        newFields[index][key] = value;
        setCurrentForm({ ...currentForm, fields: newFields });
    };

    const handleEdit = (form) => {
        setEditingId(form._id);
        setCurrentForm({
            title: form.title,
            description: form.description,
            fields: form.fields,
            isActive: form.isActive,
            startDate: form.startDate ? form.startDate.split('T')[0] : '',
            endDate: form.endDate ? form.endDate.split('T')[0] : ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm('Are you sure you want to delete this form?');
        if (!confirmed) return;
        try {
            await axios.delete(`/api/nominations/forms/${id}`);
            toast.success('Form deleted');
            fetchForms();
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleSubmit = async () => {
        if (!currentForm.title) {
            toast.error('Form title is required');
            return;
        }

        setIsLoading(true);
        try {
            const formPayload = {
                ...currentForm,
                startDate: currentForm.startDate,
                endDate: currentForm.endDate,
            };

            if (editingId) {
                await axios.put(`/api/nominations/forms/${editingId}`, formPayload);
                toast.success('Form updated successfully');
            } else {
                await axios.post(`/api/nominations/forms`, formPayload);
                toast.success('Nomination form created successfully');
            }
            setShowForm(false);
            setEditingId(null);
            setCurrentForm({ title: '', description: '', fields: [], isActive: true, startDate: '', endDate: '' });
            fetchForms();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-12 pb-40">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-end gap-6">
                <div className="space-y-4">
                    <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-600 font-bold transition-colors text-sm">
                        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Form <span className="text-reveal">Architect.</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-md">
                        Design and schedule custom nomination forms.
                    </p>
                </div>
                <button
                    onClick={() => {
                        if (showForm) {
                            setShowForm(false);
                            setEditingId(null);
                            setCurrentForm({ title: '', description: '', fields: [], isActive: true, startDate: '', endDate: '' });
                        } else {
                            setShowForm(true);
                        }
                    }}
                    className="btn-premium flex items-center gap-3"
                >
                    {showForm ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                    {showForm ? 'Cancel' : 'Create New Form'}
                </button>
            </div>
            {/* Default Form Preview Panel */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#20242B] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden dark:text-white"
            >
                <button
                    type="button"
                    onClick={() => setShowDefaultPreview(v => !v)}
                    className="w-full flex items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-[#2a2e36] transition-colors"
                >
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                            <FormIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Default Nomination Form</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Built-in fields included in every nomination — click to {showDefaultPreview ? 'collapse' : 'preview'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-xl">4 Sections • 17 Fields</span>
                        {showDefaultPreview ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-slate-400" />}
                    </div>
                </button>

                <AnimatePresence>
                    {showDefaultPreview && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
                        >
                            <div className="p-8 grid md:grid-cols-2 gap-6">
                                {DEFAULT_FORM_SECTIONS.map((section, sIdx) => (
                                    <div key={sIdx} className={`bg-slate-50 dark:bg-[#1a1d24] rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800`}>
                                        <h3 className={`text-sm font-black text-slate-700 dark:text-slate-200 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2`}>
                                            <span className={`w-2.5 h-2.5 rounded-full ${section.color === 'blue' ? 'bg-blue-500' : section.color === 'purple' ? 'bg-purple-500' : section.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                            {section.title}
                                        </h3>
                                        <div className="space-y-3">
                                            {section.fields.map((field, fIdx) => {
                                                const isFieldDisabled = settings.disabledDefaultFields.includes(field.key);
                                                const displayLabel = settings.customDefaultLabels[field.key] || field.label;
                                                const isEditingThis = editingLabelKey === field.key;

                                                return (
                                                    <div key={fIdx} className={`flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-[#20242B] rounded-2xl p-4 border transition-all ${isFieldDisabled ? 'border-red-100 opacity-60 bg-red-50/20' : 'border-slate-100 hover:border-slate-200 dark:text-white'}`}>
                                                        <div className="flex items-start gap-3 flex-1">
                                                            {field.locked
                                                                ? <Lock className="w-4 h-4 text-slate-300 mt-1" />
                                                                : <Unlock className="w-4 h-4 text-slate-300 mt-1" />
                                                            }
                                                            <div className="flex-1 text-left">
                                                                {isEditingThis ? (
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <input
                                                                            type="text"
                                                                            className="input-premium py-1.5 px-3 text-xs w-full max-w-[180px] bg-slate-50 dark:bg-[#1a1d24]"
                                                                            value={tempLabel}
                                                                            onChange={(e) => setTempLabel(e.target.value)}
                                                                            placeholder="New Label"
                                                                            autoFocus
                                                                        />
                                                                        <button
                                                                            onClick={() => handleUpdateLabel(field.key, tempLabel)}
                                                                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                                                                        >
                                                                            Save
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingLabelKey(null)}
                                                                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <p className={`text-sm font-bold ${isFieldDisabled ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                                                            {displayLabel}
                                                                        </p>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingLabelKey(field.key);
                                                                                setTempLabel(displayLabel);
                                                                            }}
                                                                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                                                            title="Edit Label"
                                                                        >
                                                                            <Edit2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{field.note}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-3 sm:mt-0 justify-end">
                                                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#20242B] text-slate-500 dark:text-slate-400">
                                                                {field.type}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleField(field.key)}
                                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${isFieldDisabled ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-slate-50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 hover:border-red-200'}`}
                                                                title={isFieldDisabled ? "Enable Field" : "Delete / Disable Field"}
                                                            >
                                                                {isFieldDisabled ? 'Enable' : 'Delete'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* ── Default Questions Extra Fields Panel ─────────────────── */}
                            <div className="px-8 pb-4">
                                <div className="bg-white dark:bg-[#20242B] rounded-[2rem] border border-violet-100 dark:border-violet-500/20 shadow-sm p-6 space-y-5 dark:text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
                                                Default Questions — Extra Fields
                                            </h3>
                                            <p className="text-xs text-slate-400 font-medium mt-1">These extra fields appear on every nomination form after the 4 built-in sections.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddDefaultQuestionField}
                                            className="text-violet-600 dark:text-violet-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-violet-50 px-4 py-2 rounded-xl transition-all border border-violet-100 dark:border-violet-500/20"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Field
                                        </button>
                                    </div>

                                    {(settings.defaultQuestionFields || []).length === 0 ? (
                                        <p className="text-slate-300 text-sm font-bold text-center py-5 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                            No extra default fields added yet.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {(settings.defaultQuestionFields || []).map((field, idx) => (
                                                <div key={idx} className="bg-slate-50 dark:bg-[#1a1d24] rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex gap-4 items-start">
                                                    <div className="flex-1 grid md:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Label</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Field Name"
                                                                className="input-premium py-2 bg-white dark:bg-[#20242B] text-xs dark:text-white"
                                                                value={field.label}
                                                                onChange={(e) => handleUpdateDefaultQuestionField(idx, 'label', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Type</label>
                                                            <select
                                                                className="input-premium py-2 bg-white dark:bg-[#20242B] text-xs dark:text-white"
                                                                value={field.type}
                                                                onChange={(e) => handleUpdateDefaultQuestionField(idx, 'type', e.target.value)}
                                                            >
                                                                <option value="text">Short Answer</option>
                                                                <option value="textarea">Paragraph</option>
                                                                <option value="dropdown">Dropdown</option>
                                                                <option value="number">Numeric</option>
                                                                <option value="date">Date</option>
                                                            </select>
                                                        </div>
                                                        {field.type === 'dropdown' && (
                                                            <div className="col-span-2 space-y-1">
                                                                <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Options (comma separated)</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Option 1, Option 2"
                                                                    className="input-premium py-2 bg-white dark:bg-[#20242B] text-xs dark:text-white"
                                                                    value={(field.options || []).join(', ')}
                                                                    onChange={(e) => handleUpdateDefaultQuestionField(idx, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="col-span-2">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={field.required}
                                                                    onChange={(e) => handleUpdateDefaultQuestionField(idx, 'required', e.target.checked)}
                                                                    className="w-4 h-4 accent-violet-600"
                                                                />
                                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Required field</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteDefaultQuestionField(idx)}
                                                        className="p-2 text-red-400 hover:bg-white hover:text-red-500 rounded-xl transition-all mt-1 dark:text-white"
                                                        title="Remove field"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(settings.defaultQuestionFields || []).length > 0 && (
                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="button"
                                                onClick={handleSaveDefaultQuestionFields}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-md shadow-violet-100"
                                            >
                                                <Save className="w-4 h-4" /> Save Default Fields
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Additional Details Section Panel ──────────────────────── */}
                            <div className="px-8 pb-4">
                                <div className="bg-white dark:bg-[#20242B] rounded-[2rem] border border-rose-100 dark:border-rose-500/20 shadow-sm p-6 space-y-5 dark:text-white">
                                    {/* Editable section title */}
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
                                            {editingAdditionalTitle ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        className="input-premium py-1.5 px-3 text-sm font-black w-52 bg-slate-50 dark:bg-[#1a1d24]"
                                                        value={tempAdditionalTitle}
                                                        onChange={(e) => setTempAdditionalTitle(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={handleSaveAdditionalTitle}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                                                    >Save</button>
                                                    <button
                                                        onClick={() => setEditingAdditionalTitle(false)}
                                                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                                                    >Cancel</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                                        {settings.additionalDetailsSectionTitle || 'Additional Details'}
                                                    </h3>
                                                    <button
                                                        onClick={() => {
                                                            setEditingAdditionalTitle(true);
                                                            setTempAdditionalTitle(settings.additionalDetailsSectionTitle || 'Additional Details');
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                                        title="Edit Section Title"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddAdditionalField}
                                            className="text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-50 px-4 py-2 rounded-xl transition-all border border-rose-100 dark:border-rose-500/20"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Field
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium -mt-1">
                                        This section appears on every nomination form. The section title is editable by admin.
                                    </p>

                                    {(settings.additionalDetailsFields || []).length === 0 ? (
                                        <p className="text-slate-300 text-sm font-bold text-center py-5 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                            No fields added yet. Click "+ Add Field" to begin.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {(settings.additionalDetailsFields || []).map((field, idx) => (
                                                <div key={idx} className="bg-slate-50 dark:bg-[#1a1d24] rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex gap-4 items-start">
                                                    <div className="flex-1 grid md:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Label</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Field Name"
                                                                className="input-premium py-2 bg-white dark:bg-[#20242B] text-xs dark:text-white"
                                                                value={field.label}
                                                                onChange={(e) => handleUpdateAdditionalField(idx, 'label', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Type</label>
                                                            <select
                                                                className="input-premium py-2 bg-white dark:bg-[#20242B] text-xs dark:text-white"
                                                                value={field.type}
                                                                onChange={(e) => handleUpdateAdditionalField(idx, 'type', e.target.value)}
                                                            >
                                                                <option value="text">Short Answer</option>
                                                                <option value="textarea">Paragraph</option>
                                                                <option value="dropdown">Dropdown</option>
                                                                <option value="number">Numeric</option>
                                                                <option value="date">Date</option>
                                                            </select>
                                                        </div>
                                                        {field.type === 'dropdown' && (
                                                            <div className="col-span-2 space-y-1">
                                                                <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Options (comma separated)</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Option 1, Option 2"
                                                                    className="input-premium py-2 bg-white dark:bg-[#20242B] text-xs dark:text-white"
                                                                    value={(field.options || []).join(', ')}
                                                                    onChange={(e) => handleUpdateAdditionalField(idx, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="col-span-2">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={field.required}
                                                                    onChange={(e) => handleUpdateAdditionalField(idx, 'required', e.target.checked)}
                                                                    className="w-4 h-4 accent-rose-600"
                                                                />
                                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Required field</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAdditionalField(idx)}
                                                        className="p-2 text-red-400 hover:bg-white hover:text-red-500 rounded-xl transition-all mt-1 dark:text-white"
                                                        title="Remove field"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(settings.additionalDetailsFields || []).length > 0 && (
                                        <div className="flex justify-end pt-1">
                                            <button
                                                type="button"
                                                onClick={handleSaveAdditionalFields}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-md shadow-rose-100"
                                            >
                                                <Save className="w-4 h-4" /> Save Additional Details Fields
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Amber info note (keep at bottom) ─────────────────────── */}
                            <div className="px-8 pb-6">
                                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                                    <Lock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                                        <strong>🔒 Locked fields</strong> are auto-populated from the user's profile and cannot be edited by the candidate.
                                        All other fields are editable during submission. Use <strong>"Create New Form"</strong> to add extra custom fields on top of these defaults.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence mode="wait">
                {showForm ? (
                    <motion.div
                        key="builder"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid lg:grid-cols-3 gap-8"
                    >
                        {/* Editor */}
                        <div className="lg:col-span-2 space-y-8">
                            <section className="bg-white dark:bg-[#20242B] p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 dark:text-white">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Form Title</label>
                                        <select
                                            className="input-premium text-2xl bg-white dark:bg-[#20242B] dark:text-white"
                                            value={currentForm.title}
                                            onChange={(e) => setCurrentForm({ ...currentForm, title: e.target.value })}
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
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Description / Guidelines</label>
                                        <RichTextEditor
                                            value={currentForm.description}
                                            onChange={(html) => setCurrentForm({ ...currentForm, description: html })}
                                            placeholder="Instructions and guidelines for applicants..."
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Start Date (Opens at)</label>
                                            <div className="relative">

                                                <input
                                                    type="date"
                                                    className="input-premium pl-14"
                                                    value={currentForm.startDate}
                                                    onChange={(e) => setCurrentForm({ ...currentForm, startDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">End Date (Closes at)</label>
                                            <div className="relative">

                                                <input
                                                    type="date"
                                                    className="input-premium pl-14"
                                                    value={currentForm.endDate}
                                                    onChange={(e) => setCurrentForm({ ...currentForm, endDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white border-l-4 border-primary-500 pl-4">Custom Fields</h3>
                                        <button
                                            type="button"
                                            onClick={addField}
                                            className="text-primary-600 dark:text-primary-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-50 px-4 py-2 rounded-xl transition-all"
                                        >
                                            <Plus className="w-4 h-4" /> Add Field
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {currentForm.fields.length === 0 ? (
                                            <div className="p-16 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] text-center space-y-4">
                                                <List className="w-10 h-10 text-slate-100 mx-auto" />
                                                <p className="text-slate-300 font-bold">No custom fields added. Start adding to build your form.</p>
                                            </div>
                                        ) : (
                                            currentForm.fields.map((field, idx) => (
                                                <div key={idx} className="bg-slate-50 dark:bg-[#1a1d24] rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 flex gap-6 items-start">
                                                    <div className="flex-1 grid md:grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Label</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Field Name"
                                                                className="input-premium py-2 bg-white dark:bg-[#20242B] text-xs dark:text-white"
                                                                value={field.label}
                                                                onChange={(e) => updateField(idx, 'label', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Type</label>
                                                            <select
                                                                className="input-premium py-2 bg-white dark:bg-[#20242B] text-xs dark:text-white"
                                                                value={field.type}
                                                                onChange={(e) => updateField(idx, 'type', e.target.value)}
                                                            >
                                                                <option value="text">Short Answer</option>
                                                                <option value="textarea">Paragraph</option>
                                                                <option value="dropdown">Dropdown</option>
                                                                <option value="number">Numeric</option>
                                                                <option value="date">Date</option>
                                                                <option value="table">Table</option>
                                                            </select>
                                                        </div>
                                                        {field.type === 'dropdown' && (
                                                            <div className="col-span-2 space-y-1">
                                                                <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Options (comma separated)</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Option 1, Option 2, Option 3"
                                                                    className="input-premium py-2 bg-white dark:bg-[#20242B] text-xs dark:text-white"
                                                                    value={field.options.join(', ')}
                                                                    onChange={(e) => updateField(idx, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                                />
                                                            </div>
                                                        )}
                                                        {field.type === 'table' && (
                                                            <div className="col-span-2 space-y-3">
                                                                <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Column Headers</label>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {(field.options || []).map((col, cIdx) => (
                                                                        <div key={cIdx} className="flex items-center gap-1 bg-white dark:bg-[#20242B] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 dark:text-white">
                                                                            <input
                                                                                type="text"
                                                                                value={col}
                                                                                onChange={(e) => {
                                                                                    const newOpts = [...(field.options || [])];
                                                                                    newOpts[cIdx] = e.target.value;
                                                                                    updateField(idx, 'options', newOpts);
                                                                                }}
                                                                                className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none w-24"
                                                                                placeholder={`Col ${cIdx + 1}`}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newOpts = [...(field.options || [])].filter((_, i) => i !== cIdx);
                                                                                    updateField(idx, 'options', newOpts);
                                                                                }}
                                                                                className="text-red-400 hover:text-red-600 ml-1 text-xs font-black"
                                                                            >✕</button>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateField(idx, 'options', [...(field.options || []), ''])}
                                                                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-black transition-colors"
                                                                    >
                                                                        <Plus className="w-3 h-3" /> Add Column
                                                                    </button>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 font-medium pl-1">Candidates can add/remove rows when filling the form.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="pt-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeField(idx)}
                                                            className="p-2 text-red-400 hover:bg-white hover:text-red-500 rounded-xl transition-all dark:text-white"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Sidebar - Save */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 sticky top-28 shadow-2xl shadow-slate-200">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black flex items-center gap-3">
                                        <Save className="w-8 h-8 text-primary-400" />
                                        Publish
                                    </h3>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                        Once published, this form will be visible to all members for nomination submission during the scheduled dates.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <label className="flex items-center gap-4 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={currentForm.isActive}
                                                onChange={(e) => setCurrentForm({ ...currentForm, isActive: e.target.checked })}
                                            />
                                            <div className={`w-12 h-6 rounded-full transition-colors ${currentForm.isActive ? 'bg-primary-500' : 'bg-slate-700'}`}></div>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-[#20242B] transition-transform ${currentForm.isActive ? 'translate-x-7' : 'translate-x-1 dark:text-white'}`}></div>
                                        </div>
                                        <span className="font-bold text-sm">Active & Accepting Submissions</span>
                                    </label>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="w-full py-5 bg-primary-600 hover:bg-primary-500 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary-900/50"
                                >
                                    {isLoading ? 'Processing...' : editingId ? 'Update Form' : 'Save & Publish Form'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {forms.length === 0 ? (
                            <div className="col-span-full py-32 text-center space-y-6 bg-white dark:bg-[#20242B] rounded-[3rem] border border-slate-100 dark:border-slate-800 dark:text-white">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-[#1a1d24] rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto">
                                    <Layout className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-300">No forms designed yet</h3>
                                <button type="button" onClick={() => setShowForm(true)} className="text-primary-600 dark:text-primary-400 font-black uppercase tracking-widest text-sm hover:underline">Start Designing Now</button>
                            </div>
                        ) : (
                            forms.map(form => {
                                const now = new Date();
                                const isScheduled = form.startDate && new Date(form.startDate) > now;
                                const isExpired = form.endDate && new Date(form.endDate) < now;
                                const actualStatus = !form.isActive ? 'Draft' : isExpired ? 'Expired' : isScheduled ? 'Scheduled' : 'Active';

                                return (
                                    <div key={form._id} className="bg-white dark:bg-[#20242B] p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group relative overflow-hidden dark:text-white">
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br transition-opacity duration-500 opacity-5 pointer-events-none ${actualStatus === 'Active' ? 'from-emerald-500 to-teal-500' : actualStatus === 'Scheduled' ? 'from-amber-500 to-orange-500' : 'from-slate-500 to-slate-800'}`} />

                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${actualStatus === 'Active' ? 'bg-emerald-50 text-emerald-500' : actualStatus === 'Scheduled' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                                                <Layout className="w-7 h-7" />
                                            </div>
                                            <div className="flex gap-2 relative z-10">
                                                <button type="button" onClick={() => handleEdit(form)} className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="Edit Form">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button type="button" onClick={() => handleDelete(form._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Delete Form">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-primary-600 transition-colors">{form.title}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium line-clamp-2 mb-8">{form.description}</p>

                                        {form.startDate && (
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(form.startDate).toLocaleDateString()} - {form.endDate ? new Date(form.endDate).toLocaleDateString() : 'No Limit'}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${actualStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : actualStatus === 'Scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 dark:text-slate-400'}`}>
                                                    {actualStatus}
                                                </span>
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">{form.fields.length} Custom Fields</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NominationFormBuilder;
