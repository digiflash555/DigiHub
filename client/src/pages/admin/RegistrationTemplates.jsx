import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
    Plus, Trash2, Layout, Edit, Save, X, ArrowLeft, Copy, Eye, 
    ArrowUp, ArrowDown, ChevronDown, ChevronUp, Download, Upload, Monitor, Tablet, Smartphone, Sun, Moon 
} from 'lucide-react';
import { useConfirm } from '../../contexts/ConfirmContext';

const RegistrationTemplates = () => {
    const { confirm } = useConfirm();
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Preview states
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewMode, setPreviewMode] = useState('desktop'); // desktop, tablet, mobile
    const [previewTheme, setPreviewTheme] = useState('light'); // light, dark
    const [previewFields, setPreviewFields] = useState([]);

    const [formData, setFormData] = useState({
        templateName: '',
        description: '',
        category: 'Workshop',
        status: 'Active',
        fields: []
    });

    const [collapsedFields, setCollapsedFields] = useState({});

    const categories = ['Workshop', 'Hackathon', 'Seminar', 'Competition', 'Conference', 'Guest Lecture', 'Other'];

    const resetForm = () => {
        setIsCreating(false);
        setEditingId(null);
        setFormData({
            templateName: '',
            description: '',
            category: 'Workshop',
            status: 'Active',
            fields: []
        });
        setCollapsedFields({});
    };

    const handleEdit = (template) => {
        setFormData({
            templateName: template.templateName,
            description: template.description || '',
            category: template.category || 'Workshop',
            status: template.status || 'Active',
            fields: JSON.parse(JSON.stringify(template.fields || []))
        });
        setEditingId(template._id);
        setIsCreating(true);
    };

    useEffect(() => {
        fetchTemplates();
    }, [searchQuery, categoryFilter, statusFilter]);

    const fetchTemplates = async () => {
        try {
            let url = `/api/templates?_t=${Date.now()}`;
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
            if (categoryFilter) url += `&category=${categoryFilter}`;
            if (statusFilter) url += `&status=${statusFilter}`;
            const res = await axios.get(url);
            setTemplates(res.data);
        } catch (error) {
            toast.error('Failed to load templates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddField = () => {
        const fieldId = `field_${Math.random().toString(36).substring(2, 9)}`;
        const newField = {
            fieldId,
            type: 'text',
            label: 'New Custom Field',
            placeholder: '',
            required: false,
            readOnly: false,
            hidden: false,
            defaultValue: '',
            helpText: '',
            order: formData.fields.length,
            options: [],
            validation: {
                minLength: undefined,
                maxLength: undefined,
                minValue: undefined,
                maxValue: undefined,
                regularExpression: '',
                fileSizeLimit: undefined,
                allowedFileTypes: []
            },
            visibilityRules: {
                dependsOnFieldId: '',
                condition: '',
                value: ''
            }
        };

        setFormData({
            ...formData,
            fields: [...formData.fields, newField]
        });

        // Expand new field by default
        setCollapsedFields({
            ...collapsedFields,
            [fieldId]: false
        });
    };

    const handleRemoveField = (index) => {
        const newFields = [...formData.fields];
        newFields.splice(index, 1);
        setFormData({ ...formData, fields: newFields });
    };

    const handleUpdateField = (index, key, value) => {
        const newFields = [...formData.fields];
        newFields[index][key] = value;
        setFormData({ ...formData, fields: newFields });
    };

    const handleUpdateValidation = (index, key, value) => {
        const newFields = [...formData.fields];
        if (!newFields[index].validation) {
            newFields[index].validation = {};
        }
        newFields[index].validation[key] = value;
        setFormData({ ...formData, fields: newFields });
    };

    const handleUpdateVisibility = (index, key, value) => {
        const newFields = [...formData.fields];
        if (!newFields[index].visibilityRules) {
            newFields[index].visibilityRules = { dependsOnFieldId: '', condition: '', value: '' };
        }
        newFields[index].visibilityRules[key] = value;
        setFormData({ ...formData, fields: newFields });
    };

    const moveField = (index, direction) => {
        const newFields = [...formData.fields];
        if (direction === 'up' && index > 0) {
            const temp = newFields[index];
            newFields[index] = newFields[index - 1];
            newFields[index - 1] = temp;
        } else if (direction === 'down' && index < newFields.length - 1) {
            const temp = newFields[index];
            newFields[index] = newFields[index + 1];
            newFields[index + 1] = temp;
        }
        // Update order fields
        const ordered = newFields.map((f, idx) => ({ ...f, order: idx }));
        setFormData({ ...formData, fields: ordered });
    };

    const toggleFieldCollapse = (fieldId) => {
        setCollapsedFields(prev => ({
            ...prev,
            [fieldId]: !prev[fieldId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.templateName.trim()) {
            return toast.error('Template name is required');
        }

        try {
            // Fill orders
            const finalFields = formData.fields.map((f, idx) => ({ ...f, order: idx }));
            const payload = { ...formData, fields: finalFields };

            if (editingId) {
                await axios.put(`/api/templates/${editingId}`, payload);
                toast.success('Template updated successfully');
            } else {
                await axios.post(`/api/templates`, payload);
                toast.success('Template created successfully');
            }
            resetForm();
            fetchTemplates();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save template');
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm('Are you sure you want to delete this template?');
        if (!confirmed) return;
        try {
            await axios.delete(`/api/templates/${id}`);
            toast.success('Template deleted');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    const handleDuplicate = async (id) => {
        try {
            await axios.post(`/api/templates/${id}/duplicate`);
            toast.success('Template duplicated');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to duplicate template');
        }
    };

    // JSON Export
    const exportToJson = (template) => {
        const fileData = JSON.stringify(template, null, 2);
        const blob = new Blob([fileData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${template.templateName.replace(/\s+/g, '_')}_template.json`;
        link.href = url;
        link.click();
        toast.success('Template exported as JSON');
    };

    // JSON Import
    const handleJsonImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (!parsed.templateName || !Array.isArray(parsed.fields)) {
                    throw new Error('Invalid registration template structure');
                }
                
                // Set form data with imported template
                setFormData({
                    templateName: `${parsed.templateName} (Imported)`,
                    description: parsed.description || '',
                    category: parsed.category || 'Workshop',
                    status: 'Active',
                    fields: parsed.fields.map((f, idx) => ({
                        ...f,
                        fieldId: f.fieldId || `field_${Math.random().toString(36).substring(2, 9)}`,
                        order: idx
                    }))
                });
                setIsCreating(true);
                toast.success('Template imported from JSON. You can now save it.');
            } catch (err) {
                toast.error('Failed to parse template JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    const openPreview = (fields) => {
        setPreviewFields(fields || []);
        setIsPreviewing(true);
    };

    const getPreviewWidth = () => {
        if (previewMode === 'mobile') return 'max-w-[375px]';
        if (previewMode === 'tablet') return 'max-w-[768px]';
        return 'max-w-full';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 dark:text-white">
            <div className="flex items-center gap-2 mb-[-1rem]">
                <Link to="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
            </div>
            
            <div className="flex justify-between items-center bg-white dark:bg-[#20242B] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Registration Templates</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Design and manage reusable event registration forms.</p>
                </div>
                <div className="flex gap-3">
                    <label className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800">
                        <Upload className="w-5 h-5" /> Import JSON
                        <input type="file" accept=".json" onChange={handleJsonImport} className="hidden" />
                    </label>
                    {!isCreating && (
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-5 h-5" /> New Template
                        </button>
                    )}
                </div>
            </div>

            {/* Template Creator / Editor */}
            {isCreating && (
                <div className="bg-white dark:bg-[#20242B] p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <Layout className="w-5 h-5" /> {editingId ? 'Edit Template' : 'Create Registration Template'}
                        </h2>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-650">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-750 dark:text-slate-200 mb-1">Template Name</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1d24] rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    placeholder="e.g. Standard Coding Hackathon Template"
                                    value={formData.templateName}
                                    onChange={(e) => setFormData({...formData, templateName: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-750 dark:text-slate-200 mb-1">Description (Optional)</label>
                                <textarea 
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1d24] rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20" 
                                    placeholder="Brief details about what kind of events this template is suitable for..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-750 dark:text-slate-200 mb-1">Category</label>
                                <select 
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1d24] rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                >
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-750 dark:text-slate-200 mb-1">Status</label>
                                <select 
                                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1d24] rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Dynamic Registration Fields ({formData.fields.length})</h3>
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={() => openPreview(formData.fields)}
                                    className="text-slate-650 hover:bg-slate-50 border px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 dark:border-slate-700 dark:hover:bg-slate-800"
                                >
                                    <Eye className="w-4 h-4" /> Live Preview
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleAddField}
                                    className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3.5 py-1.5 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-500/20"
                                >
                                    <Plus className="w-4 h-4" /> Add Field control
                                </button>
                            </div>
                        </div>

                        {/* Drag and Drop list of fields */}
                        <div className="space-y-4">
                            {formData.fields.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-[#1a1d24] text-slate-500 dark:text-slate-400">
                                    No fields added yet. Drag-and-drop ordering will be enabled once fields are added.
                                </div>
                            ) : (
                                formData.fields.map((field, index) => {
                                    const isCollapsed = collapsedFields[field.fieldId] !== false; // collapsed by default
                                    return (
                                        <div key={field.fieldId} className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-[#1a1d24]/30 overflow-hidden shadow-sm">
                                            {/* Field Header */}
                                            <div className="flex items-center justify-between p-4 bg-slate-100/50 dark:bg-[#1a1d24] border-b border-slate-200 dark:border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <button type="button" onClick={() => moveField(index, 'up')} disabled={index === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                                                            <ArrowUp className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button type="button" onClick={() => moveField(index, 'down')} disabled={index === formData.fields.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">
                                                            <ArrowDown className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                                            #{index + 1}: {field.label || 'Unnamed Field'}
                                                        </span>
                                                        <span className="ml-2 text-xs text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full font-bold uppercase">
                                                            {field.type}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-350 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={field.required}
                                                            onChange={(e) => handleUpdateField(index, 'required', e.target.checked)}
                                                        />
                                                        Required
                                                    </label>
                                                    
                                                    <button 
                                                        type="button"
                                                        onClick={() => toggleFieldCollapse(field.fieldId)}
                                                        className="text-slate-400 hover:text-slate-700 p-1"
                                                    >
                                                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                                    </button>

                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveField(index)} 
                                                        className="text-red-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Field Settings Body */}
                                            {!isCollapsed && (
                                                <div className="p-5 space-y-4 bg-white dark:bg-[#20242B]">
                                                    <div className="grid md:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Field Label</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="e.g. Roll Number"
                                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-[#1a1d24] dark:border-slate-800"
                                                                value={field.label}
                                                                onChange={(e) => handleUpdateField(index, 'label', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Field Type</label>
                                                            <select 
                                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-[#1a1d24] dark:border-slate-800"
                                                                value={field.type}
                                                                onChange={(e) => handleUpdateField(index, 'type', e.target.value)}
                                                            >
                                                                <optgroup label="Standard Fields">
                                                                    <option value="text">Text Input</option>
                                                                    <option value="textarea">Text Area</option>
                                                                    <option value="email">Email</option>
                                                                    <option value="phone">Phone Number</option>
                                                                    <option value="number">Number</option>
                                                                    <option value="date">Date</option>
                                                                    <option value="time">Time</option>
                                                                    <option value="dropdown">Dropdown</option>
                                                                    <option value="multiselect">Multi-select</option>
                                                                    <option value="radio">Radio Buttons</option>
                                                                    <option value="checkbox">Checkboxes</option>
                                                                    <option value="file">File Upload</option>
                                                                    <option value="image">Image Upload</option>
                                                                    <option value="url">URL</option>
                                                                    <option value="password">Password</option>
                                                                </optgroup>
                                                                <optgroup label="Student Profile Fields">
                                                                    <option value="department">Department</option>
                                                                    <option value="year">Year</option>
                                                                    <option value="section">Section</option>
                                                                    <option value="gender">Gender</option>
                                                                    <option value="collegeName">College Name</option>
                                                                    <option value="rollNumber">Roll Number</option>
                                                                    <option value="studentId">Student ID</option>
                                                                    <option value="teamName">Team Name</option>
                                                                    <option value="teamSize">Team Size</option>
                                                                    <option value="skills">Skills</option>
                                                                    <option value="address">Address</option>
                                                                    <option value="emergencyContact">Emergency Contact</option>
                                                                    <option value="customField">Custom Field</option>
                                                                </optgroup>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Placeholder</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="e.g. Enter your roll number"
                                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-[#1a1d24] dark:border-slate-800"
                                                                value={field.placeholder}
                                                                onChange={(e) => handleUpdateField(index, 'placeholder', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid md:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Default Value</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="e.g. CSE"
                                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-[#1a1d24] dark:border-slate-800"
                                                                value={field.defaultValue || ''}
                                                                onChange={(e) => handleUpdateField(index, 'defaultValue', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Help Text</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="e.g. Use 20BE001 format"
                                                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-[#1a1d24] dark:border-slate-800"
                                                                value={field.helpText || ''}
                                                                onChange={(e) => handleUpdateField(index, 'helpText', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="flex gap-4 items-end py-2">
                                                            <label className="flex items-center gap-1.5 text-sm text-slate-650 dark:text-slate-350 cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={field.readOnly}
                                                                    onChange={(e) => handleUpdateField(index, 'readOnly', e.target.checked)}
                                                                />
                                                                Read Only
                                                            </label>
                                                            <label className="flex items-center gap-1.5 text-sm text-slate-650 dark:text-slate-350 cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={field.hidden}
                                                                    onChange={(e) => handleUpdateField(index, 'hidden', e.target.checked)}
                                                                />
                                                                Hidden
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Options for multi-select, dropdown, radio, checkbox */}
                                                    {['dropdown', 'multiselect', 'radio', 'checkbox'].includes(field.type) && (
                                                        <div className="p-4 bg-indigo-55/10 dark:bg-indigo-500/5 rounded-xl border border-indigo-100 dark:border-slate-800">
                                                            <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1 uppercase tracking-wide">
                                                                Options (comma-separated list)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Option 1, Option 2, Option 3"
                                                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1d24] rounded-lg text-sm focus:ring-2 focus:ring-indigo-55"
                                                                value={field.options ? field.options.join(', ') : ''}
                                                                onChange={(e) => handleUpdateField(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Validation Rules */}
                                                    <div className="p-4 bg-slate-50 dark:bg-[#1a1d24] rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Validation Rules</span>
                                                        <div className="grid md:grid-cols-4 gap-4">
                                                            {['text', 'textarea', 'email', 'url', 'password'].includes(field.type) && (
                                                                <>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min Length</label>
                                                                        <input 
                                                                            type="number" 
                                                                            className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white dark:bg-[#20242B]"
                                                                            value={field.validation?.minLength || ''}
                                                                            onChange={(e) => handleUpdateValidation(index, 'minLength', parseInt(e.target.value) || undefined)}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Max Length</label>
                                                                        <input 
                                                                            type="number" 
                                                                            className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white dark:bg-[#20242B]"
                                                                            value={field.validation?.maxLength || ''}
                                                                            onChange={(e) => handleUpdateValidation(index, 'maxLength', parseInt(e.target.value) || undefined)}
                                                                        />
                                                                    </div>
                                                                    <div className="md:col-span-2">
                                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Regular Expression (Regex)</label>
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="e.g. ^[A-Z]{3}\d{3}$"
                                                                            className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white dark:bg-[#20242B]"
                                                                            value={field.validation?.regularExpression || ''}
                                                                            onChange={(e) => handleUpdateValidation(index, 'regularExpression', e.target.value)}
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}
                                                            {field.type === 'number' && (
                                                                <>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min Value</label>
                                                                        <input 
                                                                            type="number" 
                                                                            className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white dark:bg-[#20242B]"
                                                                            value={field.validation?.minValue || ''}
                                                                            onChange={(e) => handleUpdateValidation(index, 'minValue', parseFloat(e.target.value) || undefined)}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Max Value</label>
                                                                        <input 
                                                                            type="number" 
                                                                            className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white dark:bg-[#20242B]"
                                                                            value={field.validation?.maxValue || ''}
                                                                            onChange={(e) => handleUpdateValidation(index, 'maxValue', parseFloat(e.target.value) || undefined)}
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}
                                                            {['file', 'image'].includes(field.type) && (
                                                                <>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">File Size Limit (MB)</label>
                                                                        <input 
                                                                            type="number" 
                                                                            placeholder="e.g. 5"
                                                                            className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white dark:bg-[#20242B]"
                                                                            value={field.validation?.fileSizeLimit || ''}
                                                                            onChange={(e) => handleUpdateValidation(index, 'fileSizeLimit', parseFloat(e.target.value) || undefined)}
                                                                        />
                                                                    </div>
                                                                    <div className="md:col-span-3">
                                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Allowed File Types (comma-separated)</label>
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="e.g. .pdf, .png, .jpg, .zip"
                                                                            className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white dark:bg-[#20242B]"
                                                                            value={field.validation?.allowedFileTypes ? field.validation.allowedFileTypes.join(', ') : ''}
                                                                            onChange={(e) => handleUpdateValidation(index, 'allowedFileTypes', e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))}
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Conditional Visibility Rules */}
                                                    <div className="p-4 bg-slate-50 dark:bg-[#1a1d24] rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Conditional Visibility Rules (Optional)</span>
                                                        <div className="grid md:grid-cols-3 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Depends On (Field ID)</label>
                                                                <select
                                                                    className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white dark:bg-[#20242B]"
                                                                    value={field.visibilityRules?.dependsOnFieldId || ''}
                                                                    onChange={(e) => handleUpdateVisibility(index, 'dependsOnFieldId', e.target.value)}
                                                                >
                                                                    <option value="">-- Select Field --</option>
                                                                    {formData.fields
                                                                        .filter((_, fIdx) => fIdx !== index)
                                                                        .map(f => <option key={f.fieldId} value={f.fieldId}>{f.label || f.fieldId}</option>)
                                                                    }
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Condition</label>
                                                                <select
                                                                    className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white dark:bg-[#20242B]"
                                                                    value={field.visibilityRules?.condition || ''}
                                                                    onChange={(e) => handleUpdateVisibility(index, 'condition', e.target.value)}
                                                                >
                                                                    <option value="">-- Condition --</option>
                                                                    <option value="equals">Equals</option>
                                                                    <option value="notEquals">Does Not Equal</option>
                                                                    <option value="contains">Contains</option>
                                                                    <option value="isNotEmpty">Is Not Empty</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Value</label>
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Target value"
                                                                    className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white dark:bg-[#20242B]"
                                                                    value={field.visibilityRules?.value || ''}
                                                                    onChange={(e) => handleUpdateVisibility(index, 'value', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-8 flex justify-end gap-3 pb-4">
                            <button onClick={resetForm} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2">
                                <Save className="w-4 h-4" /> {editingId ? 'Update Template' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Cards view with search and filter */}
            {!isCreating && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white dark:bg-[#20242B] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="md:col-span-2">
                            <input 
                                type="text"
                                placeholder="Search templates by name..."
                                className="w-full px-4 py-2 border rounded-xl bg-white dark:bg-[#1a1d24] dark:border-slate-800 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div>
                            <select
                                className="w-full px-4 py-2 border rounded-xl bg-white dark:bg-[#1a1d24] dark:border-slate-800 outline-none"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <select
                                className="w-full px-4 py-2 border rounded-xl bg-white dark:bg-[#1a1d24] dark:border-slate-800 outline-none font-bold"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">Loading templates...</div>
                    ) : templates.length === 0 ? (
                        <div className="py-16 text-center bg-white dark:bg-[#20242B] border rounded-2xl text-slate-500">
                            No registration templates found. Click "New Template" to create one.
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.map(template => (
                                <div key={template._id} className="bg-white dark:bg-[#20242B] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:shadow-md transition-all">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{template.templateName}</h3>
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 rounded-full border border-indigo-100/50 dark:border-indigo-500/20 mr-2">
                                                    {template.category}
                                                </span>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${template.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                                                    {template.status}
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => openPreview(template.fields)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 rounded-lg" title="Live Preview">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDuplicate(template._id)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 rounded-lg" title="Duplicate Template">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => exportToJson(template)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 rounded-lg" title="Export as JSON">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleEdit(template)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-655 rounded-lg" title="Edit">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(template._id)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6">{template.description || 'No description provided.'}</p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
                                        <span>{template.fields?.length || 0} fields configured</span>
                                        <span>By {template.createdBy?.username || 'System'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* PREVIEW MODAL */}
            {isPreviewing && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-[#1a1d24] w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
                        {/* Header bar */}
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-[#20242B] p-4 border-b dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-slate-850 dark:text-white">Registration Form Preview</h3>
                                <div className="flex border rounded-lg overflow-hidden bg-white dark:bg-[#1a1d24] border-slate-200 dark:border-slate-800">
                                    <button 
                                        onClick={() => setPreviewMode('desktop')} 
                                        className={`p-2 transition-all ${previewMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <Monitor className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setPreviewMode('tablet')} 
                                        className={`p-2 transition-all ${previewMode === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <Tablet className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setPreviewMode('mobile')} 
                                        className={`p-2 transition-all ${previewMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-455 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <Smartphone className="w-4 h-4" />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => setPreviewTheme(prev => prev === 'light' ? 'dark' : 'light')}
                                    className="p-2 border rounded-lg bg-white dark:bg-[#1a1d24] border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700"
                                >
                                    {previewTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                </button>
                            </div>
                            <button onClick={() => setIsPreviewing(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 bg-slate-100 dark:bg-slate-900/60 p-8 overflow-y-auto flex justify-center items-start">
                            <div className={`w-full transition-all duration-300 p-8 rounded-2xl shadow-sm border ${previewTheme === 'dark' ? 'bg-[#20242B] text-white border-slate-850' : 'bg-white text-slate-850 border-slate-100'} ${getPreviewWidth()}`}>
                                <h4 className="text-xl font-bold mb-1">Registration Details</h4>
                                <p className={`text-xs mb-6 ${previewTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Please complete the following details to register for the event.</p>

                                <form onSubmit={e => e.preventDefault()} className="space-y-5">
                                    {previewFields.map((field) => (
                                        <div key={field.fieldId} className="space-y-1">
                                            <label className="block text-sm font-bold">
                                                {field.label}
                                                {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                            </label>
                                            
                                            {field.helpText && <p className="text-xs text-slate-450">{field.helpText}</p>}

                                            {field.type === 'textarea' ? (
                                                <textarea 
                                                    className="w-full px-3 py-2 border rounded-lg bg-transparent dark:border-slate-800" 
                                                    placeholder={field.placeholder} 
                                                    disabled={field.readOnly}
                                                    defaultValue={field.defaultValue}
                                                />
                                            ) : ['dropdown', 'department', 'year', 'section', 'gender'].includes(field.type) ? (
                                                <select className="w-full px-3 py-2 border rounded-lg bg-transparent dark:border-slate-800">
                                                    <option value="">Select option...</option>
                                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : field.type === 'multiselect' ? (
                                                <div className="p-3 border rounded-lg dark:border-slate-800 space-y-2">
                                                    {field.options?.map(opt => (
                                                        <label key={opt} className="flex items-center gap-2 text-sm font-normal">
                                                            <input type="checkbox" /> {opt}
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : field.type === 'radio' ? (
                                                <div className="flex gap-4">
                                                    {field.options?.map(opt => (
                                                        <label key={opt} className="flex items-center gap-1.5 text-sm font-normal">
                                                            <input type="radio" name={field.fieldId} /> {opt}
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : field.type === 'checkbox' ? (
                                                <div className="flex flex-col gap-2">
                                                    {field.options?.map(opt => (
                                                        <label key={opt} className="flex items-center gap-1.5 text-sm font-normal">
                                                            <input type="checkbox" /> {opt}
                                                        </label>
                                                    ))}
                                                    {(!field.options || field.options.length === 0) && (
                                                        <label className="flex items-center gap-1.5 text-sm font-normal">
                                                            <input type="checkbox" /> I agree to the terms
                                                        </label>
                                                    )}
                                                </div>
                                            ) : ['file', 'image'].includes(field.type) ? (
                                                <div className="border border-dashed p-4 rounded-lg text-center bg-slate-50/50 dark:bg-[#1a1d24]/30 dark:border-slate-800">
                                                    <span className="text-xs text-slate-450">Drag & drop or click to upload file {field.validation?.allowedFileTypes ? `(${field.validation.allowedFileTypes.join(', ')})` : ''}</span>
                                                    <input type="file" className="hidden" />
                                                </div>
                                            ) : (
                                                <input 
                                                    type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
                                                    className="w-full px-3 py-2 border rounded-lg bg-transparent dark:border-slate-800" 
                                                    placeholder={field.placeholder}
                                                    disabled={field.readOnly}
                                                    defaultValue={field.defaultValue}
                                                />
                                            )}
                                        </div>
                                    ))}

                                    <button type="button" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors mt-4">
                                        Submit Registration
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationTemplates;
