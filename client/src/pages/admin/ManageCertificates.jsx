import { getImageUrl } from '../../utils/imageUrl';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Award, Upload, Save, Plus, Trash2,
    ChevronLeft, Loader2, Maximize2, Settings2,
    Type, Hash, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Bold, Italic, Send, Eye, Layers, ChevronDown, ChevronUp,
    Grip, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../../contexts/ConfirmContext';
import { renderCertificateCanvas, downloadCertificateAsPDF } from '../../utils/renderCertificateCanvas';

/* ─── constants ──────────────────────────────────────────────────────── */

const FONT_FAMILIES = [
    { value: 'Helvetica',       label: 'Helvetica (Arial)' },
    { value: 'Times',           label: 'Times New Roman' },
    { value: 'Courier',         label: 'Courier' },
    { value: 'Georgia',         label: 'Georgia' },
    { value: 'Verdana',         label: 'Verdana' },
    { value: 'Trebuchet MS',    label: 'Trebuchet MS' },
    { value: 'Impact',          label: 'Impact' },
    { value: 'Brush Script MT', label: 'Brush Script MT (Cursive)' },
    { value: 'Comic Sans MS',   label: 'Comic Sans' },
];

const ALL_VARIABLES = [
    '{Prefix}', '{Name}', '{RegisterNumber}', '{Year}', '{Department}',
    '{YearOfStudy}', '{Year&Department}', '{EventName}', '{EventDate}',
    '{CollegeName}', '{RegistrationID}'
];

/* ─── rich-text helpers ──────────────────────────────────────────────── */

/** Convert richText segments array → HTML string for contenteditable */
const segmentsToHTML = (segs) => {
    if (!segs || segs.length === 0) return '';
    return segs.map(seg => {
        const t = (seg.text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        const s = seg.style || 'normal';
        if (s === 'bolditalic') return `<b><i>${t}</i></b>`;
        if (s === 'bold')       return `<b>${t}</b>`;
        if (s === 'italic')     return `<i>${t}</i>`;
        return t;
    }).join('');
};

/** Parse contenteditable innerHTML → richText segments array */
const htmlToSegments = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    const raw = [];

    const traverse = (node, bold, italic) => {
        if (node.nodeType === 3) {                 // TEXT_NODE
            const text = node.textContent || '';
            if (text) {
                raw.push({
                    text,
                    style: bold && italic ? 'bolditalic'
                         : bold   ? 'bold'
                         : italic ? 'italic'
                         : 'normal',
                });
            }
        } else if (node.nodeType === 1) {          // ELEMENT_NODE
            const tag = node.tagName.toLowerCase();
            let b = bold, it = italic;
            if (tag === 'b' || tag === 'strong') b = true;
            if (tag === 'i' || tag === 'em')     it = true;
            // Treat block breaks as a space
            if (tag === 'br' || tag === 'div' || tag === 'p') {
                raw.push({ text: ' ', style: 'normal' });
            }
            node.childNodes.forEach(c => traverse(c, b, it));
        }
    };

    div.childNodes.forEach(c => traverse(c, false, false));

    // Merge adjacent same-style segments
    const merged = [];
    for (const seg of raw) {
        if (!seg.text) continue;
        if (merged.length && merged[merged.length - 1].style === seg.style) {
            merged[merged.length - 1].text += seg.text;
        } else {
            merged.push({ ...seg });
        }
    }
    return merged;
};

/** Derive an initial richText array from a field (supports old & new format) */
const getInitialRichText = (field) => {
    if (field.richText && field.richText.length > 0) return field.richText;
    if (field.text) return [{ text: field.text, style: field.fontStyle || 'normal' }];
    return [];
};

/* ─── RichTextEditor component ───────────────────────────────────────── */

