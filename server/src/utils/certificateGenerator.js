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

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 565]
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
                doc.addImage(imgData, format, 0, 0, 800, 565);
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
        const fontSize = field.fontSize || 20;
        const color = field.color || '#000000';
        const style = resolveStyle(field.fontStyle);
        const align = field.alignment || 'left';
        const maxWidth = field.width || 600;
        const fontFamily = field.fontFamily ? field.fontFamily.toLowerCase() : 'helvetica';

        doc.setFontSize(fontSize);
        try { doc.setFont(fontFamily, style); } catch { doc.setFont('helvetica', style); }

        if (field.type === 'Text') {
            // ── Build word chunks (richText path or legacy fallback) ───────────
            //
            // richText: [{ text: string, style: 'normal'|'bold'|'italic'|'bolditalic' }]
            // Each segment may contain {Variable} tokens; variables get per-var style overrides.

            const wordsInfo = [];

            const pushWords = (text, wordStyle, isVar, originalVar) => {
                const words = String(text).split(' ');
                words.forEach((w, i) => {
                    const word = i < words.length - 1 ? w + ' ' : w;
                    if (word.length > 0) {
                        wordsInfo.push({ word, style: wordStyle, isVar, originalVar });
                    }
                });
            };

            const tokenizeSegment = (rawText, segStyle) => {
                const varRegex = /\{([^}]+)\}/g;
                let cursor = 0;
                let m;
                while ((m = varRegex.exec(rawText)) !== null) {
                    if (m.index > cursor) {
                        pushWords(rawText.substring(cursor, m.index), segStyle, false, null);
                    }
                    const varKey  = m[0];          // e.g. '{Name}'
                    const varValue = variables[m[1]] !== undefined ? variables[m[1]] : varKey;
                    const varStyle = (field.variableFontStyles && field.variableFontStyles[varKey]) || segStyle;
                    pushWords(varValue, varStyle, true, varKey);
                    cursor = varRegex.lastIndex;
                }
                if (cursor < rawText.length) {
                    pushWords(rawText.substring(cursor), segStyle, false, null);
                }
            };

            if (field.richText && field.richText.length > 0) {
                // ── NEW: per-segment styles ──────────────────────────────────
                for (const seg of field.richText) {
                    tokenizeSegment(seg.text || '', seg.style || 'normal');
                }
            } else {
                // ── LEGACY: single style for whole field ────────────────────
                tokenizeSegment(field.text || '', style);
            }

            // ── measure helper ────────────────────────────────────────────────
            const measureText = (text, chunkStyle, chunkFontFam = fontFamily) => {
                try { doc.setFont(chunkFontFam, resolveStyle(chunkStyle)); }
                catch { doc.setFont('helvetica', resolveStyle(chunkStyle)); }
                return doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
            };

            // ── wrap into lines ───────────────────────────────────────────────
            let linesInfo = [];
            let currentLine = [];
            let currentLineWidth = 0;

            for (const wo of wordsInfo) {
                const wFontFam = (wo.isVar && field.variableFontFamilies?.[wo.originalVar]) || fontFamily;
                const wordWidth = measureText(wo.word, wo.style, wFontFam);
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
            let y = field.y;
            const lineHeight = fontSize * 1.2;

            linesInfo.forEach((lineArray, lineIdx) => {
                const isLastLine = lineIdx === linesInfo.length - 1;

                const lineWidth = lineArray.reduce((sum, w) => {
                    const wFontFam = (w.isVar && field.variableFontFamilies?.[w.originalVar]) || fontFamily;
                    return sum + measureText(w.word, w.style, wFontFam);
                }, 0);

                let startX = field.x;
                if (align === 'center') startX = field.x - lineWidth / 2;
                if (align === 'right')  startX = field.x - lineWidth;

                let extraSpacePerWord = 0;
                if (align === 'justify' && !isLastLine && lineArray.length > 1) {
                    const numSpaces = lineArray.filter(w => w.word.endsWith(' ')).length;
                    if (numSpaces > 0) extraSpacePerWord = (maxWidth - lineWidth) / numSpaces;
                }

                let x = startX;
                lineArray.forEach(chunk => {
                    const textColor  = (chunk.isVar && field.variableColors?.[chunk.originalVar]) || color;
                    const textFontFam = (chunk.isVar && field.variableFontFamilies?.[chunk.originalVar]) || fontFamily;

                    doc.setTextColor(textColor);
                    try { doc.setFont(textFontFam, resolveStyle(chunk.style)); }
                    catch { doc.setFont('helvetica', resolveStyle(chunk.style)); }
                    doc.text(chunk.word, x, y, { align: 'left' });

                    if (chunk.isVar && field.underlineVariables) {
                        doc.setDrawColor(textColor);
                        doc.setLineWidth(1);
                        const drawWidth = measureText(chunk.word.trimEnd(), chunk.style, textFontFam);
                        doc.line(x, y + 2, x + drawWidth, y + 2);
                    }

                    x += measureText(chunk.word, chunk.style, textFontFam);
                    if (align === 'justify' && !isLastLine && chunk.word.endsWith(' ')) {
                        x += extraSpacePerWord;
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
                doc.text(lines, field.x, field.y, { 
                    align: align,
                    lineHeightFactor: 1.2
                });
            }
        }
    });

    return doc.output('arraybuffer');
};

module.exports = generateCertificate;
