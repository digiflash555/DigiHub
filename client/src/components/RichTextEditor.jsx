import { useRef, useEffect, useCallback, useState } from 'react';
import {
    Bold, Italic, Underline,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Table as TableIcon, X
} from 'lucide-react';

/**
 * Lightweight Rich Text Editor with table support.
 * Stores and emits raw HTML. No external deps needed.
 *
 * Props:
 *   value        - HTML string (controlled)
 *   onChange     - called with new HTML string whenever content changes
 *   placeholder  - placeholder text shown when empty
 *   className    - extra classes for the outer wrapper
 */
const MAX_GRID = 8; // max rows/cols shown in the picker

const RichTextEditor = ({ value, onChange, placeholder = 'Enter description...', className = '' }) => {
    const editorRef = useRef(null);
    const savedRange = useRef(null);

    // Table picker state
    const [showTablePicker, setShowTablePicker] = useState(false);
    const [hoverCell, setHoverCell] = useState({ r: 0, c: 0 });

    // Sync value → DOM: only when value changes externally (e.g. admin edits a different form)
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        // Avoid cursor jump: only update if DOM actually differs from prop
        if (el.innerHTML !== (value || '')) {
            el.innerHTML = value || '';
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // ── Close table picker when clicking outside ───────────────────────────
    useEffect(() => {
        const handler = () => setShowTablePicker(false);
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Exec-command helper ────────────────────────────────────────────────
    const exec = useCallback((command, val = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, val);
        onChange(editorRef.current?.innerHTML || '');
    }, [onChange]);

    const handleInput = useCallback(() => {
        onChange(editorRef.current?.innerHTML || '');
    }, [onChange]);

    // Save selection before toolbar opens picker
    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRange.current = sel.getRangeAt(0).cloneRange();
        }
    };

    // Restore selection into editor
    const restoreSelection = () => {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        if (savedRange.current) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedRange.current);
        }
    };

    // ── Insert HTML at current cursor / selection ──────────────────────────
    const insertHTML = (html) => {
        restoreSelection();
        document.execCommand('insertHTML', false, html);
        onChange(editorRef.current?.innerHTML || '');
    };

    // ── Build table HTML ───────────────────────────────────────────────────
    const buildTableHTML = (rows, cols) => {
        const cellStyle = 'border:1px solid #cbd5e1;padding:8px 12px;min-width:80px;';
        const headerStyle = cellStyle + 'background:#f1f5f9;font-weight:700;text-align:center;';
        const tableStyle =
            'border-collapse:collapse;width:100%;margin:12px 0;font-size:14px;';

        let html = `<table style="${tableStyle}"><thead><tr>`;
        for (let c = 0; c < cols; c++) {
            html += `<th style="${headerStyle}" contenteditable="true">Header ${c + 1}</th>`;
        }
        html += '</tr></thead><tbody>';
        for (let r = 0; r < rows; r++) {
            html += '<tr>';
            for (let c = 0; c < cols; c++) {
                html += `<td style="${cellStyle}" contenteditable="true"></td>`;
            }
            html += '</tr>';
        }
        html += '</tbody></table><p><br></p>';
        return html;
    };

    // ── Grid picker: insert table ──────────────────────────────────────────
    const handleInsertTable = (rows, cols) => {
        setShowTablePicker(false);
        insertHTML(buildTableHTML(rows, cols));
    };

    // ── Reusable toolbar button ────────────────────────────────────────────
    const ToolBtn = ({ command, val, title, children, onClick }) => (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => {
                e.preventDefault();
                if (onClick) { onClick(); return; }
                exec(command, val);
            }}
            className="p-2 rounded-lg transition-all duration-150 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-700 focus:outline-none"
        >
            {children}
        </button>
    );

    const Divider = () => (
        <div className="w-px h-5 bg-slate-200 mx-1 self-center" />
    );

    // ── Grid picker cells ──────────────────────────────────────────────────
    const grid = Array.from({ length: MAX_GRID }, (_, r) =>
        Array.from({ length: MAX_GRID }, (_, c) => ({ r: r + 1, c: c + 1 }))
    );

    return (
        <div className={`border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-visible focus-within:border-indigo-400 transition-colors ${className}`}>
            {/* ── Toolbar ── */}
            <div className="flex items-center gap-0.5 px-3 py-2 bg-slate-50 dark:bg-[#1a1d24] border-b border-slate-200 dark:border-slate-700 rounded-t-2xl flex-wrap relative">
                {/* Text style */}
                <ToolBtn command="bold" title="Bold (Ctrl+B)">
                    <Bold className="w-4 h-4" />
                </ToolBtn>
                <ToolBtn command="italic" title="Italic (Ctrl+I)">
                    <Italic className="w-4 h-4" />
                </ToolBtn>
                <ToolBtn command="underline" title="Underline (Ctrl+U)">
                    <Underline className="w-4 h-4" />
                </ToolBtn>

                <Divider />

                {/* Alignment */}
                <ToolBtn command="justifyLeft" title="Align Left">
                    <AlignLeft className="w-4 h-4" />
                </ToolBtn>
                <ToolBtn command="justifyCenter" title="Align Center">
                    <AlignCenter className="w-4 h-4" />
                </ToolBtn>
                <ToolBtn command="justifyRight" title="Align Right">
                    <AlignRight className="w-4 h-4" />
                </ToolBtn>
                <ToolBtn command="justifyFull" title="Justify">
                    <AlignJustify className="w-4 h-4" />
                </ToolBtn>

                <Divider />

                {/* Table picker button */}
                <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        title="Insert Table"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            saveSelection();
                            setShowTablePicker(v => !v);
                            setHoverCell({ r: 0, c: 0 });
                        }}
                        className={`p-2 rounded-lg transition-all duration-150 flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-700 ${showTablePicker ? 'bg-indigo-100 text-indigo-700' : ''}`}
                    >
                        <TableIcon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Table</span>
                    </button>

                    {showTablePicker && (
                        <div
                            className="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-[#20242B] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 min-w-[260px] dark:text-white"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                                    {hoverCell.r > 0 && hoverCell.c > 0
                                        ? `${hoverCell.r} × ${hoverCell.c} Table`
                                        : 'Select Size'}
                                </p>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); setShowTablePicker(false); }}
                                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Grid picker */}
                            <div className="inline-flex flex-col gap-0.5">
                                {grid.map((row, ri) => (
                                    <div key={ri} className="flex gap-0.5">
                                        {row.map(({ r, c }) => (
                                            <div
                                                key={c}
                                                onMouseEnter={() => setHoverCell({ r, c })}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleInsertTable(r, c);
                                                }}
                                                className={`w-6 h-6 rounded cursor-pointer border transition-all duration-75 ${ r <= hoverCell.r && c <= hoverCell.c ? 'bg-indigo-500 border-indigo-600' : 'bg-slate-100 border-slate-200 dark:border-slate-700 hover:bg-indigo-100' }`}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <p className="text-[10px] text-slate-400 mt-3 font-medium">
                                Hover to choose size, click to insert
                            </p>

                            {/* Quick sizes */}
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                                {[[2,2],[3,3],[3,4],[4,5],[5,5]].map(([r,c]) => (
                                    <button
                                        key={`${r}x${c}`}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleInsertTable(r, c);
                                        }}
                                        className="px-2.5 py-1 text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 rounded-lg transition-colors"
                                    >
                                        {r}×{c}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Editable content area ── */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                data-placeholder={placeholder}
                className="min-h-[160px] px-5 py-4 text-slate-800 text-sm leading-relaxed outline-none bg-white dark:bg-[#20242B] rich-editor-area rounded-b-2xl dark:text-white"
            />

            <style>{`
                .rich-editor-area:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                    pointer-events: none;
                }
                .rich-editor-area table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 10px 0;
                }
                .rich-editor-area table th,
                .rich-editor-area table td {
                    border: 1px solid #cbd5e1;
                    padding: 8px 12px;
                    min-width: 60px;
                    vertical-align: top;
                }
                .rich-editor-area table th {
                    background: #f1f5f9;
                    font-weight: 700;
                    text-align: center;
                }
                .rich-editor-area table td:focus,
                .rich-editor-area table th:focus {
                    outline: 2px solid #6366f1;
                    outline-offset: -2px;
                    background: #eef2ff;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
