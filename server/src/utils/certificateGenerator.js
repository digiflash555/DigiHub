const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const cleanSection = (sec) => {
    if (sec === null || sec === undefined) return '';
    const s = String(sec).trim();
    if (s === '' || s.toLowerCase() === 'nil') return '';
    return s;
};

const generateCertificate = async (registration, config) => {
    // registration contains participant and event info
    // config contains template filename and fields array

    const { participant, event } = registration;
    
    // Determine Prefix
    const prefix = participant.gender === 'Female' ? 'Selvi' : 'Selvan';
    const year = participant.yearAndDept?.split(' ')[0] || '';
    const dept = participant.yearAndDept?.split(' ').slice(1).join(' ') || '';
    const yearAndDept = participant.yearAndDept || '';

    const variables = {
        'Prefix': prefix,
        'Name': participant.username,
        'RegisterNumber': participant.registrationNumber || '',
        'Year': year,
        'Department': dept,
        'YearOfStudy': year,
        'Year&Department': yearAndDept,
        'Section': cleanSection(participant.section),
        'EventName': event?.title || '',
        'EventDate': event?.eventDate ? new Date(event.eventDate).toLocaleDateString() : '',
        'CollegeName': participant.collegeName || 'Saranathan College of Engineering',
        'RegistrationID': registration.registrationId || ''
    };

    // High-resolution canvas: A4 landscape at 300 DPI = 3508 x 2480px
    // We use a scale factor relative to the original 800x565 template coordinate space
    const SCALE = 3.1; // 2480 / 800 ≈ 3.1
    const CANVAS_W = Math.round(800 * SCALE); // 2480
    const CANVAS_H = Math.round(565 * SCALE); // 1751

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [CANVAS_W, CANVAS_H],
        hotfixes: ['px_scaling']
    });

    // Load template image
    if (config.template) {
        try {
            let imgData;
            let format;
            
            if (config.template.startsWith('http')) {
                const response = await fetch(config.template);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    imgData = Buffer.from(arrayBuffer).toString('base64');
                    // Try to guess format from URL, default to JPEG
                    format = config.template.split('.').pop().toUpperCase();
                    if (!['PNG', 'JPEG', 'JPG', 'WEBP'].includes(format)) format = 'JPEG';
                }
            } else {
                // Fallback for old local files
                const templatePath = path.join(__dirname, '../../uploads', config.template);
                if (fs.existsSync(templatePath)) {
                    imgData = fs.readFileSync(templatePath).toString('base64');
                    format = config.template.split('.').pop().toUpperCase();
                }
            }

            if (imgData) {
                if (format === 'JPG') format = 'JPEG';
                doc.addImage(imgData, format, 0, 0, CANVAS_W, CANVAS_H);
            }
        } catch (error) {
            console.error('Error loading certificate template:', error);
        }
    }

    // Helper: map fontStyle string to jsPDF-compatible style
    const resolveStyle = (s) => {
        if (s === 'bolditalic') return 'bolditalic';
        if (s === 'bold')       return 'bold';
        if (s === 'italic')     return 'italic';
        return 'normal';
    };

    // Process fields
    config.fields.forEach(field => {
        const fontSize = (field.fontSize || 20) * SCALE;
        const color = field.color || '#000000';
        const style = resolveStyle(field.fontStyle);
        const align = field.alignment || 'left';
        const maxWidth = (field.width || 600) * SCALE;
        const fontFamily = field.fontFamily ? field.fontFamily.toLowerCase() : 'helvetica';

        doc.setFontSize(fontSize);
        try { doc.setFont(fontFamily, style); } catch { doc.setFont('helvetica', style); }

        if (field.type === 'Text') {
            const runs = [];
            const tokenizeSegmentToRuns = (rawText, segStyle, segScript, segColor) => {
                const varRegex = /\{([^}]+)\}/g;
                let cursor = 0;
                let m;
                while ((m = varRegex.exec(rawText)) !== null) {
                    if (m.index > cursor) {
                        runs.push({
                            text: rawText.substring(cursor, m.index),
                            style: segStyle,
                            script: segScript || 'normal',
                            color: segColor || color,
                            isVar: false,
                            originalVar: null
                        });
                    }
                    const varKey = m[0];          // e.g. '{Name}'
                    const varValue = variables[m[1]] !== undefined ? variables[m[1]] : varKey;
                    const varStyle = (field.variableFontStyles && field.variableFontStyles[varKey]) || segStyle;
                    const varColor = (field.variableColors && field.variableColors[varKey]) || segColor || color;
                    runs.push({
                        text: String(varValue),
                        style: varStyle,
                        script: segScript || 'normal',
                        color: varColor,
                        isVar: true,
                        originalVar: varKey
                    });
                    cursor = varRegex.lastIndex;
                }
                if (cursor < rawText.length) {
                    runs.push({
                        text: rawText.substring(cursor),
                        style: segStyle,
                        script: segScript || 'normal',
                        color: segColor || color,
                        isVar: false,
                        originalVar: null
                    });
                }
            };

            // Support fallback regex parsing if field.richText is empty but field.text has <sup> or <sub>
            const parseFallbackRichText = (str) => {
                const parts = [];
                const regex = /<(sup|sub)>([\s\S]*?)<\/\1>/gi;
                let lastIdx = 0;
                let match;
                while ((match = regex.exec(str)) !== null) {
                    if (match.index > lastIdx) {
                        parts.push({ text: str.slice(lastIdx, match.index), style: 'normal', script: 'normal' });
                    }
                    parts.push({
                        text: match[2],
                        style: 'normal',
                        script: match[1].toLowerCase()
                    });
                    lastIdx = regex.lastIndex;
                }
                if (lastIdx < str.length) {
                    parts.push({ text: str.slice(lastIdx), style: 'normal', script: 'normal' });
                }
                return parts;
            };

            if (field.richText && field.richText.length > 0) {
                for (const seg of field.richText) {
                    tokenizeSegmentToRuns(seg.text || '', seg.style || 'normal', seg.script || 'normal', seg.color);
                }
            } else if (field.text && (field.text.includes('<sup') || field.text.includes('<sub'))) {
                const fallbackSegs = parseFallbackRichText(field.text);
                for (const seg of fallbackSegs) {
                    tokenizeSegmentToRuns(seg.text || '', seg.style || style, seg.script || 'normal', null);
                }
            } else {
                tokenizeSegmentToRuns(field.text || '', style, 'normal', null);
            }

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
                                text: text.substring(wordStart, i),
                                style: run.style,
                                script: run.script,
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
                        text: text.substring(wordStart),
                        style: run.style,
                        script: run.script,
                        color: run.color,
                        isVar: run.isVar,
                        originalVar: run.originalVar
                    });
                }
            }
            if (currentWord.chunks.length > 0) {
                words.push(currentWord);
            }

            // ── measure helper ────────────────────────────────────────────────
            const measureText = (text, chunkStyle, chunkFontFam = fontFamily, chunkScript = 'normal') => {
                const isScript = chunkScript === 'sub' || chunkScript === 'sup';
                const effectiveSize = isScript ? Math.round(fontSize * 0.62) : fontSize;
                doc.setFontSize(effectiveSize);
                try { doc.setFont(chunkFontFam, resolveStyle(chunkStyle)); }
                catch { doc.setFont('helvetica', resolveStyle(chunkStyle)); }
                const width = typeof doc.getTextWidth === 'function'
                    ? doc.getTextWidth(text)
                    : (doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor);
                doc.setFontSize(fontSize);
                return width;
            };

            const measureWord = (word) => {
                let w = 0;
                for (const chunk of word.chunks) {
                    const wFontFam = (chunk.isVar && field.variableFontFamilies?.[chunk.originalVar]) || fontFamily;
                    w += measureText(chunk.text, chunk.style, wFontFam, chunk.script);
                }
                if (word.hasTrailingSpace) {
                    w += measureText(' ', 'normal', fontFamily, 'normal');
                }
                return w;
            };

            // ── wrap into lines ───────────────────────────────────────────────
            let linesInfo = [];
            let currentLine = [];
            let currentLineWidth = 0;

            for (const wo of words) {
                const wordWidth = measureWord(wo);
                if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
                    linesInfo.push(currentLine);
                    currentLine = [wo];
                    currentLineWidth = wordWidth;
                } else {
                    currentLine.push(wo);
                    currentLineWidth += wordWidth;
                }
            }
            if (currentLine.length > 0) linesInfo.push(currentLine);

            // ── draw lines ────────────────────────────────────────────────────
            let y = field.y * SCALE;
            const lineHeight = fontSize * 1.2;
            const lastIdx = linesInfo.length - 1;

            linesInfo.forEach((lineArray, lineIdx) => {
                const isLastLine = lineIdx === lastIdx;

                let lineWidth = 0;
                lineArray.forEach((word, idx) => {
                    for (const chunk of word.chunks) {
                        const wFontFam = (chunk.isVar && field.variableFontFamilies?.[chunk.originalVar]) || fontFamily;
                        lineWidth += measureText(chunk.text, chunk.style, wFontFam, chunk.script);
                    }
                    if (word.hasTrailingSpace && idx < lineArray.length - 1) {
                        lineWidth += measureText(' ', 'normal', fontFamily, 'normal');
                    }
                });

                let startX = field.x * SCALE;
                if (align === 'center') startX = field.x * SCALE - lineWidth / 2;
                if (align === 'right')  startX = field.x * SCALE - lineWidth;

                let extraSpacePerWord = 0;
                const internalGaps = lineArray.length - 1;
                if (align === 'justify' && !isLastLine && internalGaps > 0) {
                    extraSpacePerWord = (maxWidth - lineWidth) / internalGaps;
                }

                let x = startX;
                lineArray.forEach((word, wordIdx) => {
                    word.chunks.forEach(chunk => {
                        const textColor   = (chunk.isVar && field.variableColors?.[chunk.originalVar]) || chunk.color || color;
                        const textFontFam = (chunk.isVar && field.variableFontFamilies?.[chunk.originalVar]) || fontFamily;
                        const isScript    = chunk.script === 'sub' || chunk.script === 'sup';
                        const effectiveSize = isScript ? Math.round(fontSize * 0.62) : fontSize;

                        let drawY = y;
                        if (chunk.script === 'sup') {
                            drawY = y - fontSize * 0.38;
                        } else if (chunk.script === 'sub') {
                            drawY = y + fontSize * 0.18;
                        }

                        doc.setTextColor(textColor);
                        doc.setFontSize(effectiveSize);
                        try { doc.setFont(textFontFam, resolveStyle(chunk.style)); }
                        catch { doc.setFont('helvetica', resolveStyle(chunk.style)); }
                        doc.text(chunk.text, x, drawY, { align: 'left', baseline: 'alphabetic' });

                        if (chunk.isVar && field.underlineVariables) {
                            doc.setDrawColor(textColor);
                            doc.setLineWidth(SCALE);
                            const drawWidth = measureText(chunk.text, chunk.style, textFontFam, chunk.script);
                            doc.line(x, drawY + 2 * SCALE, x + drawWidth, drawY + 2 * SCALE);
                        }

                        x += measureText(chunk.text, chunk.style, textFontFam, chunk.script);
                    });

                    if (word.hasTrailingSpace && wordIdx < lineArray.length - 1) {
                        x += measureText(' ', 'normal', fontFamily, 'normal');
                        if (align === 'justify' && !isLastLine) {
                            x += extraSpacePerWord;
                        }
                    }
                });
                y += lineHeight;
            });

        } else {
            // Legacy/Direct field types
            let text = '';
            switch (field.type) {
                case 'Prefix': text = variables['Prefix']; break;
                case 'Name': text = variables['Name']; break;
                case 'Year': text = variables['Year']; break;
                case 'Department': text = variables['Department']; break;
                case 'RegistrationID': text = variables['RegistrationID']; break;
                case 'EventName': text = variables['EventName']; break;
                case 'Section': text = variables['Section']; break;
                default: text = '';
            }
            if (text) {
                doc.setTextColor(color);
                const lines = doc.splitTextToSize(String(text), maxWidth);
                doc.text(lines, field.x * SCALE, field.y * SCALE, { 
                    align: align,
                    lineHeightFactor: 1.2
                });
            }
        }
    });

    return doc.output('arraybuffer');
};

module.exports = generateCertificate;
