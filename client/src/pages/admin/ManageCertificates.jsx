import { getImageUrl } from '../../utils/imageUrl';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Award, Upload, Save, Eye, Plus, Trash2,
    ChevronLeft, Loader2, Maximize2, Settings2,
    Type, Hash, Palette, Move, AlignLeft,
    AlignCenter, AlignRight, AlignJustify, Bold, Italic
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../../contexts/ConfirmContext';
import { renderCertificateCanvas, downloadCertificateAsPDF } from '../../utils/renderCertificateCanvas';


const ManageCertificates = () => {
    const { confirm } = useConfirm();
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [config, setConfig] = useState({ fields: [] });
    const [templateFile, setTemplateFile] = useState(null);
    const [templatePreview, setTemplatePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isBulkSending, setIsBulkSending] = useState(false);
    const [sendTarget, setSendTarget] = useState('both');

    const canvasRef = useRef(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get(`/api/events`);
                setEvents(res.data);
            } catch (error) {
                toast.error('Failed to load events');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            fetchConfig(selectedEventId);
        }
    }, [selectedEventId]);

    const fetchConfig = async (eventId) => {
        try {
            const res = await axios.get(`/api/certificates/config/${eventId}`);
            const data = res.data || { fields: [], template: '' };
            // Normalize fields to ensure variableColors/Styles/Families are always plain objects
            if (data.fields) {
                data.fields = data.fields.map(f => ({
                    ...f,
                    variableColors: f.variableColors || {},
                    variableFontStyles: f.variableFontStyles || {},
                    variableFontFamilies: f.variableFontFamilies || {},
                }));
            }
            setConfig(data);
            if (data.template) {
                setTemplatePreview(getImageUrl(data.template));
            } else {
                setTemplatePreview(null);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to load certificate configuration';
            toast.error(msg);
        }
    };

    const handleTemplateUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTemplateFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setTemplatePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const addField = () => {
        const newField = {
            type: 'Text',
            text: 'This is to certify that {Prefix} {Name} of {Year&Department} has participated in {EventName}.',
            x: 400,
            y: 300,
            fontSize: 24,
            color: '#000000',
            fontFamily: 'Helvetica',
            variableColors: {},
            variableFontStyles: {},
            variableFontFamilies: {},
            fontStyle: 'normal',
            alignment: 'center',
            width: 600
        };
        setConfig({ ...config, fields: [...config.fields, newField] });
    };

    const updateField = (index, updates) => {
        const newFields = [...config.fields];
        newFields[index] = { ...newFields[index], ...updates };
        setConfig({ ...config, fields: newFields });
    };

    const removeField = (index) => {
        const newFields = config.fields.filter((_, i) => i !== index);
        setConfig({ ...config, fields: newFields });
    };

    const saveConfig = async () => {
        if (!selectedEventId) {
            toast.error('Please select an event first.');
            return;
        }
        if (config.fields.length === 0 && !config.template) {
            toast.error('Please add at least one field or upload a template before saving.');
            return;
        }

        setIsSaving(true);
        const formData = new FormData();
        if (templateFile) {
            formData.append('template', templateFile);
        }

        // Clean fields before sending: remove any legacy keys, ensure proper structure
        const cleanFields = (config.fields || []).map(f => ({
            type: f.type,
            text: f.text || '',
            x: Number(f.x) || 0,
            y: Number(f.y) || 0,
            fontSize: Number(f.fontSize) || 20,
            color: f.color || '#000000',
            fontStyle: f.fontStyle || 'normal',
            fontFamily: f.fontFamily || 'Helvetica',
            alignment: f.alignment || 'left',
            width: Number(f.width) || 600,
            variableColors: f.variableColors || {},
            variableFontStyles: f.variableFontStyles || {},
            variableFontFamilies: f.variableFontFamilies || {},
            underlineVariables: !!f.underlineVariables,
        }));

        const configToSave = { ...config, fields: cleanFields };
        formData.append('config', JSON.stringify(configToSave));

        try {
            const res = await axios.post(`/api/certificates/config/${selectedEventId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Certificate configuration saved!');
            const data = res.data || {};
            // Normalize returned data just like fetchConfig does
            if (data.fields) {
                data.fields = data.fields.map(f => ({
                    ...f,
                    variableColors: f.variableColors || {},
                    variableFontStyles: f.variableFontStyles || {},
                    variableFontFamilies: f.variableFontFamilies || {},
                }));
            }
            setConfig(data);
            if (data.template) {
                setTemplatePreview(getImageUrl(data.template));
            }
        } catch (error) {
            const serverMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to save configuration';
            toast.error(serverMsg);
            console.error('[Certificate Save Error]', error.response?.data || error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Download PDF — renders on canvas then embeds as image, guaranteeing
    // the downloaded PDF is pixel-identical to the on-screen preview.
    const handlePreview = async () => {
        if (!selectedEventId || !config.template) {
            toast.error('Please upload a template before previewing.');
            return;
        }
        setIsPreviewing(true);
        try {
            const selectedEvent = events.find(e => e._id === selectedEventId);
            const dummyParticipant = {
                username           : 'Murugan',
                gender             : 'Male',
                yearAndDept        : 'III B.E. CSE',
                registrationNumber : 'ST12345',
                collegeName        : 'Saranathan College of Engineering',
            };
            const dummyEvent = {
                title    : selectedEvent?.title || 'Event Name',
                eventDate: selectedEvent?.eventDate || new Date().toISOString(),
            };
            await downloadCertificateAsPDF(
                dummyParticipant,
                dummyEvent,
                config,
                'REG98765',
                `Preview_${(selectedEvent?.title || 'Certificate').replace(/\s+/g, '_')}.pdf`
            );
        } catch (err) {
            console.error('Preview PDF error:', err);
            toast.error('Failed to generate preview PDF');
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleBulkSend = async () => {
        if (!selectedEventId) return;

        let confirmMsg = 'This will email certificates to ';
        if (sendTarget === 'participants') confirmMsg += 'ALL eligible participants (attended + feedback submitted)';
        else if (sendTarget === 'volunteers') confirmMsg += 'ALL approved volunteers for this event';
        else confirmMsg += 'ALL eligible participants and approved volunteers';
        confirmMsg += '. Continue?';

        const confirmed = await confirm(confirmMsg);
        if (!confirmed) return;

        setIsBulkSending(true);
        try {
            const res = await axios.post(`/api/certificates/bulk-send/${selectedEventId}`, {
                target: sendTarget
            });
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Bulk send failed');
        } finally {
            setIsBulkSending(false);
        }
    };

    // Live canvas preview — uses the exact same renderer as PDF generation
    // so what you see is exactly what gets downloaded.
    useEffect(() => {
        if (!canvasRef.current || !templatePreview) return;

        const selectedEvent = events.find(e => e._id === selectedEventId);
        const dummyParticipant = {
            username           : 'Murugan',
            gender             : 'Male',
            yearAndDept        : 'III B.E. CSE',
            registrationNumber : 'ST12345',
            collegeName        : 'Saranathan College of Engineering',
        };
        const dummyEvent = {
            title    : selectedEvent?.title    || 'Event Name',
            eventDate: selectedEvent?.eventDate || new Date().toISOString(),
        };

        renderCertificateCanvas(
            canvasRef.current,
            dummyParticipant,
            dummyEvent,
            { ...config, template: templatePreview },
            'REG98765'
        ).then(() => {
            // After the shared renderer finishes, overlay the indigo position dots
            // so the admin can see where each field anchor sits.
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            (config.fields || []).forEach(field => {
                ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
                ctx.beginPath();
                ctx.arc(field.x, field.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }, [templatePreview, config, selectedEventId, events]);

    return (
        <div className="space-y-12 pb-40">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-end gap-6">
                <div className="space-y-4">
                    <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors text-sm">
                        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Certificate <span className="text-reveal">Studio.</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-md">
                        Design and distribute dynamic certificates for your events.
                    </p>
                </div>
                {selectedEventId && (
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 border-2 border-emerald-600 rounded-2xl bg-white dark:bg-[#20242B] pr-2 overflow-hidden dark:text-white">
                            <button
                                onClick={handleBulkSend}
                                disabled={isBulkSending || !config.template || !config.fields || config.fields.length === 0}
                                className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-black hover:bg-emerald-50 transition-all duration-300 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border-r-2 border-emerald-600"
                                title={!config.template ? 'Upload a template first' : !config.fields || config.fields.length === 0 ? 'Add fields first' : ''}
                            >
                                {isBulkSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Award className="w-6 h-6" />}
                                Bulk Send
                            </button>
                            <select
                                value={sendTarget}
                                onChange={e => setSendTarget(e.target.value)}
                                className="bg-transparent text-emerald-700 dark:text-emerald-300 font-bold text-sm outline-none cursor-pointer pl-2 h-full"
                                disabled={isBulkSending}
                            >
                                <option value="both">Participants + Volunteers</option>
                                <option value="participants">Participants Only</option>
                                <option value="volunteers">Volunteers Only</option>
                            </select>
                        </div>
                        <button
                            onClick={saveConfig}
                            disabled={isSaving}
                            className="btn-premium flex items-center gap-3"
                        >
                            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                            Save Configuration
                        </button>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Sidebar - Event Selection & Template */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-[#20242B] rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 dark:text-white">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest block pl-1">Select Event</label>
                            <select
                                className="input-premium w-full"
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                            >
                                <option value="">Choose an event...</option>
                                {events.map(event => (
                                    <option key={event._id} value={event._id}>{event.title}</option>
                                ))}
                            </select>
                        </div>

                        {selectedEventId && (
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest block pl-1">Template Image</label>
                                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 mb-3 transition-colors" />
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Click to upload</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">JPG, PNG, WEBP</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleTemplateUpload} />
                                </label>
                            </div>
                        )}
                    </div>

                    {selectedEventId && (
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-white space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                                    <Settings2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black">Controls</h3>
                            </div>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Use the field editor to map participant data onto your certificate template. Coordinates are in pixels (800x565).
                            </p>
                            {!config.template && (
                                <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4">
                                    <p className="text-amber-300 text-xs font-bold">⚠️ Upload a template image to enable preview and bulk send</p>
                                </div>
                            )}
                            {config.template && (!config.fields || config.fields.length === 0) && (
                                <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4">
                                    <p className="text-amber-300 text-xs font-bold">⚠️ Add at least one field to enable bulk send</p>
                                </div>
                            )}
                            <button
                                onClick={addField}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20"
                            >
                                <Plus className="w-5 h-5" /> Add New Field
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content - Preview & Editor */}
                <div className="lg:col-span-3 space-y-8">
                    {!selectedEventId ? (
                        <div className="bg-white dark:bg-[#20242B] rounded-[3rem] border border-slate-100 dark:border-slate-800 p-20 text-center space-y-6 dark:text-white">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-[#1a1d24] rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto">
                                <Award className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-300">No Event Selected</h2>
                            <p className="text-slate-400 font-medium max-w-sm mx-auto">Please select an event from the sidebar to begin designing the certificate.</p>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-5 gap-8">
                            {/* Canvas Preview */}
                            <div className="lg:col-span-3 space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Live Workspace</h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">800 X 565 PX</span>
                                </div>
                                <div className="bg-slate-100 dark:bg-[#20242B] rounded-[2.5rem] p-4 border border-slate-200 dark:border-slate-700 shadow-inner overflow-hidden flex items-center justify-center min-h-[500px]">
                                    {templatePreview ? (
                                        <canvas
                                            ref={canvasRef}
                                            width={800}
                                            height={565}
                                            className="max-w-full h-auto rounded-xl shadow-2xl bg-white dark:bg-[#20242B] dark:text-white"
                                        />
                                    ) : (
                                        <div className="text-center space-y-4">
                                            <Upload className="w-12 h-12 text-slate-300 mx-auto" />
                                            <p className="text-slate-400 font-bold">Upload a template to see preview</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Fields Editor */}
                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white px-2">Dynamic Fields</h3>
                                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 mb-4">
                                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Available Variables</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['{Prefix}', '{Name}', '{RegisterNumber}', '{Year}', '{Department}', '{YearOfStudy}', '{Year&Department}', '{EventName}', '{EventDate}', '{CollegeName}', '{RegistrationID}'].map(v => (
                                                <code key={v} className="bg-white dark:bg-[#20242B] px-2 py-1 rounded-md text-[10px] font-bold text-amber-700 border border-amber-100 dark:border-amber-500/20 dark:text-white">{v}</code>
                                            ))}
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {config.fields.map((field, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="bg-white dark:bg-[#20242B] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-indigo-100 transition-colors space-y-6 relative group dark:text-white"
                                            >
                                                <button
                                                    onClick={() => removeField(idx)}
                                                    className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-[#20242B] border border-slate-100 dark:border-slate-800 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:text-white"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Data Map</label>
                                                        <select
                                                            className="input-premium py-2 text-xs"
                                                            value={field.type}
                                                            onChange={e => updateField(idx, { type: e.target.value })}
                                                        >
                                                            <option value="Name">Participant Name</option>
                                                            <option value="Prefix">Prefix (Selvan/Selvi)</option>
                                                            <option value="Year">Year</option>
                                                            <option value="Department">Department</option>
                                                            <option value="Text">Static Text</option>
                                                        </select>
                                                    </div>
                                                    {field.type === 'Text' && (
                                                        <div className="col-span-2 space-y-1.5">
                                                            <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Dynamic Content</label>
                                                            <textarea
                                                                className="input-premium py-3 text-xs min-h-[80px] leading-relaxed"
                                                                placeholder="e.g. This is to certify that {Prefix} {Name}..."
                                                                value={field.text || ''}
                                                                onChange={e => updateField(idx, { text: e.target.value })}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">X Position</label>
                                                        <div className="relative">
                                                            <Move className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                                            <input
                                                                type="number" className="input-premium py-2 pl-8 text-xs"
                                                                value={field.x}
                                                                onChange={e => updateField(idx, { x: parseInt(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Y Position</label>
                                                        <div className="relative">
                                                            <Move className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 rotate-90" />
                                                            <input
                                                                type="number" className="input-premium py-2 pl-8 text-xs"
                                                                value={field.y}
                                                                onChange={e => updateField(idx, { y: parseInt(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Font Size</label>
                                                        <div className="relative">
                                                            <Maximize2 className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                                            <input
                                                                type="number" className="input-premium py-2 pl-8 text-xs"
                                                                value={field.fontSize}
                                                                onChange={e => updateField(idx, { fontSize: parseInt(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Max Width</label>
                                                        <div className="relative">
                                                            <Hash className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                                            <input
                                                                type="number" className="input-premium py-2 pl-8 text-xs"
                                                                value={field.width}
                                                                onChange={e => updateField(idx, { width: parseInt(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Color</label>
                                                        <div className="relative overflow-hidden h-[42px] rounded-xl border-2 border-slate-100 dark:border-slate-800">
                                                            <input
                                                                type="color" className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer"
                                                                value={field.color}
                                                                onChange={e => updateField(idx, { color: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">Font Family</label>
                                                        <select
                                                            className="input-premium py-2 text-xs w-full"
                                                            value={field.fontFamily || 'Helvetica'}
                                                            onChange={e => updateField(idx, { fontFamily: e.target.value })}
                                                        >
                                                            <option value="Helvetica">Helvetica (Arial)</option>
                                                            <option value="Times">Times New Roman</option>
                                                            <option value="Courier">Courier</option>
                                                            <option value="Georgia">Georgia</option>
                                                            <option value="Verdana">Verdana</option>
                                                            <option value="Trebuchet MS">Trebuchet MS</option>
                                                            <option value="Impact">Impact</option>
                                                            <option value="Brush Script MT">Brush Script MT (Cursive)</option>
                                                            <option value="Comic Sans MS">Comic Sans</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {field.type === 'Text' && (field.text || '').match(/\{[^}]+\}/g) && (
                                                    <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                        {[...new Set((field.text || '').match(/\{[^}]+\}/g) || [])].map(varName => (
                                                            <div key={varName} className="space-y-1.5 min-w-[100px]">
                                                                <label className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest pl-1">{varName}</label>
                                                                <div className="relative overflow-hidden h-[42px] rounded-xl border-2 border-slate-100 dark:border-slate-800">
                                                                    <input
                                                                        type="color" className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer"
                                                                        value={(field.variableColors && field.variableColors[varName]) || field.color}
                                                                        onChange={e => {
                                                                            const newVariableColors = { ...(field.variableColors || {}) };
                                                                            newVariableColors[varName] = e.target.value;
                                                                            updateField(idx, { variableColors: newVariableColors });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <select
                                                                    className="input-premium py-1 px-2 text-[10px] w-full mt-2"
                                                                    value={(field.variableFontStyles && field.variableFontStyles[varName]) || field.fontStyle || 'normal'}
                                                                    onChange={e => {
                                                                        const newVariableFontStyles = { ...(field.variableFontStyles || {}) };
                                                                        newVariableFontStyles[varName] = e.target.value;
                                                                        updateField(idx, { variableFontStyles: newVariableFontStyles });
                                                                    }}
                                                                >
                                                                    <option value="normal">Normal</option>
                                                                    <option value="bold">Bold</option>
                                                                    <option value="italic">Italic</option>
                                                                </select>
                                                                <select
                                                                    className="input-premium py-1 px-2 text-[10px] w-full mt-2"
                                                                    value={(field.variableFontFamilies && field.variableFontFamilies[varName]) || field.fontFamily || 'Helvetica'}
                                                                    onChange={e => {
                                                                        const newVariableFontFamilies = { ...(field.variableFontFamilies || {}) };
                                                                        newVariableFontFamilies[varName] = e.target.value;
                                                                        updateField(idx, { variableFontFamilies: newVariableFontFamilies });
                                                                    }}
                                                                >
                                                                    <option value="Helvetica">Helvetica (Arial)</option>
                                                                    <option value="Times">Times New Roman</option>
                                                                    <option value="Courier">Courier</option>
                                                                    <option value="Georgia">Georgia</option>
                                                                    <option value="Verdana">Verdana</option>
                                                                    <option value="Trebuchet MS">Trebuchet MS</option>
                                                                    <option value="Impact">Impact</option>
                                                                    <option value="Brush Script MT">Brush Script MT (Cursive)</option>
                                                                    <option value="Comic Sans MS">Comic Sans</option>
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <button
                                                        onClick={() => updateField(idx, { alignment: 'left' })}
                                                        className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${field.alignment === 'left' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600 dark:text-white'}`}
                                                    >
                                                        <AlignLeft className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateField(idx, { alignment: 'center' })}
                                                        className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${field.alignment === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600 dark:text-white'}`}
                                                    >
                                                        <AlignCenter className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateField(idx, { alignment: 'right' })}
                                                        className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${field.alignment === 'right' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600 dark:text-white'}`}
                                                    >
                                                        <AlignRight className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateField(idx, { alignment: 'justify' })}
                                                        className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${field.alignment === 'justify' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600 dark:text-white'}`}
                                                    >
                                                        <AlignJustify className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-px h-6 bg-slate-200 self-center"></div>
                                                    <button
                                                        onClick={() => updateField(idx, { fontStyle: field.fontStyle === 'bold' ? 'normal' : 'bold' })}
                                                        className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${field.fontStyle === 'bold' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600 dark:text-white'}`}
                                                    >
                                                        <Bold className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateField(idx, { fontStyle: field.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                                        className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${field.fontStyle === 'italic' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600 dark:text-white'}`}
                                                    >
                                                        <Italic className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {field.type === 'Text' && (
                                                    <div className="flex items-center gap-2 mt-4">
                                                        <input
                                                            type="checkbox"
                                                            id={`underline-${idx}`}
                                                            checked={field.underlineVariables || false}
                                                            onChange={(e) => updateField(idx, { underlineVariables: e.target.checked })}
                                                            className="w-4 h-4 text-indigo-600 dark:text-indigo-400 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-500"
                                                        />
                                                        <label htmlFor={`underline-${idx}`} className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                            Underline Variables
                                                        </label>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {config.fields.length === 0 && (
                                        <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                                            <Type className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                                            <p className="text-slate-300 font-bold">No dynamic fields added yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageCertificates;
