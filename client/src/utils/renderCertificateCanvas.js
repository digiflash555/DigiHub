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
    const fam = fontFamily || 'Helvetica';
    const size = fontSize || 20;
    if (fontStyle === 'bold')   return `bold ${size}px "${fam}", Arial, sans-serif`;
    if (fontStyle === 'italic') return `italic ${size}px "${fam}", Arial, sans-serif`;
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
    registrationId = ''
) => {
    const W = 800;
    const H = 565;
    canvas.width  = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
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
            // ── tokenise ────────────────────────────────────────────────────
            const rawText = field.text || '';
            const segments = [];
            let cursor = 0;
            const varRegex = /\{[^}]+\}/g;
            let m;
            while ((m = varRegex.exec(rawText)) !== null) {
                if (m.index > cursor) {
                    segments.push({ text: rawText.slice(cursor, m.index), isVar: false });
                }
                segments.push({
                    text       : variables[m[0]] !== undefined ? variables[m[0]] : m[0],
                    isVar      : true,
                    originalVar: m[0],
                });
                cursor = varRegex.lastIndex;
            }
            if (cursor < rawText.length) {
                segments.push({ text: rawText.slice(cursor), isVar: false });
            }

            // ── word objects ─────────────────────────────────────────────────
            const wordsInfo = [];
            for (const seg of segments) {
                const words = String(seg.text).split(' ');
                words.forEach((w, i) => {
                    const word = i < words.length - 1 ? w + ' ' : w;
                    if (word.length > 0) {
                        wordsInfo.push({ word, isVar: seg.isVar, originalVar: seg.originalVar });
                    }
                });
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
                const wStyle  = (wo.isVar && field.variableFontStyles?.[wo.originalVar]) || baseStyle;
                const wFamily = (wo.isVar && field.variableFontFamilies?.[wo.originalVar]) || baseFamily;
                const wWidth  = measure(wo.word, wStyle, wFamily);

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
                // compute total line width for alignment
                const lineWidth = lineArr.reduce((sum, wo) => {
                    const wStyle  = (wo.isVar && field.variableFontStyles?.[wo.originalVar])  || baseStyle;
                    const wFamily = (wo.isVar && field.variableFontFamilies?.[wo.originalVar]) || baseFamily;
                    return sum + measure(wo.word, wStyle, wFamily);
                }, 0);

                let startX = field.x;
                if (align === 'center') startX = field.x - lineWidth / 2;
                if (align === 'right')  startX = field.x - lineWidth;

                // justify spacing
                let extraPerSpace = 0;
                if (align === 'justify' && lineIdx < lastIdx) {
                    const spaceCount = lineArr.filter(wo => wo.word.endsWith(' ')).length;
                    if (spaceCount > 0) extraPerSpace = (maxWidth - lineWidth) / spaceCount;
                }

                let x = startX;
                ctx.textAlign    = 'left';
                ctx.textBaseline = 'alphabetic';

                for (const chunk of lineArr) {
                    const cColor  = (chunk.isVar && field.variableColors?.[chunk.originalVar]) || baseColor;
                    const cStyle  = (chunk.isVar && field.variableFontStyles?.[chunk.originalVar])  || baseStyle;
                    const cFamily = (chunk.isVar && field.variableFontFamilies?.[chunk.originalVar]) || baseFamily;

                    ctx.font      = buildFont(fontSize, cStyle, cFamily);
                    ctx.fillStyle = cColor;
                    ctx.fillText(chunk.word, x, y);

                    // underline variables
                    if (chunk.isVar && field.underlineVariables) {
                        const uw = ctx.measureText(chunk.word.trimEnd()).width;
                        ctx.strokeStyle = cColor;
                        ctx.lineWidth   = 1;
                        ctx.beginPath();
                        ctx.moveTo(x, y + 2);
                        ctx.lineTo(x + uw, y + 2);
                        ctx.stroke();
                    }

                    const cw = measure(chunk.word, cStyle, cFamily);
                    x += cw;
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
 * Render a certificate onto a hidden canvas, export as a PDF, and trigger download.
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
    // Render on an offscreen canvas
    const canvas = document.createElement('canvas');
    await renderCertificateCanvas(canvas, participantData, eventData, config, registrationId);

    // Convert canvas → high-quality PNG data URL
    const imgDataUrl = canvas.toDataURL('image/png', 1.0);

    // Dynamically import jsPDF (already a client dependency)
    const { jsPDF } = await import('jspdf');

    // A4 landscape: 297 mm × 210 mm
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pW  = pdf.internal.pageSize.getWidth();   // 297
    const pH  = pdf.internal.pageSize.getHeight();  // 210

    // Stretch the 800×565 canvas to fill A4 landscape exactly (no margins)
    pdf.addImage(imgDataUrl, 'PNG', 0, 0, pW, pH);
    pdf.save(filename);
};
