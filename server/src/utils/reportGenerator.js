const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default || require('jspdf-autotable');

const cleanSection = (sec) => {
    if (sec === null || sec === undefined) return '';
    const s = String(sec).trim();
    if (s === '' || s.toLowerCase() === 'nil') return '';
    return s;
};

const generateExcelReport = async (registrations, eventTitle) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');

    // 1. Determine all unique static and dynamic keys
    const dynamicKeys = new Set();
    registrations.forEach(reg => {
        if (reg.formData) {
            const data = (reg.formData instanceof Map) ? Object.fromEntries(reg.formData) : reg.formData;
            Object.keys(data).forEach(key => dynamicKeys.add(key));
        }
    });

    const columns = [
        { header: 'No', key: 'no', width: 10 },
        { header: 'Registration ID', key: 'regId', width: 25 },
        { header: 'Participant Name', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'Student ID', key: 'studentId', width: 20 },
    ];

    const dynamicArray = Array.from(dynamicKeys);
    dynamicArray.forEach(key => {
        columns.push({ header: key, key: `dyn_${key}`, width: 25 });
    });

    columns.push(
        { header: 'Attendance', key: 'attendance', width: 15 },
        { header: 'Check-in Time', key: 'time', width: 25 },
    );

    worksheet.columns = columns;

    registrations.forEach((reg, index) => {
        const rowData = {
            no: index + 1,
            regId: reg.registrationId,
            name: reg.participant?.username || 'N/A',
            email: reg.participant?.email || 'N/A',
            studentId: reg.participant?.registrationNumber || 'N/A',
            attendance: reg.attendanceStatus ? 'Yes' : 'No',
            time: reg.attendanceTime ? new Date(reg.attendanceTime).toLocaleString() : '-'
        };

        if (reg.formData) {
            const data = (reg.formData instanceof Map) ? Object.fromEntries(reg.formData) : reg.formData;
            dynamicArray.forEach(key => {
                rowData[`dyn_${key}`] = data[key] || '-';
            });
        }
        worksheet.addRow(rowData);
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0F2FE' }
    };

    return await workbook.xlsx.writeBuffer();
};

const fs = require('fs');
const path = require('path');
const Settings = require('../models/Settings');

// Load logo as base64 from server folder or Cloudinary URL
const getLogoBase64 = async (filename) => {
    if (!filename) return null;

    if (filename.startsWith('http')) {
        try {
            const response = await fetch(filename);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const data = Buffer.from(arrayBuffer).toString('base64');
                let ext = filename.split('.').pop().toLowerCase();
                if (!['png', 'jpeg', 'jpg', 'webp'].includes(ext)) ext = 'png';
                const format = (ext === 'jpg' || ext === 'jpeg') ? 'JPEG' : ext.toUpperCase();
                return { data, format };
            }
        } catch (e) {
            console.warn('Failed to fetch remote logo', e);
        }
        return null;
    }

    // Strip any leading URL path segments (e.g. "/uploads/") to get the bare filename
    const basename = path.basename(filename);
    const uploadsDir = path.join(__dirname, '../../uploads');

    // Candidate paths to try, in priority order
    const candidates = [
        path.join(uploadsDir, basename),          // uploads/<basename>
        path.join(__dirname, '../../', filename), // relative to server root (fallback)
        filename,                                  // absolute path stored directly
    ];

    for (const candidate of candidates) {
        try {
            if (fs.existsSync(candidate)) {
                const fileBuffer = fs.readFileSync(candidate);
                const ext = path.extname(basename).substring(1).toLowerCase() || 'png';
                const format = (ext === 'jpg' || ext === 'jpeg') ? 'JPEG' : ext.toUpperCase();
                return { data: fileBuffer.toString('base64'), format };
            }
        } catch (e) { /* skip inaccessible paths */ }
    }
    return null;
};

