import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Save, RefreshCw, ChevronDown, ChevronUp, Loader2, Tag, Calendar, Globe, Trash2 } from 'lucide-react';

const quillModules = {
    toolbar: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        [{ color: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
    ],
};

const TRIGGER_LABELS = {
    USER_REGISTRATION:        { label: 'User Registration',            color: 'bg-emerald-100 text-emerald-700' },
    EVENT_CREATION:           { label: 'New Event Creation',           color: 'bg-indigo-100 text-indigo-700' },
    EVENT_REGISTRATION:       { label: 'Event Registration',           color: 'bg-blue-100 text-blue-700' },
    REGISTRATION_CANCELLATION:{ label: 'Registration Cancellation',    color: 'bg-red-100 text-red-700' },
    EVENT_CANCELLATION:       { label: 'Event Cancellation',           color: 'bg-orange-100 text-orange-700' },
    VOLUNTEER_ASSIGNMENT:     { label: 'Volunteer Assignment',         color: 'bg-violet-100 text-violet-700' },
    CERTIFICATE_AVAILABLE:    { label: 'Certificate Available',        color: 'bg-amber-100 text-amber-700' },
    FEEDBACK_REQUEST:         { label: 'Feedback Request',             color: 'bg-pink-100 text-pink-700' },
};

const TemplateCard = ({ tmpl, onSave, eventId }) => {
    const [expanded, setExpanded] = useState(false);
    const [subject, setSubject] = useState(tmpl.subject);
    const [body, setBody] = useState(tmpl.body);
    const [enabled, setEnabled] = useState(tmpl.enabled);
    const [saving, setSaving] = useState(false);
    const [reverting, setReverting] = useState(false);

    useEffect(() => {
        setSubject(tmpl.subject);
        setBody(tmpl.body);
        setEnabled(tmpl.enabled);
    }, [tmpl]);

    const meta = TRIGGER_LABELS[tmpl.trigger] || { label: tmpl.trigger, color: 'bg-slate-100 text-slate-600' };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(`/api/email/templates/${tmpl._id}`, { subject, body, enabled, eventId });
            toast.success(eventId && !tmpl.isOverride ? `Custom template created for this event!` : `Template updated!`);
            onSave();
        } catch {
            toast.error('Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const handleRevert = async () => {
        if (!window.confirm('Are you sure you want to remove this custom event template and revert to the global default?')) return;
        setReverting(true);
        try {
            await axios.delete(`/api/email/templates/${tmpl._id}`);
            toast.success('Reverted to global default template.');
            onSave();
        } catch {
            toast.error('Failed to revert template');
        } finally {
            setReverting(false);
        }
    };

    return (
        <div className={`rounded-2xl border transition-all ${expanded ? 'border-indigo-300 dark:border-indigo-700 shadow-md' : 'border-slate-200 dark:border-slate-700'} overflow-hidden`}>
            <div
                className="flex items-center justify-between p-5 cursor-pointer bg-white dark:bg-[#20242B] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black ${meta.color}`}>{meta.label}</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white truncate">{subject}</span>
                    {eventId && (
                        tmpl.isOverride ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                                CUSTOM
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                GLOBAL DEFAULT
                            </span>
                        )
                    )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <button
                        onClick={e => { e.stopPropagation(); setEnabled(v => !v); }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                    <span className="text-xs font-bold text-slate-400">{enabled ? 'Active' : 'Disabled'}</span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
            </div>

            {expanded && (
                <div className="p-5 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    {/* Available variables */}
                    {tmpl.availableVariables?.length > 0 && (
                        <div className="flex items-start gap-2">
                            <Tag className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1.5">
                                <span className="text-xs font-black text-slate-500 mr-1">Variables:</span>
                                {tmpl.availableVariables.map(v => (
                                    <span key={v} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded text-xs font-mono">
                                        {`{{${v}}}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subject */}
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Subject</label>
                        <input value={subject} onChange={e => setSubject(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Body</label>
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <ReactQuill theme="snow" value={body} onChange={setBody} modules={quillModules}
                                className="bg-white dark:bg-slate-800 min-h-[150px]"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        {eventId && tmpl.isOverride ? (
                            <button onClick={handleRevert} disabled={reverting}
                                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-sm font-bold transition-all disabled:opacity-60">
                                {reverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Revert to Global Default
                            </button>
                        ) : <div></div>}

                        <button onClick={handleSave} disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-60">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {eventId && !tmpl.isOverride ? 'Customize for this Event' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const EmailTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');

    useEffect(() => {
        axios.get('/api/email/events').then(r => setEvents(r.data)).catch(() => {});
    }, []);

    const fetchTemplates = () => {
        setLoading(true);
        const url = selectedEventId ? `/api/email/templates?eventId=${selectedEventId}` : '/api/email/templates';
        axios.get(url)
            .then(r => setTemplates(r.data))
            .catch(() => toast.error('Failed to load templates'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchTemplates(); }, [selectedEventId]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Automatic Email Templates</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Configure automatic emails triggered by system events. You can customize them globally or for specific events.
                    </p>
                </div>
                <button onClick={fetchTemplates} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500 dark:text-slate-400">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Event Selector */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-500 shadow-sm">
                        {selectedEventId ? <Calendar className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Editing Mode</label>
                        <select
                            value={selectedEventId}
                            onChange={e => setSelectedEventId(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer pr-4"
                        >
                            <option value="">Global Templates (Default)</option>
                            <optgroup label="Event-Specific Overrides">
                                {events.map(ev => (
                                    <option key={ev._id} value={ev._id}>{ev.title}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <p className="font-bold">No templates found. Please restart the server to seed defaults.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {templates.map(tmpl => (
                        <TemplateCard key={tmpl._id} tmpl={tmpl} onSave={fetchTemplates} eventId={selectedEventId} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmailTemplates;
