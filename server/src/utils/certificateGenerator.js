const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

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

    // Process fields
    config.fields.forEach(field => {
        const fontSize = field.fontSize || 20;
        const color = field.color || '#000000';
        const style = field.fontStyle || 'normal';
        const align = field.alignment || 'left';
        const maxWidth = field.width || 600;
        const fontFamily = field.fontFamily ? field.fontFamily.toLowerCase() : 'helvetica';

        doc.setFontSize(fontSize);
        doc.setFont(fontFamily, style);

        if (field.type === 'Text') {
            let sampleText = field.text || '';
            let segments = [];
            let currentIdx = 0;
            const regex = /\{([^}]+)\}/g;
            let match;
            while ((match = regex.exec(sampleText)) !== null) {
                if (match.index > currentIdx) {
                    segments.push({ text: sampleText.substring(currentIdx, match.index), isVar: false });
                }
                const keyName = match[1];
                const varValue = variables[keyName] !== undefined ? variables[keyName] : match[0];
                segments.push({ text: varValue, isVar: true, originalVar: match[0] });
                currentIdx = regex.lastIndex;
            }
            if (currentIdx < sampleText.length) {
                segments.push({ text: sampleText.substring(currentIdx), isVar: false });
            }

            // Split segments into words
            let wordsInfo = [];
            segments.forEach(seg => {
                let segText = String(seg.text);
                let words = segText.split(' ');
                words.forEach((w, i) => {
                    if (i < words.length - 1) {
                        wordsInfo.push({ word: w + ' ', isVar: seg.isVar, originalVar: seg.originalVar });
                    } else if (w.length > 0) {
                        wordsInfo.push({ word: w, isVar: seg.isVar, originalVar: seg.originalVar });
                    }
                });
            });

            // Group into lines based on max width
            let linesInfo = [];
            let currentLine = [];
            let currentLineWidth = 0;
            
            // Helper function to measure text in jsPDF
            const measureText = (text, chunkStyle, chunkFontFam = fontFamily) => {
                doc.setFont(chunkFontFam, chunkStyle);
                return doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
            }

            for (let i = 0; i < wordsInfo.length; i++) {
                let wordObj = wordsInfo[i];
                let textStyle = style;
                let textFontFamily = fontFamily;
                if (wordObj.isVar) {
                    textStyle = (field.variableFontStyles && field.variableFontStyles[wordObj.originalVar]) || style;
                    if (field.variableFontFamilies && field.variableFontFamilies[wordObj.originalVar]) {
                        textFontFamily = field.variableFontFamilies[wordObj.originalVar];
                    }
                }
                let wordWidth = measureText(wordObj.word, textStyle, textFontFamily);
                
                if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
                    linesInfo.push(currentLine);
                    currentLine = [wordObj];
                    currentLineWidth = wordWidth;
                } else {
                    currentLine.push(wordObj);
                    currentLineWidth += wordWidth;
                }
            }
            if (currentLine.length > 0) {
                linesInfo.push(currentLine);
            }

            // Draw lines
            let y = field.y;
            const lineHeight = fontSize * 1.2;
            
            linesInfo.forEach(lineArray => {
                const lineWidth = lineArray.reduce((sum, w) => {
                    let wStyle = style;
                    let wFontFam = fontFamily;
                    if (w.isVar) {
                        wStyle = (field.variableFontStyles && field.variableFontStyles[w.originalVar]) || style;
                        if (field.variableFontFamilies && field.variableFontFamilies[w.originalVar]) {
                            wFontFam = field.variableFontFamilies[w.originalVar];
                        }
                    }
                    return sum + measureText(w.word, wStyle, wFontFam);
                }, 0);
                
                let startX = field.x;
                if (align === 'center') startX = field.x - lineWidth / 2;
                if (align === 'right') startX = field.x - lineWidth;
                
                let extraSpacePerWord = 0;
                let isLastLine = (linesInfo.indexOf(lineArray) === linesInfo.length - 1);
                
                if (align === 'justify' && !isLastLine && lineArray.length > 1) {
                    let numSpaces = 0;
                    lineArray.forEach(w => {
                        if (w.word.endsWith(' ')) numSpaces++;
                    });
                    if (numSpaces > 0) {
                        extraSpacePerWord = (maxWidth - lineWidth) / numSpaces;
                    }
                }

                let x = startX;
                lineArray.forEach(chunk => {
                    let textColor = color;
                    let textStyle = style;
                    let textFontFam = fontFamily;
                    if (chunk.isVar) {
                        textColor = (field.variableColors && field.variableColors[chunk.originalVar]) || color;
                        textStyle = (field.variableFontStyles && field.variableFontStyles[chunk.originalVar]) || style;
                        if (field.variableFontFamilies && field.variableFontFamilies[chunk.originalVar]) {
                            textFontFam = field.variableFontFamilies[chunk.originalVar];
                        }
                    }
                    doc.setTextColor(textColor);
                    doc.setFont(textFontFam, textStyle);
                    doc.text(chunk.word, x, y, { align: 'left' });

                    if (chunk.isVar && field.underlineVariables) {
                        doc.setDrawColor(textColor);
                        doc.setLineWidth(1);
                        let drawWidth = measureText(chunk.word.trimEnd(), textStyle, textFontFam);
                        doc.line(x, y + 2, x + drawWidth, y + 2);
                    }

                    x += measureText(chunk.word, textStyle, textFontFam);
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
