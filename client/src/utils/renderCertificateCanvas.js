/**
 * renderCertificateCanvas.js
 *
 * Single source of truth for certificate rendering.
 * Used by both the live preview canvas and PDF generation so that
 * what you see on screen is exactly what gets downloaded.
 *
 * Canvas size: 800 x 565 px  (landscape)
 * PDF page   : A4 landscape  → image stretched to fill the page
 */

// ─── helpers ──────────────────────────────────────────────────────────────────

const cleanSection = (sec) => {
    if (sec === null || sec === undefined) return '';
    const s = String(sec).trim();
    if (s === '' || s.toLowerCase() === 'nil') return '';
    return s;
};

/** Load an image from a URL and return an HTMLImageElement (or null on error). */
const loadImage = (src) =>
    new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload  = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });

/** Resolve a canvas font string from field properties. */
const buildFont = (fontSize, fontStyle, fontFamily) => {
    const fam  = fontFamily || 'Helvetica';
    const size = fontSize   || 20;
    if (fontStyle === 'bolditalic') return `bold italic ${size}px "${fam}", Arial, sans-serif`;
    if (fontStyle === 'bold')       return `bold ${size}px "${fam}", Arial, sans-serif`;
    if (fontStyle === 'italic')     return `italic ${size}px "${fam}", Arial, sans-serif`;
    return `${size}px "${fam}", Arial, sans-serif`;
};

// ─── main export ──────────────────────────────────────────────────────────────

/**
 * Draw a complete certificate onto `canvas`.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} participantData  { username, gender, yearAndDept, registrationNumber, collegeName }
 * @param {object} eventData        { title, eventDate }
 * @param {object} config           { template: URL|null, fields: [...] }
 * @param {string} registrationId   e.g. "REG-00123"
 */
