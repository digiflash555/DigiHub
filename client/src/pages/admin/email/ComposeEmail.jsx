import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
    Send, Save, Clock, Users, Eye, X, Plus, Loader2,
    Calendar, ChevronDown, CheckSquare, Square, Globe, Tag
} from 'lucide-react';

const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
    ],
};

const GROUP_COLORS = {
    'Registered Participants': 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    'Attended Participants':   'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    'Event Volunteers':        'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700',
    'Faculty':                 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
    'Event Coordinators':      'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
    'Everyone in Event':       'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
    // Generic groups
    'All Users':               'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
    'Participants':            'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
};

const GENERIC_GROUPS = ['All Users', 'Faculty', 'Event Coordinators', 'Participants'];

/* ── small chip component ─────────────────────── */
const GroupChip = ({ label, count, selected, onClick, colorClass }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black border transition-all ${
            selected
                ? 'ring-2 ring-offset-1 ring-indigo-400 ' + colorClass
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
        }`}
    >
        {selected ? <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" /> : <Square className="w-3.5 h-3.5 flex-shrink-0" />}
        {label}
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
            selected ? 'bg-white/60 text-inherit' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
        }`}>{count}</span>
    </button>
);

/* ══════════════════════════════════════════════ */
const ComposeEmail = () => {
    // --- Events
    const [events, setEvents]       = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [eventGroups, setEventGroups]         = useState(null);  // resolved from API
    const [loadingEvent, setLoadingEvent]       = useState(false);

    // --- Generic groups
    const [genericGroupCounts, setGenericGroupCounts] = useState({});

    // --- Selection state: { groupLabel: bool }
    const [selectedGroups, setSelectedGroups] = useState({});

    // --- Manual emails
    const [specificEmail, setSpecificEmail]   = useState('');
    const [specificEmails, setSpecificEmails] = useState([]);

    // --- Compose fields
    const [subject, setSubject]   = useState('');
    const [body, setBody]         = useState('');
    const [cc, setCc]             = useState('');
    const [bcc, setBcc]           = useState('');
    const [scheduledDate, setScheduledDate] = useState('');

    // --- UI
    const [showPreview, setShowPreview] = useState(false);
    const [sending, setSending] = useState(false);
    const [saving,  setSaving]  = useState(false);
    const [mode, setMode]       = useState('event'); // 'event' | 'generic'

    /* Load event list + generic group counts on mount */
    useEffect(() => {
        axios.get('/api/email/events').then(r => setEvents(r.data)).catch(() => {});
        axios.get('/api/email/recipient-groups').then(r => setGenericGroupCounts(r.data)).catch(() => {});
    }, []);

    /* When event selection changes, fetch its recipients */
    useEffect(() => {
        if (!selectedEventId) { setEventGroups(null); setSelectedGroups({}); return; }
        setLoadingEvent(true);
        setSelectedGroups({});
        axios.get(`/api/email/event-recipients/${selectedEventId}`)
            .then(r => setEventGroups(r.data.groups))
            .catch(() => toast.error('Failed to load event recipients'))
            .finally(() => setLoadingEvent(false));
    }, [selectedEventId]);

    const toggleGroup = (label) =>
        setSelectedGroups(prev => ({ ...prev, [label]: !prev[label] }));

    const addSpecificEmail = () => {
        const e = specificEmail.trim();
        if (e && !specificEmails.includes(e)) {
            setSpecificEmails(prev => [...prev, e]);
            setSpecificEmail('');
        }
    };

    /* Compute a deduplicated email list from all selected groups */
    const resolveSelectedEmails = () => {
        const set = new Set(specificEmails);

        if (mode === 'event' && eventGroups) {
            Object.entries(selectedGroups).forEach(([label, on]) => {
                if (on && eventGroups[label]) {
                    eventGroups[label].emails.forEach(e => set.add(e));
                }
            });
        } else {
            // Generic groups — server resolves during send
        }
        return [...set];
    };

    const activeGroupLabels = Object.entries(selectedGroups)
        .filter(([, v]) => v)
        .map(([k]) => k);

    const totalRecipients = mode === 'event'
        ? resolveSelectedEmails().length
        : specificEmails.length +
          activeGroupLabels.reduce((s, g) => s + (genericGroupCounts[g] || 0), 0);

    const handleSend = async (schedule = false) => {
        if (!subject) return toast.error('Subject is required');
        if (!body)    return toast.error('Email body is required');
        if (totalRecipients === 0 && specificEmails.length === 0)
            return toast.error('Select at least one recipient group or email');

        setSending(true);
        try {
            let payload;

            if (mode === 'event') {
                // We send the fully resolved email list
                const resolvedEmails = resolveSelectedEmails();
                payload = {
                    subject, body,
                    recipientGroups: activeGroupLabels,
                    specificUsers:   resolvedEmails,
                    cc: cc ? cc.split(',').map(x => x.trim()) : [],
                    bcc: bcc ? bcc.split(',').map(x => x.trim()) : [],
                    scheduledDate: schedule && scheduledDate ? new Date(scheduledDate).toISOString() : null,
                };
            } else {
                payload = {
                    subject, body,
                    recipientGroups: activeGroupLabels,
                    specificUsers:   specificEmails,
                    cc: cc ? cc.split(',').map(x => x.trim()) : [],
                    bcc: bcc ? bcc.split(',').map(x => x.trim()) : [],
                    scheduledDate: schedule && scheduledDate ? new Date(scheduledDate).toISOString() : null,
                };
            }

            const res = await axios.post('/api/email/send', payload);
            toast.success(res.data.message);
            // Reset
            setSubject(''); setBody(''); setSelectedGroups({});
            setSpecificEmails([]); setCc(''); setBcc(''); setScheduledDate('');
            setSelectedEventId(''); setEventGroups(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send');
        } finally {
            setSending(false);
        }
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            await axios.post('/api/email/drafts', {
                subject, body,
                recipientGroups: activeGroupLabels,
                individualRecipients: specificEmails,
            });
            toast.success('Draft saved!');
        } catch {
            toast.error('Failed to save draft');
        } finally {
            setSaving(false);
        }
    };

    const eventsStatusColor = (s) => ({
        Upcoming: 'text-emerald-600', Ongoing: 'text-amber-600',
        Completed: 'text-indigo-500', Draft: 'text-slate-400', Cancelled: 'text-red-400',
    }[s] || 'text-slate-400');

    return (
        <div className="space-y-6 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Compose Email</h2>
                <div className="flex gap-2">
                    <button onClick={handleSaveDraft} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
                    </button>
                    <button onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                        <Eye className="w-4 h-4" /> Preview
                    </button>
                </div>
            </div>

            {/* ── Recipient Mode Toggle ── */}
            <div className="flex gap-0 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                <button onClick={() => { setMode('event'); setSelectedGroups({}); }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all ${
                        mode === 'event'
                            ? 'bg-white dark:bg-[#20242B] text-indigo-600 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                    }`}>
                    <Calendar className="w-4 h-4" /> By Event
                </button>
                <button onClick={() => { setMode('generic'); setSelectedGroups({}); setSelectedEventId(''); setEventGroups(null); }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all ${
                        mode === 'generic'
                            ? 'bg-white dark:bg-[#20242B] text-indigo-600 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                    }`}>
                    <Globe className="w-4 h-4" /> Global Groups
                </button>
            </div>

            {/* ── Event Picker (mode=event) ── */}
            {mode === 'event' && (
                <div className="space-y-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                    <label className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" /> 1. Select Event
                    </label>

                    <div className="relative">
                        <select
                            value={selectedEventId}
                            onChange={e => setSelectedEventId(e.target.value)}
                            className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                        >
                            <option value="">— Choose an event —</option>
                            {events.map(ev => (
                                <option key={ev._id} value={ev._id}>
                                    {ev.title} ({ev.status})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {loadingEvent && (
                        <div className="flex items-center gap-2 text-sm text-indigo-500 font-bold">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading recipients…
                        </div>
                    )}

                    {!loadingEvent && eventGroups && (
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" /> 2. Select Recipient Groups
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(eventGroups).map(([label, { count }]) => (
                                    <GroupChip
                                        key={label}
                                        label={label}
                                        count={count}
                                        selected={!!selectedGroups[label]}
                                        onClick={() => toggleGroup(label)}
                                        colorClass={GROUP_COLORS[label] || 'bg-indigo-100 text-indigo-700 border-indigo-300'}
                                    />
                                ))}
                            </div>
                            {/* Selected summary */}
                            {activeGroupLabels.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                    <span className="text-xs font-black text-slate-500">Selected:</span>
                                    {activeGroupLabels.map(g => (
                                        <span key={g} className={`px-2.5 py-1 rounded-lg text-xs font-black border ${GROUP_COLORS[g] || 'bg-indigo-100 text-indigo-700 border-indigo-300'}`}>
                                            {g} ({eventGroups[g]?.count || 0})
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!loadingEvent && !eventGroups && !selectedEventId && (
                        <p className="text-xs text-slate-400 font-medium">Select an event above to see its recipient groups.</p>
                    )}
                </div>
            )}

            {/* ── Generic Group Picker (mode=generic) ── */}
            {mode === 'generic' && (
                <div className="space-y-3 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                    <label className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" /> Select Global Groups
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {GENERIC_GROUPS.map(g => (
                            <GroupChip
                                key={g}
                                label={g}
                                count={genericGroupCounts[g] ?? '…'}
                                selected={!!selectedGroups[g]}
                                onClick={() => toggleGroup(g)}
                                colorClass={GROUP_COLORS[g] || 'bg-slate-100 text-slate-700 border-slate-300'}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Recipient Count Badge ── */}
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-300">
                    {totalRecipients} total recipient{totalRecipients !== 1 ? 's' : ''}
                </span>
            </div>

            {/* ── Specific Individual Emails ── */}
            <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" /> Add Individual Emails
                </label>
                <div className="flex gap-2">
                    <input
                        value={specificEmail}
                        onChange={e => setSpecificEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSpecificEmail()}
                        placeholder="email@example.com — press Enter"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                    <button onClick={addSpecificEmail}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                {specificEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {specificEmails.map(e => (
                            <span key={e} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold">
                                {e}
                                <button onClick={() => setSpecificEmails(prev => prev.filter(x => x !== e))}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* ── CC / BCC ── */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">CC</label>
                    <input value={cc} onChange={e => setCc(e.target.value)}
                        placeholder="email1@x.com, email2@x.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">BCC</label>
                    <input value={bcc} onChange={e => setBcc(e.target.value)}
                        placeholder="email1@x.com, email2@x.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                </div>
            </div>

            {/* ── Subject ── */}
            <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Subject *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="Email Subject"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                />
            </div>

            {/* ── Body ── */}
            <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Body *</label>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 dark-quill">
                    <ReactQuill
                        theme="snow"
                        value={body}
                        onChange={setBody}
                        modules={quillModules}
                        className="bg-white dark:bg-slate-800 min-h-[200px]"
                    />
                </div>
            </div>

            {/* ── Schedule & Send ── */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-300 outline-none"
                    />
                </div>
                <div className="ml-auto flex gap-3">
                    <button onClick={() => handleSend(true)} disabled={!scheduledDate || sending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all">
                        <Clock className="w-4 h-4" /> Schedule
                    </button>
                    <button onClick={() => handleSend(false)} disabled={sending}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {sending ? 'Sending…' : 'Send Now'}
                    </button>
                </div>
            </div>

            {/* ── Preview Modal ── */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#20242B] rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-auto p-8 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Email Preview</h3>
                            <button onClick={() => setShowPreview(false)}
                                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-3 bg-slate-50 dark:bg-slate-900">
                            <div className="text-xs text-slate-500 font-bold space-y-1">
                                <div><span className="uppercase tracking-widest">To:</span>{' '}
                                    {activeGroupLabels.join(', ') || '—'}{specificEmails.length > 0 ? ` + ${specificEmails.length} individual` : ''}
                                </div>
                                <div><span className="uppercase tracking-widest">Total Recipients:</span>{' '}
                                    <span className="text-indigo-600 font-black">{totalRecipients}</span>
                                </div>
                                <div><span className="uppercase tracking-widest">Subject:</span>{' '}
                                    <span className="text-slate-900 dark:text-white font-bold">{subject || '(No subject)'}</span>
                                </div>
                            </div>
                            <hr className="border-slate-200 dark:border-slate-700" />
                            <div
                                className="prose prose-sm max-w-none dark:prose-invert text-slate-700 dark:text-slate-300"
                                dangerouslySetInnerHTML={{ __html: body || '<em>No content</em>' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComposeEmail;