const RichTextEditor = ({ initialRichText, onChange, fieldColor, fontFamily }) => {
    const divRef  = useRef(null);
    const mounted = useRef(false);
    const [selBold,   setSelBold]   = useState(false);
    const [selItalic, setSelItalic] = useState(false);

    // Set initial HTML once on mount
    useEffect(() => {
        if (divRef.current && !mounted.current) {
            divRef.current.innerHTML = segmentsToHTML(initialRichText);
            mounted.current = true;
        }
    }, []); // eslint-disable-line

    const handleInput = useCallback(() => {
        const segs = htmlToSegments(divRef.current.innerHTML);
        onChange(segs);
    }, [onChange]);

    const updateSelState = () => {
        setSelBold(document.queryCommandState('bold'));
        setSelItalic(document.queryCommandState('italic'));
    };

    // Use onMouseDown + preventDefault so the editor keeps focus when clicking toolbar
    const applyFormat = (cmd) => {
        divRef.current.focus();
        document.execCommand(cmd, false, null);
        handleInput();
        updateSelState();
    };

    const insertVariable = (v) => {
        divRef.current.focus();
        document.execCommand('insertText', false, v);
        handleInput();
    };

    const preventNewline = (e) => {
        if (e.key === 'Enter') e.preventDefault();
    };

    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Content
            </label>

            {/* ── Toolbar ── */}
            <div className="flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-[#252b3b] rounded-t-xl border border-b-0 border-slate-200 dark:border-slate-700 flex-wrap gap-y-1">
                {/* Bold */}
                <button
                    type="button"
                    title="Bold selected text (Ctrl+B)"
                    onMouseDown={e => { e.preventDefault(); applyFormat('bold'); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm transition-all select-none
                        ${selBold
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900'
                            : 'text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                    <Bold className="w-3.5 h-3.5" />
                </button>

                {/* Italic */}
                <button
                    type="button"
                    title="Italic selected text (Ctrl+I)"
                    onMouseDown={e => { e.preventDefault(); applyFormat('italic'); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all select-none
                        ${selItalic
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900'
                            : 'text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                    <Italic className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-0.5" />

                {/* Active indicator */}
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1 min-w-[60px]">
                    {selBold && selItalic ? 'Bold + Italic'
                     : selBold   ? 'Bold'
                     : selItalic ? 'Italic'
                     : 'Normal'}
                </span>

                <div className="flex-1" />

                {/* Quick-insert variable buttons */}
                <span className="text-[9px] text-slate-400 font-bold hidden sm:block">Insert:</span>
                {['{Name}', '{EventName}', '{Prefix}', '{Year&Department}'].map(v => (
                    <button
                        key={v}
                        type="button"
                        onMouseDown={e => { e.preventDefault(); insertVariable(v); }}
                        className="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-all select-none"
                    >
                        {v}
                    </button>
                ))}
            </div>

            {/* ── Contenteditable editor ── */}
            <div
                ref={divRef}
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                onInput={handleInput}
                onKeyUp={updateSelState}
                onMouseUp={updateSelState}
                onSelect={updateSelState}
                onKeyDown={preventNewline}
                className="w-full min-h-[90px] px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#20242B] rounded-b-xl outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 text-[13px] leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 dark:empty:before:text-slate-600"
                data-placeholder="e.g. This is to certify that {Prefix} {Name}…"
                style={{
                    fontFamily: fontFamily ? `"${fontFamily}", Arial, sans-serif` : 'Arial, sans-serif',
                    color: fieldColor || '#1e293b',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
            />

            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pl-1">
                💡 <strong>Select</strong> any text then click <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black border border-slate-200 dark:border-slate-700">B</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black border border-slate-200 dark:border-slate-700">I</kbd> to format only that selection. Works with keyboard shortcuts too.
            </p>
        </div>
    );
};

/* ─── FieldCard component ────────────────────────────────────────────── */

const FieldCard = ({ field, idx, updateField, removeField }) => {
    const [collapsed, setCollapsed] = useState(false);

    const detectedVars = [
        ...new Set(
            (field.richText || [])
                .map(s => [...(s.text || '').matchAll(/\{[^}]+\}/g)].map(m => m[0]))
                .flat()
                .concat(
                    [...((field.text || '').matchAll(/\{[^}]+\}/g))].map(m => m[0])
                )
        )
    ];

    const handleRichTextChange = useCallback((segs) => {
        updateField(idx, { richText: segs });
    }, [idx, updateField]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-white dark:bg-[#1e2230] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
        >
            {/* Card header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-[#252b3b] border-b border-slate-200 dark:border-slate-700">
                <Grip className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                        {field.type === 'Text'
                            ? (field.richText?.map(s => s.text).join('') || field.text || 'Text Field')
                                .replace(/\{[^}]+\}/g, '…').slice(0, 50)
                            : field.type}
                    </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setCollapsed(c => !c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
                        {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <button onClick={() => removeField(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Card body */}
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 space-y-4 dark:text-white">

                            {/* Field type */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Field Type</label>
                                <select
                                    className="input-premium py-2 text-xs w-full"
                                    value={field.type}
                                    onChange={e => updateField(idx, { type: e.target.value })}
                                >
                                    <option value="Text">📝 Rich Text (with variables)</option>
                                    <option value="Name">👤 Participant Name</option>
                                    <option value="Prefix">🪪 Prefix (Selvan/Selvi)</option>
                                    <option value="Year">🎓 Year</option>
                                    <option value="Department">🏫 Department</option>
                                </select>
                            </div>

                            {/* ── Rich Text editor ── */}
                            {field.type === 'Text' && (
                                <RichTextEditor
                                    key={`rte-${idx}`}
                                    initialRichText={getInitialRichText(field)}
                                    onChange={handleRichTextChange}
                                    fieldColor={field.color}
                                    fontFamily={field.fontFamily}
                                />
                            )}

                            {/* Position */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">X Position</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">X</span>
                                        <input type="number" className="input-premium py-2 pl-7 text-xs"
                                            value={field.x}
                                            onChange={e => updateField(idx, { x: parseInt(e.target.value) || 0 })} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Y Position</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">Y</span>
                                        <input type="number" className="input-premium py-2 pl-7 text-xs"
                                            value={field.y}
                                            onChange={e => updateField(idx, { y: parseInt(e.target.value) || 0 })} />
                                    </div>
                                </div>
                            </div>

                            {/* Typography */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Font Size</label>
                                    <div className="relative">
                                        <Maximize2 className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input type="number" className="input-premium py-2 pl-8 text-xs"
                                            value={field.fontSize}
                                            onChange={e => updateField(idx, { fontSize: parseInt(e.target.value) || 20 })} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Max Width</label>
                                    <div className="relative">
                                        <Hash className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input type="number" className="input-premium py-2 pl-8 text-xs"
                                            value={field.width}
                                            onChange={e => updateField(idx, { width: parseInt(e.target.value) || 600 })} />
                                    </div>
                                </div>
                            </div>

                            {/* Font family & color */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Font Family</label>
                                    <select
                                        className="input-premium py-2 text-xs w-full"
                                        value={field.fontFamily || 'Helvetica'}
                                        onChange={e => updateField(idx, { fontFamily: e.target.value })}
                                    >
                                        {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Text Color</label>
                                    <div className="relative overflow-hidden h-[42px] rounded-xl border-2 border-slate-100 dark:border-slate-800 cursor-pointer">
                                        <input
                                            type="color" className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer"
                                            value={field.color}
                                            onChange={e => updateField(idx, { color: e.target.value })}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
                                            <span className="text-[9px] font-black text-white/80 bg-black/20 px-1.5 py-0.5 rounded-md">{field.color}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Alignment (applies to whole field) */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Alignment</label>
                                <div className="flex gap-1.5 p-1.5 bg-slate-50 dark:bg-[#252b3b] rounded-xl border border-slate-100 dark:border-slate-700">
                                    {[
                                        { icon: <AlignLeft className="w-4 h-4" />, val: 'left',    title: 'Left' },
                                        { icon: <AlignCenter className="w-4 h-4" />, val: 'center', title: 'Center' },
                                        { icon: <AlignRight className="w-4 h-4" />, val: 'right',   title: 'Right' },
                                        { icon: <AlignJustify className="w-4 h-4" />, val: 'justify', title: 'Justify' },
                                    ].map(({ icon, val, title }) => (
                                        <button key={val} title={title}
                                            onClick={() => updateField(idx, { alignment: val })}
                                            className={`flex-1 flex justify-center py-2 rounded-lg transition-all
                                                ${field.alignment === val
                                                    ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400'
                                                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white'}`}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bold/Italic for non-Text field types */}
                            {field.type !== 'Text' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Style</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateField(idx, {
                                                fontStyle: field.fontStyle === 'bold' ? 'normal' : field.fontStyle === 'italic' ? 'bolditalic' : 'bold'
                                            })}
                                            className={`flex-1 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all
                                                ${['bold','bolditalic'].includes(field.fontStyle)
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 dark:bg-[#252b3b] text-slate-500 dark:text-slate-300 hover:bg-slate-200'}`}
                                        >
                                            <Bold className="w-4 h-4" /> Bold
                                        </button>
                                        <button
                                            onClick={() => updateField(idx, {
                                                fontStyle: field.fontStyle === 'italic' ? 'normal' : field.fontStyle === 'bold' ? 'bolditalic' : 'italic'
                                            })}
                                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all
                                                ${['italic','bolditalic'].includes(field.fontStyle)
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 dark:bg-[#252b3b] text-slate-500 dark:text-slate-300 hover:bg-slate-200'}`}
                                        >
                                            <Italic className="w-4 h-4" /> Italic
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Per-variable overrides */}
                            {detectedVars.length > 0 && (
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-3">
                                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3 text-amber-500" /> Per-Variable Overrides
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {detectedVars.map(varName => (
                                            <div key={varName} className="bg-slate-50 dark:bg-[#252b3b] rounded-xl p-3 space-y-2 border border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center justify-between">
                                                    <code className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-md block w-fit">{varName}</code>
                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-3 h-3 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                            checked={field.variableUnderlines?.[varName] || false}
                                                            onChange={e => {
                                                                const nvu = { ...(field.variableUnderlines || {}) };
                                                                nvu[varName] = e.target.checked;
                                                                updateField(idx, { variableUnderlines: nvu });
                                                            }}
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-500">Underline</span>
                                                    </label>
                                                </div>
                                                <div className="relative overflow-hidden h-8 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <input
                                                        type="color"
                                                        className="absolute -top-1 -left-1 w-[130%] h-[130%] cursor-pointer"
                                                        value={(field.variableColors && field.variableColors[varName]) || field.color}
                                                        onChange={e => {
                                                            const nvc = { ...(field.variableColors || {}) };
                                                            nvc[varName] = e.target.value;
                                                            updateField(idx, { variableColors: nvc });
                                                        }}
                                                    />
                                                </div>
                                                <select
                                                    className="input-premium py-1 px-2 text-[10px] w-full"
                                                    value={(field.variableFontStyles && field.variableFontStyles[varName]) || 'normal'}
                                                    onChange={e => {
                                                        const nvfs = { ...(field.variableFontStyles || {}) };
                                                        nvfs[varName] = e.target.value;
                                                        updateField(idx, { variableFontStyles: nvfs });
                                                    }}
                                                >
                                                    <option value="normal">Normal</option>
                                                    <option value="bold">Bold</option>
                                                    <option value="italic">Italic</option>
                                                    <option value="bolditalic">Bold Italic</option>
                                                </select>
                                                <select
                                                    className="input-premium py-1 px-2 text-[10px] w-full"
                                                    value={(field.variableFontFamilies && field.variableFontFamilies[varName]) || field.fontFamily || 'Helvetica'}
                                                    onChange={e => {
                                                        const nvff = { ...(field.variableFontFamilies || {}) };
                                                        nvff[varName] = e.target.value;
                                                        updateField(idx, { variableFontFamilies: nvff });
                                                    }}
                                                >
                                                    {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>

                                    <label className="flex items-center gap-2.5 cursor-pointer group/ul">
                                        <div
                                            onClick={() => updateField(idx, { underlineVariables: !field.underlineVariables })}
                                            className={`relative w-9 h-5 rounded-full transition-all flex-shrink-0 ${field.underlineVariables ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${field.underlineVariables ? 'translate-x-4' : ''}`} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover/ul:text-indigo-600 transition-colors">
                                            Underline variables
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/* ─── main component ─────────────────────────────────────────────────── */

const ManageCertificates = () => {
    const { confirm } = useConfirm();
    const [events, setEvents]                     = useState([]);
    const [selectedEventId, setSelectedEventId]   = useState('');
    const [config, setConfig]                     = useState({ fields: [] });
    const [templateFile, setTemplateFile]         = useState(null);
    const [templatePreview, setTemplatePreview]   = useState(null);
    const [isLoading, setIsLoading]               = useState(true);
    const [isSaving, setIsSaving]                 = useState(false);
    const [isPreviewing, setIsPreviewing]         = useState(false);
    const [isBulkSending, setIsBulkSending]       = useState(false);
    const [sendTarget, setSendTarget]             = useState('both');
    const [activeTab, setActiveTab]               = useState('editor');

    const canvasRef = useRef(null);

    useEffect(() => {
        axios.get('/api/events')
            .then(r => setEvents(r.data))
            .catch(() => toast.error('Failed to load events'))
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (selectedEventId) fetchConfig(selectedEventId);
    }, [selectedEventId]);

    const normalizeFields = (fields) =>
        (fields || []).map(f => ({
            ...f,
            variableColors:       f.variableColors      || {},
            variableFontStyles:   f.variableFontStyles  || {},
            variableFontFamilies: f.variableFontFamilies || {},
            variableUnderlines:   f.variableUnderlines || {},
            richText:             f.richText             || null,
        }));

    const fetchConfig = async (eventId) => {
        try {
            const res  = await axios.get(`/api/certificates/config/${eventId}`);
            const data = res.data || { fields: [] };
            data.fields = normalizeFields(data.fields);
            setConfig(data);
            setTemplatePreview(data.template ? getImageUrl(data.template) : null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to load certificate configuration');
        }
    };

    const handleTemplateUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setTemplateFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setTemplatePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const addField = () => {
        setConfig(prev => ({
            ...prev,
            fields: [...prev.fields, {
                type: 'Text',
                text: '',
                richText: [{ text: 'This is to certify that {Prefix} {Name} of {Year&Department} has participated in {EventName}.', style: 'normal' }],
                x: 400, y: 300,
                fontSize: 24,
                color: '#000000',
                fontFamily: 'Helvetica',
                variableColors: {},
                variableFontStyles: {},
                variableFontFamilies: {},
                variableUnderlines: {},
                fontStyle: 'normal',
                alignment: 'center',
                width: 600,
            }]
        }));
    };

    const updateField = useCallback((index, updates) => {
        setConfig(prev => {
            const fields = [...prev.fields];
            fields[index] = { ...fields[index], ...updates };
            return { ...prev, fields };
        });
    }, []);

    const removeField = (index) => {
        setConfig(prev => ({ ...prev, fields: prev.fields.filter((_, i) => i !== index) }));
    };

    const saveConfig = async () => {
        if (!selectedEventId) { toast.error('Please select an event first.'); return; }
        if (!config.fields.length && !config.template) {
            toast.error('Please add at least one field or upload a template before saving.');
            return;
        }
        setIsSaving(true);
        const formData = new FormData();
        if (templateFile) formData.append('template', templateFile);

        const cleanFields = (config.fields || []).map(f => ({
            type:                 f.type,
            text:                 f.richText ? f.richText.map(s => s.text).join('') : (f.text || ''),
            richText:             f.richText || null,
            x:                   Number(f.x)       || 0,
            y:                   Number(f.y)       || 0,
            fontSize:             Number(f.fontSize) || 20,
            color:                f.color           || '#000000',
            fontStyle:            f.fontStyle        || 'normal',
            fontFamily:           f.fontFamily       || 'Helvetica',
            alignment:            f.alignment        || 'left',
            width:                Number(f.width)   || 600,
            variableColors:       f.variableColors   || {},
            variableFontStyles:   f.variableFontStyles  || {},
            variableFontFamilies: f.variableFontFamilies || {},
            variableUnderlines:   f.variableUnderlines || {},
            underlineVariables:   !!f.underlineVariables,
        }));

        formData.append('config', JSON.stringify({ ...config, fields: cleanFields }));

        try {
            const res  = await axios.post(`/api/certificates/config/${selectedEventId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Certificate configuration saved!');
            const data = res.data || {};
            data.fields = normalizeFields(data.fields);
            setConfig(data);
            if (data.template) setTemplatePreview(getImageUrl(data.template));
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePreview = async () => {
        if (!config.template) { toast.error('Please upload a template before previewing.'); return; }
        setIsPreviewing(true);
        try {
            const ev = events.find(e => e._id === selectedEventId);
            await downloadCertificateAsPDF(
                { username: 'Santharam S', gender: 'Male', yearAndDept: 'III B.E. CSE', registrationNumber: 'ST12345', collegeName: 'Saranathan College of Engineering' },
                { title: ev?.title || 'Event Name', eventDate: ev?.eventDate || new Date().toISOString() },
                config, 'REG98765',
                `Preview_${(ev?.title || 'Certificate').replace(/\s+/g, '_')}.pdf`
            );
        } catch { toast.error('Failed to generate preview PDF'); }
        finally { setIsPreviewing(false); }
    };

    const handleBulkSend = async () => {
        if (!selectedEventId) return;
        let msg = 'This will email certificates to ';
        if (sendTarget === 'participants') msg += 'ALL eligible participants';
        else if (sendTarget === 'volunteers') msg += 'ALL approved volunteers';
        else msg += 'ALL eligible participants and approved volunteers';
        if (!(await confirm(msg + '. Continue?'))) return;
        setIsBulkSending(true);
        try {
            const res = await axios.post(`/api/certificates/bulk-send/${selectedEventId}`, { target: sendTarget });
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Bulk send failed');
        } finally { setIsBulkSending(false); }
    };

    // Live canvas preview
    useEffect(() => {
        if (!canvasRef.current || !templatePreview) return;
        const ev = events.find(e => e._id === selectedEventId);
        renderCertificateCanvas(
            canvasRef.current,
            { username: 'Santharam S', gender: 'Male', yearAndDept: 'III B.E. CSE', registrationNumber: 'ST12345', collegeName: 'Saranathan College of Engineering' },
            { title: ev?.title || 'Event Name', eventDate: ev?.eventDate || new Date().toISOString() },
            { ...config, template: templatePreview },
            'REG98765'
        ).then(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            (config.fields || []).forEach(field => {
                ctx.fillStyle = 'rgba(99,102,241,0.75)';
                ctx.beginPath();
                ctx.arc(field.x, field.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }, [templatePreview, config, selectedEventId, events]);

    return (
        <div className="space-y-8 pb-20">

            {/* Header */}
            <div className="flex flex-wrap justify-between items-end gap-6">
                <div className="space-y-3">
                    <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors text-sm group">
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            Certificate <span className="text-reveal">Studio.</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                            Design dynamic certificates — select any text and apply Bold / Italic to only that portion.
                        </p>
                    </div>
                </div>

                {selectedEventId && (
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handlePreview}
                            disabled={isPreviewing || !config.template}
                            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#20242B] border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-black rounded-2xl hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-50 shadow-sm"
                        >
                            {isPreviewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                            Preview PDF
                        </button>

                        <div className="flex items-center border-2 border-emerald-500 rounded-2xl overflow-hidden bg-white dark:bg-[#20242B] shadow-sm">
                            <button
                                onClick={handleBulkSend}
                                disabled={isBulkSending || !config.template || !config.fields?.length}
                                className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-black hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all flex items-center gap-2 border-r-2 border-emerald-500 disabled:opacity-50"
                            >
                                {isBulkSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                Bulk Send
                            </button>
                            <select value={sendTarget} onChange={e => setSendTarget(e.target.value)} disabled={isBulkSending}
                                className="bg-transparent text-emerald-700 dark:text-emerald-300 font-bold text-sm outline-none cursor-pointer px-3 py-3">
                                <option value="both">Participants + Volunteers</option>
                                <option value="participants">Participants Only</option>
                                <option value="volunteers">Volunteers Only</option>
                            </select>
                        </div>

                        <button onClick={saveConfig} disabled={isSaving} className="btn-premium flex items-center gap-2 px-6 py-3">
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save
                        </button>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-12 gap-6">

                {/* Sidebar */}
                <div className="lg:col-span-3 space-y-5">
                    <div className="bg-white dark:bg-[#20242B] rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Event</span>
                        </div>
                        <select className="input-premium w-full" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                            <option value="">Choose an event…</option>
                            {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
                        </select>

                        {selectedEventId && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Template Image</p>
                                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all cursor-pointer group overflow-hidden">
                                    {templatePreview ? (
                                        <img src={templatePreview} alt="Template" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="w-7 h-7 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                            <p className="text-xs font-bold text-slate-400">Click to upload</p>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">JPG · PNG · WEBP</p>
                                        </div>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleTemplateUpload} />
                                </label>
                                {templatePreview && (
                                    <label className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer hover:underline">
                                        <Upload className="w-3.5 h-3.5" />Replace template
                                        <input type="file" className="hidden" accept="image/*" onChange={handleTemplateUpload} />
                                    </label>
                                )}
                            </div>
                        )}
                    </div>

                    {selectedEventId && (
                        <div className="bg-slate-900 dark:bg-[#10131a] border border-slate-800 rounded-2xl p-5 text-white space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                    <Settings2 className="w-4 h-4 text-indigo-400" />
                                </div>
                                <h3 className="text-sm font-black">Controls</h3>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Coordinates are in pixels on an <strong className="text-slate-300">800 × 565</strong> canvas. Purple dots show anchor points.
                            </p>
                            {!config.template && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                                    <p className="text-amber-300 text-xs font-bold">⚠️ Upload a template to enable preview &amp; bulk send</p>
                                </div>
                            )}
                            <button onClick={addField}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                                <Plus className="w-4 h-4" /> Add Field
                            </button>
                        </div>
                    )}

                    {selectedEventId && (
                        <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 space-y-3">
                            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Available Variables</p>
                            <div className="flex flex-wrap gap-1.5">
                                {ALL_VARIABLES.map(v => (
                                    <code key={v} className="bg-white dark:bg-[#20242B] px-1.5 py-0.5 rounded-md text-[9px] font-bold text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-500/20">{v}</code>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main */}
                <div className="lg:col-span-9">
                    {!selectedEventId ? (
                        <div className="bg-white dark:bg-[#20242B] rounded-3xl border border-slate-100 dark:border-slate-800 p-24 text-center space-y-5">
                            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/10 dark:to-orange-500/10 rounded-3xl flex items-center justify-center mx-auto">
                                <Award className="w-10 h-10 text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white">No Event Selected</h2>
                                <p className="text-slate-400 font-medium mt-2 max-w-sm mx-auto">Select an event from the sidebar to start designing its certificate.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Tabs */}
                            <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-[#1a1d24] rounded-2xl w-fit">
                                {[
                                    { key: 'editor', label: 'Field Editor', icon: <Type className="w-4 h-4" /> },
                                    { key: 'preview', label: 'Live Preview', icon: <Eye className="w-4 h-4" /> },
                                ].map(tab => (
                                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all
                                            ${activeTab === tab.key
                                                ? 'bg-white dark:bg-[#20242B] text-indigo-600 dark:text-indigo-400 shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'preview' ? (
                                <div className="bg-slate-100 dark:bg-[#20242B] rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4">
                                    <div className="flex items-center justify-between w-full px-2">
                                        <span className="text-sm font-black text-slate-700 dark:text-white">Live Preview</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">800 × 565 px</span>
                                    </div>
                                    {templatePreview ? (
                                        <canvas ref={canvasRef} width={800} height={565} className="max-w-full h-auto rounded-xl shadow-2xl bg-white" />
                                    ) : (
                                        <div className="h-80 flex flex-col items-center justify-center gap-4">
                                            <Upload className="w-12 h-12 text-slate-300" />
                                            <p className="text-slate-400 font-bold">Upload a template to see preview</p>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-slate-400 font-medium">🟣 Purple dots = text anchor positions</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {templatePreview && (
                                        <div className="bg-slate-100 dark:bg-[#20242B] rounded-2xl p-3 border border-slate-200 dark:border-slate-700">
                                            <canvas ref={canvasRef} width={800} height={565} className="max-w-full h-auto rounded-lg shadow-lg bg-white" />
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                                Fields ({config.fields.length})
                                            </h3>
                                            <button onClick={addField}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-all">
                                                <Plus className="w-3.5 h-3.5" /> Add Field
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {config.fields.map((field, idx) => (
                                                <FieldCard
                                                    key={idx}
                                                    field={field}
                                                    idx={idx}
                                                    updateField={updateField}
                                                    removeField={removeField}
                                                />
                                            ))}
                                        </AnimatePresence>

                                        {config.fields.length === 0 && (
                                            <div className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                                                <Type className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                                <p className="text-slate-400 dark:text-slate-500 font-bold">No fields added yet.</p>
                                                <button onClick={addField}
                                                    className="mt-4 px-5 py-2.5 bg-indigo-600 text-white font-black text-xs rounded-xl hover:bg-indigo-500 transition-all">
                                                    <Plus className="w-3.5 h-3.5 inline mr-1.5" />Add First Field
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageCertificates;