export const renderCertificateCanvas = async (
    canvas,
    participantData,
    eventData,
    config,
    registrationId = '',
    dpr = 1
) => {
    const W = 800;
    const H = 565;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // ── 1. Background / template image ────────────────────────────────────────
    if (config.template) {
        const img = await loadImage(config.template);
        if (img) ctx.drawImage(img, 0, 0, W, H);
    }

    // ── 2. Resolve variables ──────────────────────────────────────────────────
    const p      = participantData || {};
    const ev     = eventData       || {};
    const prefix = p.gender === 'Female' ? 'Selvi' : 'Selvan';
    const parts  = (p.yearAndDept || '').split(' ');
    const year   = parts[0] || '';
    const dept   = parts.slice(1).join(' ') || '';

    const variables = {
        '{Prefix}'          : prefix,
        '{Name}'            : p.username            || '',
        '{RegisterNumber}'  : p.registrationNumber  || '',
        '{Year}'            : year,
        '{YearOfStudy}'     : year,
        '{Department}'      : dept,
        '{Year&Department}' : p.yearAndDept          || '',
        '{Section}'         : cleanSection(p.section),
        '{EventName}'       : ev.title               || '',
        '{EventDate}'       : ev.eventDate
            ? new Date(ev.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
            : '',
        '{CollegeName}'     : p.collegeName          || 'Saranathan College of Engineering',
        '{RegistrationID}'  : registrationId,
    };

    // ── 3. Draw each field ────────────────────────────────────────────────────
    for (const field of (config.fields || [])) {
        const fontSize   = field.fontSize   || 20;
        const baseColor  = field.color      || '#000000';
        const baseStyle  = field.fontStyle  || 'normal';
        const baseFamily = field.fontFamily || 'Helvetica';
        const align      = field.alignment  || 'left';
        const maxWidth   = field.width      || 600;

        ctx.save();

        if (field.type === 'Text') {
            // ── Build word chunks from richText segments (or fall back to field.text) ─
            //
            // richText format: [{ text: string, style: 'normal'|'bold'|'italic'|'bolditalic' }]
            // Variables ({Name} etc.) may appear inside any segment's text.
            // Each word carries its own resolved style; variable overrides still apply.

            const wordsInfo = [];

            const splitText = (rawText, segStyle, isVarSegment, varKey) => {
                const varRegex = /\{[^}]+\}/g;
                let cursor = 0;
                let m;
                while ((m = varRegex.exec(rawText)) !== null) {
                    if (m.index > cursor) {
                        // static text before the variable
                        const staticPart = rawText.slice(cursor, m.index);
                        splitIntoWords(staticPart, segStyle, false, null);
                    }
                    const varKey2 = m[0];
                    const resolved = variables[varKey2] !== undefined ? variables[varKey2] : varKey2;
                    const varStyle = field.variableFontStyles?.[varKey2] || segStyle;
                    splitIntoWords(resolved, varStyle, true, varKey2);
                    cursor = varRegex.lastIndex;
                }
                if (cursor < rawText.length) {
                    splitIntoWords(rawText.slice(cursor), segStyle, false, null);
                }
            };

            const splitIntoWords = (text, style, isVar, originalVar) => {
                const words = String(text).split(' ');
                words.forEach((w, i) => {
                    const word = i < words.length - 1 ? w + ' ' : w;
                    if (word.length > 0) {
                        wordsInfo.push({ word, style, isVar, originalVar });
                    }
                });
            };

            if (field.richText && field.richText.length > 0) {
                // ── NEW: per-segment styles ──────────────────────────────────
                for (const seg of field.richText) {
                    splitText(seg.text || '', seg.style || 'normal', false, null);
                }
            } else {
                // ── LEGACY: single style for whole field ────────────────────
                splitText(field.text || '', baseStyle, false, null);
            }

            // ── measure helper ───────────────────────────────────────────────
            const measure = (word, wStyle, wFamily) => {
                ctx.font = buildFont(fontSize, wStyle, wFamily);
                return ctx.measureText(word).width;
            };

            // ── wrap into lines ───────────────────────────────────────────────
            const linesInfo  = [];
            let currentLine  = [];
            let currentWidth = 0;

            for (const wo of wordsInfo) {
                // For variables, use variableFontFamilies override; for static text, use field baseFamily
                const wFamily = (wo.isVar && field.variableFontFamilies?.[wo.originalVar]) || baseFamily;
                const wWidth  = measure(wo.word, wo.style, wFamily);

                if (currentWidth + wWidth > maxWidth && currentLine.length > 0) {
                    linesInfo.push(currentLine);
                    currentLine  = [wo];
                    currentWidth = wWidth;
                } else {
                    currentLine.push(wo);
                    currentWidth += wWidth;
                }
            }
            if (currentLine.length > 0) linesInfo.push(currentLine);

            // ── draw lines ────────────────────────────────────────────────────
            let y          = field.y;
            const lineH    = fontSize * 1.2;
            const lastIdx  = linesInfo.length - 1;

            linesInfo.forEach((lineArr, lineIdx) => {
                const lineWidth = lineArr.reduce((sum, wo) => {
                    const wFamily = (wo.isVar && field.variableFontFamilies?.[wo.originalVar]) || baseFamily;
                    return sum + measure(wo.word, wo.style, wFamily);
                }, 0);

                let startX = field.x;
                if (align === 'center') startX = field.x - lineWidth / 2;
                if (align === 'right')  startX = field.x - lineWidth;

                let extraPerSpace = 0;
                if (align === 'justify' && lineIdx < lastIdx) {
                    const spaceCount = lineArr.filter(wo => wo.word.endsWith(' ')).length;
                    if (spaceCount > 0) extraPerSpace = (maxWidth - lineWidth) / spaceCount;
                }

                let x = startX;
                ctx.textAlign    = 'left';
                ctx.textBaseline = 'alphabetic';

                for (const chunk of lineArr) {
                    // Color: variable overrides or base color; style comes from word itself
                    const cColor  = (chunk.isVar && field.variableColors?.[chunk.originalVar]) || baseColor;
                    const cFamily = (chunk.isVar && field.variableFontFamilies?.[chunk.originalVar]) || baseFamily;

                    ctx.font      = buildFont(fontSize, chunk.style, cFamily);
                    ctx.fillStyle = cColor;
                    ctx.fillText(chunk.word, x, y);

                    const isUnderlined = chunk.isVar && (field.underlineVariables || field.variableUnderlines?.[chunk.originalVar]);
                    if (isUnderlined) {
                        const uw = ctx.measureText(chunk.word.trimEnd()).width;
                        ctx.strokeStyle = cColor;
                        ctx.lineWidth   = 1;
                        ctx.beginPath();
                        ctx.moveTo(x, y + 2);
                        ctx.lineTo(x + uw, y + 2);
                        ctx.stroke();
                    }

                    x += measure(chunk.word, chunk.style, cFamily);
                    if (align === 'justify' && lineIdx < lastIdx && chunk.word.endsWith(' ')) {
                        x += extraPerSpace;
                    }
                }
                y += lineH;
            });

        } else {
            // ── legacy single-value field types ──────────────────────────────
            let text = '';
            switch (field.type) {
                case 'Prefix':         text = variables['{Prefix}'];         break;
                case 'Name':           text = variables['{Name}'];           break;
                case 'Year':           text = variables['{Year}'];           break;
                case 'Department':     text = variables['{Department}'];     break;
                case 'RegistrationID': text = variables['{RegistrationID}']; break;
                case 'EventName':      text = variables['{EventName}'];      break;
                case 'Section':        text = variables['{Section}'];        break;
                default:               text = '';
            }
            if (text) {
                ctx.font      = buildFont(fontSize, baseStyle, baseFamily);
                ctx.fillStyle = baseColor;
                ctx.textAlign = align === 'justify' ? 'left' : align;
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(text, field.x, field.y);
            }
        }

        ctx.restore();
    }
};

// ─── PDF export ───────────────────────────────────────────────────────────────

/**
 * Render a certificate onto a hidden high-DPI canvas, export as a PDF, and trigger download.
 * Uses a 4× device-pixel-ratio so the resulting PDF is ~300 DPI print-quality.
 *
 * @param {object} participantData
 * @param {object} eventData
 * @param {object} config
 * @param {string} registrationId
 * @param {string} [filename]
 */
export const downloadCertificateAsPDF = async (
    participantData,
    eventData,
    config,
    registrationId = '',
    filename = 'certificate.pdf'
) => {
    // ------------------------------------------------------------------
    // 1. Render on a 6× super-sampled offscreen canvas.
    // ------------------------------------------------------------------
    const DPR = 6; // 6× → 4800×3390 px ≈ 400 DPI on A4 landscape
    const hiResCanvas = document.createElement('canvas');

    await renderCertificateCanvas(hiResCanvas, participantData, eventData, config, registrationId, DPR);

    // ------------------------------------------------------------------
    // 2. Export the hi-res canvas as a lossless PNG to ensure text
    //    edges are perfectly sharp with zero compression artifacts.
    // ------------------------------------------------------------------
    const imgDataUrl = hiResCanvas.toDataURL('image/png');

    // ------------------------------------------------------------------
    // 3. Embed into an A4-landscape PDF — fills the page edge-to-edge.
    // ------------------------------------------------------------------
    const { jsPDF } = await import('jspdf');

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pW  = pdf.internal.pageSize.getWidth();   // 297 mm
    const pH  = pdf.internal.pageSize.getHeight();  // 210 mm

    pdf.addImage(imgDataUrl, 'PNG', 0, 0, pW, pH, undefined, 'FAST');
    pdf.save(filename);
};
