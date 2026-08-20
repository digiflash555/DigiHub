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
import { jsPDF } from 'jspdf';

const cleanSection = (sec) => {
    if (sec === null || sec === undefined) return '';
    const s = String(sec).trim();
    if (s === '' || s.toLowerCase() === 'nil') return '';
    return s;
};

const imageCache = {};

/** Load an image from a URL and return an HTMLImageElement (or null on error), caching results. */
const loadImage = (src) =>
    new Promise((resolve) => {
        if (!src) return resolve(null);
        if (imageCache[src]) return resolve(imageCache[src]);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload  = () => {
            imageCache[src] = img;
            resolve(img);
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });

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
    ctx.clearRect(0, 0, W * dpr, H * dpr);

    // ── 1. Background / template image ────────────────────────────────────────
    if (config.template) {
        const img = await loadImage(config.template);
        if (img) ctx.drawImage(img, 0, 0, W * dpr, H * dpr);
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
        const fontSize   = (field.fontSize   || 20) * dpr;
        const baseColor  = field.color      || '#000000';
        const baseStyle  = field.fontStyle  || 'normal';
        const baseFamily = field.fontFamily || 'Helvetica';
        const align      = field.alignment  || 'left';
        const maxWidth   = (field.width      || 600) * dpr;

        ctx.save();

        if (field.type === 'Text') {
            // ── Build runs from richText segments (or fall back to field.text) ─
            const runs = [];
            const tokenizeSegmentToRuns = (rawText, segStyle) => {
                const varRegex = /\{[^}]+\}/g;
                let cursor = 0;
                let m;
                while ((m = varRegex.exec(rawText)) !== null) {
                    if (m.index > cursor) {
                        runs.push({
                            text: rawText.slice(cursor, m.index),
                            style: segStyle,
                            family: baseFamily,
                            color: baseColor,
                            isVar: false,
                            originalVar: null
                        });
                    }
                    const varKey2 = m[0];
                    const resolved = variables[varKey2] !== undefined ? variables[varKey2] : varKey2;
                    const varStyle = field.variableFontStyles?.[varKey2] || segStyle;
                    const varFamily = field.variableFontFamilies?.[varKey2] || baseFamily;
                    const varColor = field.variableColors?.[varKey2] || baseColor;
                    runs.push({
                        text: String(resolved),
                        style: varStyle,
                        family: varFamily,
                        color: varColor,
                        isVar: true,
                        originalVar: varKey2
                    });
                    cursor = varRegex.lastIndex;
                }
                if (cursor < rawText.length) {
                    runs.push({
                        text: rawText.slice(cursor),
                        style: segStyle,
                        family: baseFamily,
                        color: baseColor,
                        isVar: false,
                        originalVar: null
                    });
                }
            };

            if (field.richText && field.richText.length > 0) {
                for (const seg of field.richText) {
                    tokenizeSegmentToRuns(seg.text || '', seg.style || 'normal');
                }
            } else {
                tokenizeSegmentToRuns(field.text || '', baseStyle);
            }

            // ── measure helper ───────────────────────────────────────────────
            const measure = (wordText, wStyle, wFamily) => {
                ctx.font = buildFont(fontSize, wStyle, wFamily);
                return ctx.measureText(wordText).width;
            };

            // ── Group runs into proper Word tokens (splitting only by spaces) ─
            const words = [];
            let currentWord = { chunks: [], hasTrailingSpace: false };

            for (const run of runs) {
                const text = run.text;
                let wordStart = 0;

                for (let i = 0; i < text.length; i++) {
                    if (text[i] === ' ') {
                        if (i > wordStart) {
                            currentWord.chunks.push({
                                text: text.slice(wordStart, i),
                                style: run.style,
                                family: run.family,
                                color: run.color,
                                isVar: run.isVar,
                                originalVar: run.originalVar
                            });
                        }
                        if (currentWord.chunks.length > 0) {
                            currentWord.hasTrailingSpace = true;
                            words.push(currentWord);
                        }
                        currentWord = { chunks: [], hasTrailingSpace: false };
                        wordStart = i + 1;
                    }
                }

                if (wordStart < text.length) {
                    currentWord.chunks.push({
                        text: text.slice(wordStart),
                        style: run.style,
                        family: run.family,
                        color: run.color,
                        isVar: run.isVar,
                        originalVar: run.originalVar
                    });
                }
            }
            if (currentWord.chunks.length > 0) {
                words.push(currentWord);
            }

            const measureWord = (word) => {
                let w = 0;
                for (const chunk of word.chunks) {
                    w += measure(chunk.text, chunk.style, chunk.family);
                }
                if (word.hasTrailingSpace) {
                    w += measure(' ', 'normal', baseFamily);
                }
                return w;
            };

            // ── wrap words into lines ─────────────────────────────────────────
            const linesInfo  = [];
            let currentLine  = [];
            let currentWidth = 0;

            for (const word of words) {
                const wordWidth = measureWord(word);

                if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
                    linesInfo.push(currentLine);
                    currentLine  = [word];
                    currentWidth = wordWidth;
                } else {
                    currentLine.push(word);
                    currentWidth += wordWidth;
                }
            }
            if (currentLine.length > 0) linesInfo.push(currentLine);

            // ── measure visual width of line (excluding trailing space of last word) ──
            const getLineWidth = (lineArr) => {
                let width = 0;
                lineArr.forEach((word, idx) => {
                    for (const chunk of word.chunks) {
                        width += measure(chunk.text, chunk.style, chunk.family);
                    }
                    if (word.hasTrailingSpace && idx < lineArr.length - 1) {
                        width += measure(' ', 'normal', baseFamily);
                    }
                });
                return width;
            };

            // ── draw lines ────────────────────────────────────────────────────
            let y          = field.y * dpr;
            const lineH    = fontSize * 1.2;
            const lastIdx  = linesInfo.length - 1;

            linesInfo.forEach((lineArr, lineIdx) => {
                const lineWidth = getLineWidth(lineArr);

                let startX = field.x * dpr;
                if (align === 'center') startX = (field.x * dpr) - lineWidth / 2;
                if (align === 'right')  startX = (field.x * dpr) - lineWidth;

                let extraPerSpace = 0;
                if (align === 'justify' && lineIdx < lastIdx) {
                    const internalGaps = lineArr.length - 1;
                    if (internalGaps > 0) {
                        extraPerSpace = (maxWidth - lineWidth) / internalGaps;
                    }
                }

                let x = startX;
                ctx.textAlign    = 'left';
                ctx.textBaseline = 'alphabetic';

                lineArr.forEach((word, wordIdx) => {
                    word.chunks.forEach(chunk => {
                        const cColor  = (chunk.isVar && field.variableColors?.[chunk.originalVar]) || baseColor;
                        ctx.font      = buildFont(fontSize, chunk.style, chunk.family);
                        ctx.fillStyle = cColor;
                        ctx.fillText(chunk.text, x, y);

                        const isUnderlined = chunk.isVar && (field.underlineVariables || field.variableUnderlines?.[chunk.originalVar]);
                        if (isUnderlined) {
                            const uw = ctx.measureText(chunk.text).width;
                            ctx.strokeStyle = cColor;
                            ctx.lineWidth   = 1 * dpr;
                            ctx.beginPath();
                            ctx.moveTo(x, y + 2 * dpr);
                            ctx.lineTo(x + uw, y + 2 * dpr);
                            ctx.stroke();
                        }

                        x += measure(chunk.text, chunk.style, chunk.family);
                    });

                    if (word.hasTrailingSpace && wordIdx < lineArr.length - 1) {
                        x += measure(' ', 'normal', baseFamily);
                        if (align === 'justify' && lineIdx < lastIdx) {
                            x += extraPerSpace;
                        }
                    }
                });
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
                ctx.fillText(text, field.x * dpr, field.y * dpr);
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
    // 1. Render on a 3× offscreen canvas.
    // ------------------------------------------------------------------
    const DPR = 3; 
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

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pW  = pdf.internal.pageSize.getWidth();   // 297 mm
    const pH  = pdf.internal.pageSize.getHeight();  // 210 mm

    pdf.addImage(imgDataUrl, 'PNG', 0, 0, pW, pH, undefined, 'FAST');
    pdf.save(filename);
};

/**
 * Render a certificate and return it as a PNG Blob.
 * This is useful for bulk downloading certificates as images into a ZIP file.
 */
export const renderCertificateToBlob = async (
    participantData,
    eventData,
    config,
    registrationId = ''
) => {
    // We can use a lower DPR like 3 for images so the ZIP doesn't get excessively large,
    // but still maintains good quality (2400x1695)
    const DPR = 3; 
    const hiResCanvas = document.createElement('canvas');

    await renderCertificateCanvas(hiResCanvas, participantData, eventData, config, registrationId, DPR);

    return new Promise((resolve, reject) => {
        hiResCanvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
        }, 'image/png', 1.0);
    });
};

/**
 * Render a certificate and return it as a PDF Blob.
 * This is useful for bulk downloading certificates as PDFs into a ZIP file.
 */
export const renderCertificateToPDFBlob = async (
    participantData,
    eventData,
    config,
    registrationId = ''
) => {
    const DPR = 3; 
    const hiResCanvas = document.createElement('canvas');

    await renderCertificateCanvas(hiResCanvas, participantData, eventData, config, registrationId, DPR);

    const imgDataUrl = hiResCanvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pW  = pdf.internal.pageSize.getWidth();   // 297 mm
    const pH  = pdf.internal.pageSize.getHeight();  // 210 mm

    pdf.addImage(imgDataUrl, 'PNG', 0, 0, pW, pH, undefined, 'FAST');
    return pdf.output('blob');
};

