import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Layout, Edit, Save, X, ArrowLeft, Eye, MessageSquare, Send } from 'lucide-react';
import { useConfirm } from '../../contexts/ConfirmContext';

const FeedbackTemplates = () => {
    const { confirm } = useConfirm();
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        fields: []
    });

    const resetForm = () => {
        setIsCreating(false);
        setEditingId(null);
        setFormData({ name: '', description: '', fields: [] });
    };

    const handleEdit = (template) => {
        setFormData({
            name: template.name,
            description: template.description || '',
            fields: JSON.parse(JSON.stringify(template.fields || []))
        });
        setEditingId(template._id);
        setIsCreating(true);
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await axios.get(`/api/feedback-templates`);
            setTemplates(res.data);
        } catch (error) {
            toast.error('Failed to load templates');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTemplateField = () => {
        setFormData({
            ...formData,
            fields: [
                ...formData.fields,
                { label: '', type: 'text', required: false, options: [] }
            ]
        });
    };

    const handleRemoveTemplateField = (index) => {
        const newFields = [...formData.fields];
        newFields.splice(index, 1);
        setFormData({ ...formData, fields: newFields });
    };

    const handleUpdateTemplateField = (index, key, value) => {
        const newFields = [...formData.fields];
        newFields[index][key] = value;
        setFormData({ ...formData, fields: newFields });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name) {
            return toast.error('Template name is required');
        }

        try {
            if (editingId) {
                await axios.put(`/api/feedback-templates/${editingId}`, formData);
                toast.success('Template updated successfully');
            } else {
                await axios.post(`/api/feedback-templates`, formData);
                toast.success('Template created successfully');
            }
            resetForm();
            fetchTemplates();
        } catch (error) {
            toast.error(editingId ? 'Failed to update template' : 'Failed to save template');
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm('Are you sure you want to delete this template?');
        if (!confirmed) return;
        try {
            await axios.delete(`/api/feedback-templates/${id}`);
            toast.success('Template deleted');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    if (isLoading) return <div className="p-8">Loading templates...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-2 mb-[-1rem]">
                <Link to="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
            </div>
            <div className="flex justify-between items-center bg-white dark:bg-[#20242B] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:text-white">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Feedback Templates</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage reusable feedback forms for events.</p>
                </div>
                {!isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-5 h-5" /> New Template
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="bg-white dark:bg-[#20242B] p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 dark:text-white">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                            <Layout className="w-5 h-5" /> {editingId ? 'Edit Template' : 'Create Template'}
                        </h2>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Template Name</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                                placeholder="e.g. Standard Workshop Feedback"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description (Optional)</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                                placeholder="e.g. Use this for general technical workshops"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Form Fields</h3>
                            <div className="flex gap-2">
                                <select 
                                    className="text-sm border rounded-lg px-3 py-1 bg-slate-50 dark:bg-[#1a1d24] text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        const templates = {
                                            rating: { label: 'Overall Rating', type: 'number', required: true },
                                            experience: { label: 'How was your experience?', type: 'textarea', required: true },
                                            recommend: { label: 'Would you recommend us?', type: 'dropdown', required: true, options: ['Definitely', 'Maybe', 'No'] },
                                        };
                                        setFormData({
                                            ...formData,
                                            fields: [...formData.fields, templates[e.target.value]]
                                        });
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">Quick Add Field...</option>
                                    <option value="rating">Overall Rating</option>
                                    <option value="experience">Experience Textarea</option>
                                    <option value="recommend">Recommend Select</option>
                                </select>
                                <button 
                                    onClick={handleAddTemplateField}
                                    className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-500/20"
                                >
                                    <Plus className="w-4 h-4" /> Custom Field
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {formData.fields.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-[#1a1d24] text-slate-500 dark:text-slate-400">
                                    No fields added yet.
                                </div>
                            ) : (
                                formData.fields.map((field, index) => (
                                    <div key={index} className="p-4 border rounded-xl flex gap-4 items-start bg-slate-50/50">
                                        <div className="flex-1 space-y-4">
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <input 
                                                    type="text" 
                                                    placeholder="Field Label" 
                                                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-[#20242B] dark:text-white"
                                                    value={field.label}
                                                    onChange={(e) => handleUpdateTemplateField(index, 'label', e.target.value)}
                                                />
                                                <select 
                                                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-[#20242B] dark:text-white"
                                                    value={field.type}
                                                    onChange={(e) => handleUpdateTemplateField(index, 'type', e.target.value)}
                                                >
                                                    <option value="text">Text Input</option>
                                                    <option value="textarea">Text Area</option>
                                                    <option value="dropdown">Dropdown</option>
                                                    <option value="radio">Radio Group</option>
                                                    <option value="checkbox">Checkbox</option>
                                                    <option value="number">Rating / Number</option>
                                                </select>
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={field.required}
                                                            onChange={(e) => handleUpdateTemplateField(index, 'required', e.target.checked)}
                                                        />
                                                        Required
                                                    </label>
                                                    <button type="button" onClick={() => handleRemoveTemplateField(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg ml-auto">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {['dropdown', 'radio', 'checkbox'].includes(field.type) && (
                                                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                                    <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2 uppercase tracking-wide">
                                                        Options (comma-separated)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Option 1, Option 2, Option 3"
                                                        className="w-full px-3 py-2 text-sm bg-white dark:bg-[#20242B] border border-indigo-200 dark:border-indigo-500/30 rounded-lg dark:text-white"
                                                        value={field.options ? field.options.join(', ') : ''}
                                                        onChange={(e) => handleUpdateTemplateField(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="mt-6 flex justify-between items-center">
                            <button 
                                onClick={() => setShowPreview(true)} 
                                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/30 transition-all"
                            >
                                <Eye className="w-4 h-4" /> Live Preview
                            </button>
                            <div className="flex gap-3">
                                <button onClick={resetForm} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleSubmit} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all">
                                    <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.length === 0 && !isCreating ? (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-[#20242B] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm dark:text-white">
                        No feedback templates found. Create one to get started!
                    </div>
                ) : (
                    templates.map(template => (
                        <div key={template._id} className="bg-white dark:bg-[#20242B] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col dark:text-white">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{template.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{template.description || 'No description'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(template)} className="text-indigo-400 hover:text-indigo-600 p-1">
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(template._id)} className="text-red-400 hover:text-red-600 p-1">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">{template.fields?.length || 0} Fields</span>
                                <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-full">
                                    Created by {template.createdBy?.username || 'Unknown'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Live Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
                    <div 
                        className="bg-white dark:bg-[#20242B] p-8 rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative dark:text-white border border-slate-100 dark:border-slate-800"
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setShowPreview(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                <MessageSquare className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Feedback Preview</h3>
                                <p className="text-slate-500 font-medium">{formData.name || 'Untitled Template'}</p>
                            </div>
                        </div>

                        {formData.fields.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                No fields to preview. Add fields to the template first.
                            </div>
                        ) : (
                            <div className="space-y-6 pointer-events-none">
                                {formData.fields.map((field, i) => (
                                    <div key={i} className="space-y-2 bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {field.label || 'Untitled Field'} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        
                                        {field.type === 'textarea' ? (
                                            <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1d24] h-24 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Type your answer here..." readOnly />
                                        ) : field.type === 'dropdown' ? (
                                            <select className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1d24] text-sm focus:ring-2 focus:ring-indigo-500" disabled>
                                                <option value="">Select option</option>
                                                {field.options && field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : field.type === 'radio' ? (
                                            <div className="flex flex-wrap gap-4 mt-2">
                                                {field.options && field.options.map(opt => (
                                                    <label key={opt} className="flex items-center gap-2 cursor-pointer bg-white dark:bg-[#1a1d24] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                                        <input type="radio" disabled className="w-4 h-4 text-indigo-600" />
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : field.type === 'checkbox' ? (
                                            <div className="space-y-3 mt-2">
                                                {field.options && field.options.map(opt => (
                                                    <label key={opt} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                                        <input type="checkbox" disabled className="w-4 h-4 rounded text-indigo-600" />
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : field.type === 'number' ? (
                                            <div className="flex items-center gap-3 mt-2">
                                                {[1, 2, 3, 4, 5].map((num) => (
                                                    <div key={num} className="w-12 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1d24] flex items-center justify-center font-black text-slate-400">
                                                        {num}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1a1d24] text-sm focus:ring-2 focus:ring-indigo-500" placeholder="Type your answer here..." readOnly />
                                        )}
                                    </div>
                                ))}

                                <div className="pt-6">
                                    <button type="button" className="w-full py-4 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-black rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                                        Submit Feedback <Send className="w-5 h-5" />
                                    </button>
                                    <p className="text-center text-xs text-slate-400 mt-3 font-medium">This is a preview. Interactions are disabled.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackTemplates;