const generatePDFReport = async (registrations, event, options = {}) => {
    const doc = new jsPDF();
    const isAttendance = (options.header || '').toLowerCase().includes('attendance');
    const titleText = options.header || "Registration Report";


    // Fetch settings for symposium details and logos
    let settings = {
        symposiumName: options.symposiumName || 'DIGIFLASH 2026',
        symposiumType: options.symposiumType || 'National Level Technical Symposium',
        iicLogo: 'iiclogo.png',
        digiflashLogo: 'DigiflashLogo.png',
        associationCoordinatorSign: '',
        hodSign: ''
    };
    try {
        const settingsDoc = await Settings.getSettings();
        if (settingsDoc) {
            settings = { ...settings, ...(settingsDoc.toObject ? settingsDoc.toObject() : settingsDoc) };
            settings.symposiumName = options.symposiumName || settingsDoc.symposiumName || 'DIGIFLASH 2026';
            settings.symposiumType = options.symposiumType || settingsDoc.symposiumType || 'National Level Technical Symposium';
            settings.iicLogo = settingsDoc.iicLogo || 'iiclogo.png';
            settings.digiflashLogo = settingsDoc.digiflashLogo || 'DigiflashLogo.png';
        }
    } catch (err) {
        console.warn('Failed to load settings in reportGenerator', err);
    }

    const iicLogoObj = await getLogoBase64(settings.iicLogo);
    const digiflashLogoObj = await getLogoBase64(settings.digiflashLogo);

    const drawHeader = (docInstance) => {
        // Left Logo (IIC)
        if (iicLogoObj) {
            try {
                docInstance.addImage(iicLogoObj.data, iicLogoObj.format, 15, 12, 24, 24);
            } catch (e) {
                console.error("Error adding IIC logo", e);
                docInstance.rect(15, 12, 24, 24);
            }
        } else {
            docInstance.setDrawColor(200, 200, 200);
            docInstance.setFillColor(245, 245, 245);
            docInstance.rect(15, 12, 24, 24, 'FD');
            docInstance.setFont("helvetica", "bold");
            docInstance.setFontSize(8);
            docInstance.setTextColor(150, 150, 150);
            docInstance.text("IIC LOGO", 27, 24, { align: 'center' });
        }

        // Right Logo (Digiflash)
        if (digiflashLogoObj) {
            try {
                docInstance.addImage(digiflashLogoObj.data, digiflashLogoObj.format, 171, 12, 24, 24);
            } catch (e) {
                console.error("Error adding Digiflash logo", e);
                docInstance.rect(171, 12, 24, 24);
            }
        } else {
            docInstance.setDrawColor(200, 200, 200);
            docInstance.setFillColor(245, 245, 245);
            docInstance.rect(171, 12, 24, 24, 'FD');
            docInstance.setFont("helvetica", "bold");
            docInstance.setFontSize(8);
            docInstance.setTextColor(150, 150, 150);
            docInstance.text("DIGIFLASH", 183, 24, { align: 'center' });
        }

        // Center Header Texts
        docInstance.setTextColor(15, 23, 42); // slate-900

        docInstance.setFont("helvetica", "bold");
        docInstance.setFontSize(10.5);
        docInstance.text("Dr. Mahalingam College of Engineering and Technology, Pollachi", 105, 16, { align: 'center' });

        docInstance.setFont("helvetica", "bold");
        docInstance.setFontSize(9.5);
        docInstance.text("Department of Computer Science and Engineering", 105, 21, { align: 'center' });

        docInstance.setFont("helvetica", "normal");
        docInstance.setFontSize(9);
        docInstance.text("Digiflash proudly organizes", 105, 26, { align: 'center' });

        docInstance.setFont("helvetica", "bold");
        docInstance.setFontSize(11.5);
        docInstance.text(settings.symposiumName, 105, 31, { align: 'center' });

        docInstance.setFont("helvetica", "bold");
        docInstance.setFontSize(8.5);
        docInstance.text(settings.symposiumType, 105, 35.5, { align: 'center' });

        // Event details box borders
        docInstance.setDrawColor(200, 220, 240); // light blue border
        docInstance.setLineWidth(0.3);
        docInstance.rect(15, 40, 180, 13); // outer box
        docInstance.line(110, 40, 110, 53); // vertical division

        // Left Column
        docInstance.setFont("helvetica", "normal");
        docInstance.setFontSize(9);
        docInstance.text("Name of the Event: ", 17, 45);
        docInstance.setFont("helvetica", "bold");
        docInstance.text(event.title, 45, 45);

        docInstance.setFont("helvetica", "normal");
        docInstance.text("Date: ", 17, 50.5);
        docInstance.setFont("helvetica", "bold");
        docInstance.text(new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }), 27, 50.5);

        // Right Column
        docInstance.setFont("helvetica", "normal");
        docInstance.text("Timing: ", 113, 45);
        docInstance.setFont("helvetica", "bold");
        docInstance.text(`${event.startTime || 'N/A'} - ${event.endTime || 'N/A'}`, 125, 45);

        docInstance.setFont("helvetica", "normal");
        docInstance.text("Venue: ", 113, 50.5);
        docInstance.setFont("helvetica", "bold");
        docInstance.text(event.venue, 125, 50.5);

        // Title Section
        docInstance.setFont("helvetica", "bold");
        docInstance.setFontSize(13);
        docInstance.setTextColor(30, 41, 59); // slate-800
        docInstance.text(titleText, 105, 60.5, { align: 'center' });

        docInstance.setDrawColor(226, 232, 240);
        docInstance.line(85, 62.5, 125, 62.5);
    };

    // Columns config (specifically tailored for PDF)
    const isTeamEvent = event.participationType === 'Team';

    let sortedRegistrations = [...registrations];
    if (isTeamEvent) {
        sortedRegistrations.sort((a, b) => {
            const teamA = a.team ? (a.team.name || a.team._id.toString()) : '';
            const teamB = b.team ? (b.team.name || b.team._id.toString()) : '';
            return teamA.localeCompare(teamB);
        });
    }

    const tableColumn = isAttendance 
        ? ['S.No', 'Roll Number', 'Name of the Student', 'Dept/Class', 'Signature of the student']
        : ['S.No', 'Roll Number', 'Name of the Student', 'Dept/Class', 'Email', 'Contact Number'];

    let tableRows = [];
    const signaturesList = [];
    if (!isTeamEvent) {
        tableRows = sortedRegistrations.map((reg, index) => {
            const participant = reg.participant || {};
            const sectionVal = cleanSection(participant.section);
            const classDept = (participant.yearAndDept && sectionVal)
                ? `${participant.yearAndDept} - ${sectionVal}`
                : (participant.yearAndDept || participant.department || '-');

            const rowData = [
                (index + 1).toString(),
                participant.registrationNumber || 'N/A',
                participant.username || 'N/A',
                classDept
            ];
            if (isAttendance) {
                rowData.push('');
                signaturesList.push(reg.signature || (participant && participant.signature) || null);
            } else {
                rowData.push(participant.email || '-');
                rowData.push(participant.phone || '-');
            }
            return rowData;
        });
    } else {
        const teamsMap = {};
        const teamOrder = [];
        sortedRegistrations.forEach(reg => {
            const teamId = reg.team ? reg.team._id.toString() : 'Unknown';
            if (!teamsMap[teamId]) {
                teamsMap[teamId] = { teamObj: reg.team, members: [] };
                teamOrder.push(teamId);
            }
            teamsMap[teamId].members.push(reg);
        });

        let teamCounter = 0;
        teamOrder.forEach(teamId => {
            teamCounter++;
            const teamData = teamsMap[teamId];
            const members = teamData.members;

            members.forEach((reg, index) => {
                const participant = reg.participant || {};
                const sectionVal = cleanSection(participant.section);
                const classDept = (participant.yearAndDept && sectionVal)
                    ? `${participant.yearAndDept} - ${sectionVal}`
                    : (participant.yearAndDept || participant.department || '-');

                const rowData = [
                    participant.registrationNumber || 'N/A',
                    participant.username || 'N/A',
                    classDept
                ];
                if (isAttendance) {
                    rowData.push('');
                    signaturesList.push(reg.signature || (participant && participant.signature) || null);
                } else {
                    rowData.push(participant.email || '-');
                    rowData.push(participant.phone || '-');
                }

                if (index === 0) {
                    tableRows.push([
                        { content: teamCounter.toString(), rowSpan: members.length, styles: { halign: 'center', valign: 'middle' } },
                        ...rowData
                    ]);
                } else {
                    tableRows.push(rowData);
                }
            });
        });
    }

    const signatureImages = [];
    if (isAttendance) {
        const fetchPromises = signaturesList.map(sig => getLogoBase64(sig));
        const resolvedSigs = await Promise.all(fetchPromises);
        signatureImages.push(...resolvedSigs);
    }

    autoTable(doc, {
        startY: 68,
        margin: { top: 68 },
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 8, cellPadding: 4, verticalAlign: 'middle', halign: 'center' },
        columnStyles: isTeamEvent ? (
            isAttendance ? {
                0: { halign: 'center', cellWidth: 15 },
                1: { halign: 'center', cellWidth: 35 },
                2: { halign: 'center', cellWidth: 50 },
                3: { halign: 'center', cellWidth: 40 },
                4: { halign: 'center', cellWidth: 40 }
            } : {
                0: { halign: 'center', cellWidth: 12 },
                1: { halign: 'center', cellWidth: 25 },
                2: { halign: 'center', cellWidth: 45 },
                3: { halign: 'center', cellWidth: 35 },
                4: { halign: 'center', cellWidth: 35 },
                5: { halign: 'center', cellWidth: 28 }
            }
        ) : (
            isAttendance ? {
                0: { halign: 'center', cellWidth: 15 },
                1: { halign: 'center', cellWidth: 35 },
                2: { halign: 'center', cellWidth: 50 },
                3: { halign: 'center', cellWidth: 40 },
                4: { halign: 'center', cellWidth: 40 }
            } : {
                0: { halign: 'center', cellWidth: 12 },
                1: { halign: 'center', cellWidth: 25 },
                2: { halign: 'center', cellWidth: 45 },
                3: { halign: 'center', cellWidth: 35 },
                4: { halign: 'center', cellWidth: 35 },
                5: { halign: 'center', cellWidth: 28 }
            }
        ),
        didDrawPage: (data) => {
            drawHeader(doc);
        },
        didDrawCell: (data) => {
            if (isAttendance && data.section === 'body' && data.column.index === 4) {
                const sigObj = signatureImages[data.row.index];
                if (sigObj && sigObj.data) {
                    try {
                        const dimH = data.cell.height - 4;
                        const dimW = data.cell.width - 4;
                        doc.addImage(sigObj.data, sigObj.format, data.cell.x + 2, data.cell.y + 2, dimW, dimH);
                    } catch (e) {
                        console.error('Failed to add signature image to cell', e);
                    }
                }
            }
        }
    });

    // Signatures footer on the last page
    let finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 70) + 25;
    if (finalY > 250) {
        doc.addPage();
        finalY = 85;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    const assocSignObj = await getLogoBase64(settings.associationCoordinatorSign);
    const hodSignObj = await getLogoBase64(settings.hodSign);

    // Association Coordinator signature
    if (assocSignObj) {
        try {
            doc.addImage(assocSignObj.data, assocSignObj.format, 35, finalY - 12, 30, 15);
        } catch (e) {
            console.error("Error adding assoc sign:", e);
        }
    }
    doc.text("__________________________", 50, finalY, { align: 'center' });
    doc.text("Association Coordinator", 50, finalY + 7, { align: 'center' });

    // HOD signature
    if (hodSignObj) {
        try {
            doc.addImage(hodSignObj.data, hodSignObj.format, 145, finalY - 12, 30, 15);
        } catch (e) {
            console.error("Error adding HOD sign:", e);
        }
    }
    doc.text("__________________________", 160, finalY, { align: 'center' });
    doc.text("Head of Department", 160, finalY + 7, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
};

const generateFeedbackPDFReport = async (feedbacks, event, options = {}) => {
    const doc = new jsPDF();

    // Fetch settings for symposium details and logos
    let settings = {
        symposiumName: options.symposiumName || 'DIGIFLASH 2026',
        symposiumType: options.symposiumType || 'National Level Technical Symposium',
        iicLogo: 'iiclogo.png',
        digiflashLogo: 'DigiflashLogo.png',
        associationCoordinatorSign: '',
        hodSign: ''
    };
    try {
        const settingsDoc = await Settings.getSettings();
        if (settingsDoc) {
            settings = { ...settings, ...(settingsDoc.toObject ? settingsDoc.toObject() : settingsDoc) };
            settings.symposiumName = options.symposiumName || settingsDoc.symposiumName || 'DIGIFLASH 2026';
            settings.symposiumType = options.symposiumType || settingsDoc.symposiumType || 'National Level Technical Symposium';
            settings.iicLogo = settingsDoc.iicLogo || 'iiclogo.png';
            settings.digiflashLogo = settingsDoc.digiflashLogo || 'DigiflashLogo.png';
        }
    } catch (err) {
        console.warn('Failed to load settings in reportGenerator', err);
    }

    const iicLogoObj = await getLogoBase64(settings.iicLogo);
    const digiflashLogoObj = await getLogoBase64(settings.digiflashLogo);

    const drawHeader = (docInstance) => {
        // Left Logo (IIC)
        if (iicLogoObj) {
            try {
                docInstance.addImage(iicLogoObj.data, iicLogoObj.format, 15, 12, 24, 24);
            } catch (e) {
                console.error("Error adding IIC logo", e);
                docInstance.rect(15, 12, 24, 24);
            }
        } else {
            docInstance.setDrawColor(200, 200, 200);
            docInstance.setFillColor(245, 245, 245);
            docInstance.rect(15, 12, 24, 24, 'FD');
            docInstance.setFont("helvetica", "bold");
            docInstance.setFontSize(8);
            docInstance.setTextColor(150, 150, 150);
            docInstance.text("IIC LOGO", 27, 24, { align: 'center' });
        }

        // Right Logo (Digiflash)
        if (digiflashLogoObj) {
            try {
                docInstance.addImage(digiflashLogoObj.data, digiflashLogoObj.format, 171, 12, 24, 24);
            } catch (e) {
                console.error("Error adding Digiflash logo", e);
                docInstance.rect(171, 12, 24, 24);
            }
        } else {
            docInstance.setDrawColor(200, 200, 200);
            docInstance.setFillColor(245, 245, 245);
            docInstance.rect(171, 12, 24, 24, 'FD');
            docInstance.setFont("helvetica", "bold");
            docInstance.setFontSize(8);
            docInstance.setTextColor(150, 150, 150);
            docInstance.text("DIGIFLASH", 183, 24, { align: 'center' });
        }

        // Center Header Texts
        docInstance.setTextColor(15, 23, 42);
        docInstance.setFont("helvetica", "bold");
        docInstance.setFontSize(10.5);
        docInstance.text("Dr. Mahalingam College of Engineering and Technology, Pollachi", 105, 16, { align: 'center' });

        docInstance.setFont("helvetica", "bold");
        docInstance.setFontSize(9.5);
        docInstance.text("Department of Computer Science and Engineering", 105, 21, { align: 'center' });

        docInstance.setFont("helvetica", "normal");
        docInstance.setFontSize(9);
        docInstance.text("Digiflash proudly organizes", 105, 26, { align: 'center' });

        docInstance.setFont("helvetica", "bold");
        docInstance.setFontSize(11.5);
        docInstance.text(settings.symposiumName, 105, 31, { align: 'center' });

        docInstance.setFont("helvetica", "bold");
        docInstance.setFontSize(8.5);
        docInstance.text(settings.symposiumType, 105, 35.5, { align: 'center' });

        // Event details box borders
        docInstance.setDrawColor(200, 220, 240);
        docInstance.setLineWidth(0.3);
        docInstance.rect(15, 40, 180, 13);
        docInstance.line(110, 40, 110, 53);

        // Left Column
        docInstance.setFont("helvetica", "normal");
        docInstance.setFontSize(9);
        docInstance.text("Name of the Event: ", 17, 45);
        docInstance.setFont("helvetica", "bold");
        docInstance.text(event.title, 45, 45);

        docInstance.setFont("helvetica", "normal");
        docInstance.text("Date: ", 17, 50.5);
        docInstance.setFont("helvetica", "bold");
        docInstance.text(new Date(event.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }), 27, 50.5);

        // Right Column
        docInstance.setFont("helvetica", "normal");
        docInstance.text("Timing: ", 113, 45);
        docInstance.setFont("helvetica", "bold");
        docInstance.text(`${event.startTime || 'N/A'} - ${event.endTime || 'N/A'}`, 125, 45);

        docInstance.setFont("helvetica", "normal");
        docInstance.text("Venue: ", 113, 50.5);
        docInstance.setFont("helvetica", "bold");
        docInstance.text(event.venue, 125, 50.5);

        // Title Section
        docInstance.setFont("helvetica", "bold");
        docInstance.setFontSize(13);
        docInstance.setTextColor(30, 41, 59);
        docInstance.text("Feedback Report", 105, 60.5, { align: 'center' });

        docInstance.setDrawColor(99, 102, 241);
        docInstance.setLineWidth(0.5);
        docInstance.line(75, 62.5, 135, 62.5);
    };

    // ── Sentiment Analysis (server-side) ──────────────────────────────────────
    const POSITIVE_WORDS = new Set(['excellent','amazing','great','good','awesome','fantastic','wonderful',
        'outstanding','superb','perfect','loved','enjoyed','helpful','informative','knowledgeable','well',
        'clear','interesting','engaging','inspiring','useful','valuable','satisfied','happy','impressive',
        'best','love','like','brilliant','exceptional','positive','nice','fun','productive','learned',
        'effective','efficient','organized','professional','smooth','thorough']);
    const NEGATIVE_WORDS = new Set(['bad','poor','terrible','horrible','awful','boring','worst','disappoint',
        'disappointing','disappointed','confusing','confused','unclear','slow','difficult','hard','issue',
        'problem','fail','failed','waste','useless','irrelevant','incomplete','lacking','disorganized',
        'chaotic','late','unprepared','unprofessional','rushed','unhelpful','repetitive','redundant']);

    const analyzeSentimentServer = (text) => {
        if (!text || typeof text !== 'string') return 'Neutral';
        const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
        let score = 0;
        words.forEach(w => {
            if (POSITIVE_WORDS.has(w)) score++;
            if (NEGATIVE_WORDS.has(w)) score--;
        });
        if (score > 0) return 'Positive';
        if (score < 0) return 'Negative';
        return 'Neutral';
    };

    // ── Build analytics summary ───────────────────────────────────────────────
    const summary = {};
    event.feedbackForm.forEach(field => {
        const answers = feedbacks.map(fb => {
            const val = fb.responses && typeof fb.responses.get === 'function'
                ? fb.responses.get(field.label)
                : (fb.responses ? fb.responses[field.label] : undefined);
            return val !== undefined ? val : null;
        }).filter(v => v !== null);

        if (['dropdown', 'radio', 'checkbox'].includes(field.type)) {
            const counts = {};
            answers.forEach(a => {
                if (Array.isArray(a)) a.forEach(item => { counts[item] = (counts[item] || 0) + 1; });
                else { counts[a] = (counts[a] || 0) + 1; }
            });
            summary[field.label] = { type: 'counts', data: counts };
        } else if (field.type === 'number') {
            const nums = answers.map(Number).filter(n => !isNaN(n));
            const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : null;
            summary[field.label] = { type: 'number', avg, count: nums.length };
        } else {
            const sentiments = answers.map(a => ({ text: String(a), sentiment: analyzeSentimentServer(String(a)) }));
            const sentimentCount = { Positive: 0, Neutral: 0, Negative: 0 };
            sentiments.forEach(s => sentimentCount[s.sentiment]++);
            summary[field.label] = { type: 'text', answers: sentiments, sentimentCount };
        }
    });

    // ── Overall sentiment counts ──────────────────────────────────────────────
    let totalPos = 0, totalNeg = 0, totalNeu = 0;
    Object.values(summary).forEach(info => {
        if (info.type === 'text') {
            totalPos += info.sentimentCount.Positive;
            totalNeg += info.sentimentCount.Negative;
            totalNeu += info.sentimentCount.Neutral;
        }
    });
    const totalSentiment = totalPos + totalNeg + totalNeu;

    // ── Draw Page 1: Analytics + Sentiment ───────────────────────────────────
    drawHeader(doc);

    let currentY = 70;

    // Overall sentiment box
    if (totalSentiment > 0) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(15, currentY, 180, 30, 3, 3, 'FD');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text("Overall Sentiment Analysis", 105, currentY + 8, { align: 'center' });

        // Positive
        doc.setFillColor(16, 185, 129);
        doc.roundedRect(20, currentY + 14, 50, 11, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8.5);
        doc.text(`Positive: ${totalPos} (${((totalPos/totalSentiment)*100).toFixed(1)}%)`, 45, currentY + 21, { align: 'center' });

        // Neutral
        doc.setFillColor(245, 158, 11);
        doc.roundedRect(80, currentY + 14, 50, 11, 2, 2, 'F');
        doc.text(`Neutral: ${totalNeu} (${((totalNeu/totalSentiment)*100).toFixed(1)}%)`, 105, currentY + 21, { align: 'center' });

        // Negative
        doc.setFillColor(239, 68, 68);
        doc.roundedRect(140, currentY + 14, 50, 11, 2, 2, 'F');
        doc.text(`Negative: ${totalNeg} (${((totalNeg/totalSentiment)*100).toFixed(1)}%)`, 165, currentY + 21, { align: 'center' });

        currentY += 38;
    }

    // Question-wise analytics
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Question-wise Analytics", 20, currentY);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(20, currentY + 2, 190, currentY + 2);
    currentY += 10;

    for (const [label, info] of Object.entries(summary)) {
        if (currentY > 240) {
            doc.addPage();
            drawHeader(doc);
            currentY = 70;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(55, 65, 81);
        doc.text(`Q: ${label}`, 20, currentY);
        currentY += 6;

        if (info.type === 'counts') {
            const total = feedbacks.length;
            const entries = Object.entries(info.data);
            entries.forEach(([opt, count]) => {
                if (currentY > 270) {
                    doc.addPage(); drawHeader(doc); currentY = 70;
                }
                const pct = ((count / total) * 100).toFixed(1);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(75, 85, 99);
                doc.text(`${opt}`, 25, currentY);

                // Bar background
                doc.setFillColor(241, 245, 249);
                doc.rect(80, currentY - 3, 90, 4, 'F');
                // Bar fill
                doc.setFillColor(99, 102, 241);
                const barW = Math.max((count / total) * 90, 1);
                doc.rect(80, currentY - 3, barW, 4, 'F');

                doc.setFont("helvetica", "bold");
                doc.setTextColor(30, 41, 59);
                doc.text(`${count} (${pct}%)`, 175, currentY, { align: 'right' });
                currentY += 7;
            });
        } else if (info.type === 'number') {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(75, 85, 99);
            doc.text(`Average Rating: ${info.avg}   |   Responses: ${info.count}`, 25, currentY);
            currentY += 8;
        } else if (info.type === 'text') {
            const sc = info.sentimentCount;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(16, 185, 129);
            doc.text(`Positive: ${sc.Positive}`, 25, currentY);
            doc.setTextColor(245, 158, 11);
            doc.text(`Neutral: ${sc.Neutral}`, 75, currentY);
            doc.setTextColor(239, 68, 68);
            doc.text(`Negative: ${sc.Negative}`, 125, currentY);
            currentY += 6;

            info.answers.slice(0, 3).forEach(({ text, sentiment }) => {
                if (currentY > 268) { doc.addPage(); drawHeader(doc); currentY = 70; }
                const sentColor = sentiment === 'Positive' ? [16, 185, 129] : sentiment === 'Negative' ? [239, 68, 68] : [245, 158, 11];
                doc.setFont("helvetica", "italic");
                doc.setFontSize(7.5);
                doc.setTextColor(107, 114, 128);
                const truncated = text.length > 85 ? text.substring(0, 85) + '...' : text;
                doc.text(`"${truncated}"`, 27, currentY);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(7);
                doc.setTextColor(...sentColor);
                doc.text(`[${sentiment}]`, 178, currentY, { align: 'right' });
                currentY += 5.5;
            });

            if (info.answers.length > 3) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7.5);
                doc.setTextColor(156, 163, 175);
                doc.text(`... ${info.answers.length - 3} more responses in the detailed table`, 27, currentY);
                currentY += 5;
            }
        }

        // Divider
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(20, currentY + 1, 190, currentY + 1);
        currentY += 7;
    }

    // ── Page 2+: Detailed Responses Table ────────────────────────────────────
    doc.addPage();
    drawHeader(doc);

    const tableColumn = ['#', 'Participant', 'Reg Number', 'Sentiment'];
    event.feedbackForm.forEach(f => tableColumn.push(f.label));

    const tableRows = [];
    feedbacks.forEach((fb, idx) => {
        const allText = event.feedbackForm
            .filter(f => !['dropdown', 'radio', 'checkbox', 'number'].includes(f.type))
            .map(f => {
                const val = fb.responses && typeof fb.responses.get === 'function'
                    ? fb.responses.get(f.label)
                    : (fb.responses ? fb.responses[f.label] : '');
                return String(val || '');
            }).join(' ');
        const sentiment = analyzeSentimentServer(allText);

        const rowData = [
            String(idx + 1),
            fb.user.username,
            fb.user.registrationNumber || 'N/A',
            sentiment,
        ];
        event.feedbackForm.forEach(f => {
            const val = fb.responses && typeof fb.responses.get === 'function'
                ? fb.responses.get(f.label)
                : (fb.responses ? fb.responses[f.label] : undefined);
            rowData.push(Array.isArray(val) ? val.join(', ') : (val || ''));
        });
        tableRows.push(rowData);
    });

    autoTable(doc, {
        startY: 68,
        margin: { top: 68 },
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 7.5, cellPadding: 3, verticalAlign: 'middle', overflow: 'linebreak' },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 28 },
            2: { cellWidth: 22 },
            3: { cellWidth: 22, halign: 'center' },
        },
        didDrawPage: (data) => {
            drawHeader(doc);
        },
        didParseCell: (data) => {
            if (data.column.index === 3 && data.section === 'body') {
                const val = data.cell.raw;
                if (val === 'Positive') data.cell.styles.textColor = [16, 185, 129];
                else if (val === 'Negative') data.cell.styles.textColor = [239, 68, 68];
                else data.cell.styles.textColor = [245, 158, 11];
            }
        }
    });

    // Signatures footer on the last page
    let finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 70) + 25;
    if (finalY > 250) {
        doc.addPage();
        drawHeader(doc);
        finalY = 85;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    const assocSignObj = getLogoBase64(settings.associationCoordinatorSign);
    const hodSignObj = getLogoBase64(settings.hodSign);

    if (assocSignObj) {
        try {
            doc.addImage(assocSignObj.data, assocSignObj.format, 35, finalY - 12, 30, 15);
        } catch (e) {
            console.error("Error adding assoc sign:", e);
        }
    }
    doc.text("__________________________", 50, finalY, { align: 'center' });
    doc.text("Association Coordinator", 50, finalY + 7, { align: 'center' });

    if (hodSignObj) {
        try {
            doc.addImage(hodSignObj.data, hodSignObj.format, 145, finalY - 12, 30, 15);
        } catch (e) {
            console.error("Error adding hod sign:", e);
        }
    }
    doc.text("__________________________", 160, finalY, { align: 'center' });
    doc.text("Head of Department", 160, finalY + 7, { align: 'center' });

    return Buffer.from(doc.output('arraybuffer'));
};

module.exports = { generateExcelReport, generatePDFReport, generateFeedbackPDFReport };
