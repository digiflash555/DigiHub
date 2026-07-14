const Nomination = require('../models/Nomination');
const NominationForm = require('../models/NominationForm');
const User = require('../models/User');

// @desc    Create a new nomination form
// @route   POST /api/nominations/forms
// @access  Private/Admin
exports.createNominationForm = async (req, res, next) => {
    try {
        const formData = { ...req.body };
        if (formData.startDate === '') formData.startDate = null;
        if (formData.endDate === '') formData.endDate = null;

        const form = await NominationForm.create({
            ...formData,
            createdBy: req.user._id
        });
        res.status(201).json(form);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all active nomination forms
// @route   GET /api/nominations/forms
// @access  Private
exports.getNominationForms = async (req, res, next) => {
    try {
        const now = new Date();
        let query = {};

        if (req.user.role !== 'Admin') {
            query = {
                isActive: true,
                $and: [
                    // Must have started (or no start date set)
                    {
                        $or: [
                            { startDate: { $exists: false } },
                            { startDate: null },
                            { startDate: { $lte: now } }
                        ]
                    },
                    // Must not have ended (or no end date set)
                    {
                        $or: [
                            { endDate: { $exists: false } },
                            { endDate: null },
                            { endDate: { $gte: now } }
                        ]
                    }
                ]
            };
        }

        const forms = await NominationForm.find(query).sort({ createdAt: -1 });
        res.json(forms);
    } catch (error) {
        next(error);
    }
};


// @desc    Update nomination form
// @route   PUT /api/nominations/forms/:id
// @access  Private/Admin
exports.updateNominationForm = async (req, res, next) => {
    try {
        const updateData = { ...req.body };
        if (updateData.startDate === '') updateData.startDate = null;
        if (updateData.endDate === '') updateData.endDate = null;

        // Use $set explicitly to handle subdocument _id fields gracefully
        // runValidators:false prevents Mongoose from rejecting existing _id fields on subdoc arrays
        const form = await NominationForm.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: false }
        );
        if (!form) {
            res.status(404);
            throw new Error('Form not found');
        }
        res.json(form);
    } catch (error) {
        next(error);
    }
};


// @desc    Delete nomination form
// @route   DELETE /api/nominations/forms/:id
// @access  Private/Admin
exports.deleteNominationForm = async (req, res, next) => {
    try {
        const form = await NominationForm.findByIdAndDelete(req.params.id);
        if (!form) {
            res.status(404);
            throw new Error('Form not found');
        }
        res.json({ message: 'Form deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Submit a nomination
// @route   POST /api/nominations
// @access  Private
exports.submitNomination = async (req, res, next) => {
    try {
        const { form: formId } = req.body;

        // Check if form exists and is active
        const form = await NominationForm.findById(formId);
        if (!form || !form.isActive) {
            res.status(404);
            throw new Error('Nomination form not found or inactive');
        }

        // Check user profiles for mandatory fields like gender, section etc. if needed
        // but here we just create from body

        const {
            postAppliedFor, personalInfo, academicProficiency,
            previousPositions, contributions, customFields, candidatePhoto
        } = req.body;

        const nomination = await Nomination.create({
            user: req.user._id,
            form: formId,
            postAppliedFor,
            personalInfo,
            academicProficiency,
            previousPositions,
            contributions,
            customFields,
            candidatePhoto,
            status: 'Pending Admin'
        });
        res.status(201).json(nomination);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all nominations (Admin access)
// @route   GET /api/nominations
// @access  Private (Admin or own)
exports.getNominations = async (req, res, next) => {
    try {
        let query = {};

        // If not admin, only see own nominations
        if (req.user.role !== 'Admin') {
            query.user = req.user._id;
        }

        const nominations = await Nomination.find(query)
            .populate('user', 'username email yearAndDept section')
            .sort({ createdAt: -1 });

        res.json(nominations);
    } catch (error) {
        next(error);
    }
};

// @desc    Update nomination status / Approve / Reject
// @route   PUT /api/nominations/:id/approve
// @access  Private (Admin only)
exports.approveNomination = async (req, res, next) => {
    try {
        const { status, remarks } = req.body;
        const nomination = await Nomination.findById(req.params.id);

        if (!nomination) {
            res.status(404);
            throw new Error('Nomination not found');
        }

        if (req.user.role !== 'Admin') {
            res.status(403);
            throw new Error('Not authorized to approve nominations');
        }

        nomination.status = status; // 'Approved' or 'Rejected'
        nomination.approvalHistory.push({
            stage: 'Admin Review',
            approvedBy: req.user._id,
            status: status,
            remarks: remarks
        });

        await nomination.save();

        const updatedNomination = await Nomination.findById(nomination._id)
            .populate('user', 'username email yearAndDept section')
            .populate('approvalHistory.approvedBy', 'username role')
            .populate('form', 'title');

        // Email notification removed

        res.json(updatedNomination);
    } catch (error) {
        next(error);
    }
};

// @desc    Get nomination by ID
// @route   GET /api/nominations/:id
// @access  Private
exports.getNominationById = async (req, res, next) => {
    try {
        const nomination = await Nomination.findById(req.params.id)
            .populate('user', 'username email registrationNumber yearAndDept section gender dateOfBirth')
            .populate('approvalHistory.approvedBy', 'username role');

        if (!nomination) {
            res.status(404);
            throw new Error('Nomination not found');
        }

        // Check ownership
        if (nomination.user._id.toString() !== req.user._id.toString() &&
            !['Admin', 'Class Coordinator', 'Program Coordinator'].includes(req.user.role)) {
            res.status(403);
            throw new Error('Not authorized to view this nomination');
        }

        res.json(nomination);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a nomination
// @route   PUT /api/nominations/:id
// @access  Private/Admin
exports.updateNomination = async (req, res, next) => {
    try {
        const nomination = await Nomination.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: false }
        )
            .populate('user', 'username email yearAndDept section')
            .populate('approvalHistory.approvedBy', 'username role')
            .populate('form', 'title');

        if (!nomination) {
            res.status(404);
            throw new Error('Nomination not found');
        }
        res.json(nomination);
    } catch (error) {
        next(error);
    }
};


// @desc    Delete a nomination
// @route   DELETE /api/nominations/:id
// @access  Private/Admin
exports.deleteNomination = async (req, res, next) => {
    try {
        const nomination = await Nomination.findByIdAndDelete(req.params.id);
        if (!nomination) {
            res.status(404);
            throw new Error('Nomination not found');
        }
        res.json({ message: 'Nomination deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.exportNominationXLSX = async (req, res, next) => {
    try {
        const nomination = await Nomination.findById(req.params.id)
            .populate('user', 'username email yearAndDept section gender dateOfBirth registrationNumber')
            .populate('form', 'title description fields')
            .populate('approvalHistory.approvedBy', 'username role designation');

        if (!nomination) {
            res.status(404);
            throw new Error('Nomination not found');
        }

        const XLSX = require('xlsx');
        // Build header and row for this nomination
        const headers = [
            'Applicant Name', 'Roll Number', 'Email', 'Year & Dept', 'Section', 'Gender',
            'Post Applied For', 'Name (Form)', 'Roll No (Form)', 'Gender (Form)', 'Date of Birth', 'Year (Form)', 'Section (Form)',
            '10th %', 'Diploma/XII %', 'CGPA', 'No. of Arrears',
            'Previous Positions', 'Contributions (Academic)', 'Contributions (Co-Curricular)', 
            'Contributions (Extracurricular)', 'Contributions (Notable)'
        ];
        // collect custom field keys for this nomination only
        const isMap = nomination.customFields instanceof Map;
        const customFieldKeys = [];
        if (isMap) {
            for (const key of nomination.customFields.keys()) customFieldKeys.push(key);
        } else if (nomination.customFields) {
            customFieldKeys.push(...Object.keys(nomination.customFields));
        }
        // Append custom keys to headers
        headers.push(...customFieldKeys);
        // Build row values
        const row = [
            nomination.user?.username || 'N/A',
            nomination.user?.registrationNumber || 'N/A',
            nomination.user?.email || 'N/A',
            nomination.user?.yearAndDept || 'N/A',
            nomination.user?.section || 'N/A',
            nomination.user?.gender || 'N/A',
            nomination.postAppliedFor || 'N/A',
            nomination.personalInfo?.name || 'N/A',
            nomination.personalInfo?.rollNumber || 'N/A',
            nomination.personalInfo?.gender || 'N/A',
            nomination.personalInfo?.dateOfBirth || 'N/A',
            nomination.personalInfo?.year || 'N/A',
            nomination.personalInfo?.section || 'N/A',
            nomination.academicProficiency?.tenthPercentage || 'N/A',
            nomination.academicProficiency?.diplomaPercentage || 'N/A',
            nomination.academicProficiency?.cgpa || 'N/A',
            nomination.academicProficiency?.noOfArrears || '0',
            nomination.previousPositions?.map(p => `${p.nameOfBody} (${p.position}, ${p.period})`).join('; ') || 'N/A',
            nomination.contributions?.academic || 'N/A',
            nomination.contributions?.coCurricular || 'N/A',
            nomination.contributions?.extracurricular || 'N/A',
            nomination.contributions?.otherNotable || 'N/A'
        ];
        // Add custom field values in same order as headers
        customFieldKeys.forEach(key => {
            const value = isMap ? (nomination.customFields.get(key) || '') : (nomination.customFields?.[key] || '');
            row.push(value);
        });
        const wsData = [headers, row];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        // Simple column width styling
        const colWidths = headers.map(h => ({ wch: Math.min(h.length + 2, 40) }));
        ws['!cols'] = colWidths;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Nomination');
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        const filename = `Nomination_${nomination.user?.username || 'candidate'}_${nomination.postAppliedFor || 'nomination'}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};
// @route   GET /api/nominations/:id/pdf
// @access  Private
exports.exportNominationPDF = async (req, res, next) => {
    try {
        const nomination = await Nomination.findById(req.params.id)
            .populate('user', 'username email yearAndDept section gender dateOfBirth registrationNumber')
            .populate('form', 'title description fields')
            .populate('approvalHistory.approvedBy', 'username role designation');

        if (!nomination) {
            res.status(404);
            throw new Error('Nomination not found');
        }

        // Load settings to respect disabled/renamed fields
        const Settings = require('../models/Settings');
        const settings = await Settings.getSettings();
        const disabledFields = settings.disabledDefaultFields || [];
        const customLabels = settings.customDefaultLabels || {};
        const label = (key, fallback) => customLabels[key] || fallback;
        const isEnabled = (key) => !disabledFields.includes(key);

        const PDFDocument = require('pdfkit');
        const path = require('path');
        const fs = require('fs');
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Nomination_${nomination.user.username}_${nomination.postAppliedFor}.pdf`);
        doc.pipe(res);

        // --- Header Section ---
        const pageMargin = 50;
        const photoSize = 90;
        const photoX = doc.page.width - pageMargin - photoSize;
        const photoY = pageMargin;

        // Draw candidate photo in top-right corner if it exists
        let photoDrawn = false;
        if (nomination.candidatePhoto) {
            const photoPath = path.join(__dirname, '../../uploads', nomination.candidatePhoto);
            console.log('PDF Export - Photo Path:', photoPath);
            console.log('PDF Export - File exists?', fs.existsSync(photoPath));
            if (fs.existsSync(photoPath)) {
                try {
                    // Draw a border box around the photo
                    doc.rect(photoX - 2, photoY - 2, photoSize + 4, photoSize + 4)
                       .fillAndStroke('#f1f5f9', '#cbd5e1');
                    // Use fit instead of cover to ensure it renders correctly
                    doc.image(photoPath, photoX, photoY, { fit: [photoSize, photoSize], align: 'center', valign: 'center' });
                    photoDrawn = true;
                    console.log('PDF Export - Photo drawn successfully.');
                } catch (imgErr) {
                    console.error('PDF Export - Error drawing image:', imgErr);
                }
            }
        }

        // Reset cursor to top-left and write title (constrained to avoid photo)
        const titleWidth = photoDrawn ? doc.page.width - pageMargin * 2 - photoSize - 20 : doc.page.width - pageMargin * 2;
        doc.y = pageMargin;
        doc.x = pageMargin;

        doc.fontSize(24).font('Helvetica-Bold').fillColor('#333333')
           .text('NOMINATION FORM', { width: titleWidth });
        doc.moveDown(0.4);
        doc.fontSize(16).font('Helvetica').fillColor('#666666')
           .text(nomination.postAppliedFor, { width: titleWidth });
        doc.moveDown(0.4);
        doc.fontSize(11).font('Helvetica').fillColor('#888888')
           .text(`Candidate: ${nomination.personalInfo?.name || nomination.user.username}`, { width: titleWidth });

        // Move below the photo if it was drawn (ensure content starts after photo)
        if (photoDrawn) {
            const afterPhoto = photoY + photoSize + 20;
            if (doc.y < afterPhoto) doc.y = afterPhoto;
        } else {
            doc.moveDown(1);
        }

        // Horizontal rule
        doc.moveTo(pageMargin, doc.y).lineTo(doc.page.width - pageMargin, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.moveDown(1.5);

        // Section: Personal Information
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('1. Personal Information');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        if (isEnabled('name')) doc.text(`${label('name', 'Name')}: ${nomination.personalInfo?.name || nomination.user.username}`);
        if (isEnabled('rollNumber')) doc.text(`${label('rollNumber', 'Roll Number')}: ${nomination.personalInfo?.rollNumber || nomination.user.registrationNumber || 'N/A'}`);
        if (isEnabled('gender')) doc.text(`${label('gender', 'Gender')}: ${nomination.personalInfo?.gender || nomination.user.gender || 'N/A'}`);
        if (isEnabled('dateOfBirth')) doc.text(`${label('dateOfBirth', 'Date of Birth')}: ${nomination.personalInfo?.dateOfBirth || (nomination.user.dateOfBirth ? new Date(nomination.user.dateOfBirth).toLocaleDateString() : 'N/A')}`);
        if (isEnabled('year')) doc.text(`${label('year', 'Year')}: ${nomination.personalInfo?.year || nomination.user.yearAndDept}`);
        if (isEnabled('section')) doc.text(`${label('section', 'Section')}: ${nomination.personalInfo?.section || nomination.user.section}`);
        doc.text(`Email: ${nomination.user.email}`);
        doc.moveDown(1.5);

        // Section: Academic Performance
        const hasAcademic = ['tenthPercentage', 'diplomaPercentage', 'cgpa', 'noOfArrears'].some(k => isEnabled(k));
        if (hasAcademic) {
            doc.fontSize(14).font('Helvetica-Bold').text('2. Academic Performance');
            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica');
            if (isEnabled('tenthPercentage')) doc.text(`${label('tenthPercentage', '10th %')}: ${nomination.academicProficiency?.tenthPercentage || 'N/A'}`);
            if (isEnabled('diplomaPercentage')) doc.text(`${label('diplomaPercentage', 'Diploma/XII %')}: ${nomination.academicProficiency?.diplomaPercentage || 'N/A'}`);
            if (isEnabled('cgpa')) doc.text(`${label('cgpa', 'CGPA')}: ${nomination.academicProficiency?.cgpa || 'N/A'}`);
            if (isEnabled('noOfArrears')) doc.text(`${label('noOfArrears', 'No. of Arrears')}: ${nomination.academicProficiency?.noOfArrears || '0'}`);
            doc.moveDown(1.5);
        }

        // Section: Previous Positions
        doc.fontSize(14).font('Helvetica-Bold').text('3. Previous Positions Held');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        if (nomination.previousPositions && nomination.previousPositions.length > 0) {
            nomination.previousPositions.forEach((pos, i) => {
                doc.text(`${i + 1}. ${pos.nameOfBody} - ${pos.position} (${pos.period})`);
            });
        } else {
            doc.text('No previous positions declared.');
        }
        doc.moveDown(1.5);

        // Section: Contributions
        doc.fontSize(14).font('Helvetica-Bold').text('4. Contributions & Achievements');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        doc.text(`Academic:`, { continued: true }).text(` ${nomination.contributions?.academic || 'N/A'}`, { font: 'Helvetica' });
        doc.text(`Co-Curricular:`, { continued: true }).text(` ${nomination.contributions?.coCurricular || 'N/A'}`, { font: 'Helvetica' });
        doc.text(`Extracurricular:`, { continued: true }).text(` ${nomination.contributions?.extracurricular || 'N/A'}`, { font: 'Helvetica' });
        doc.text(`Other Notable:`, { continued: true }).text(` ${nomination.contributions?.otherNotable || 'N/A'}`, { font: 'Helvetica' });
        doc.moveDown(1.5);

        // Section: Custom Fields
        const isMap = nomination.customFields instanceof Map;
        const hasCustomFields = isMap ? nomination.customFields.size > 0 : Object.keys(nomination.customFields || {}).length > 0;

        if (hasCustomFields) {
            doc.fontSize(14).font('Helvetica-Bold').text('5. Additional Information');
            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica');
            const entries = isMap ? nomination.customFields.entries() : Object.entries(nomination.customFields || {});
            for (const [key, value] of entries) {
                doc.font('Helvetica-Bold').text(`${key}: `);
                doc.font('Helvetica').text(`${value}`);
                doc.moveDown(0.5);
            }
            doc.moveDown(1);
        }

        // Section: Approval Status
        doc.fontSize(14).font('Helvetica-Bold').text('Approval Status');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica');
        doc.text(`Current Status: ${nomination.status}`);

        if (nomination.approvalHistory && nomination.approvalHistory.length > 0) {
            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').text('Approval History:');
            doc.font('Helvetica');
            nomination.approvalHistory.forEach(h => {
                doc.moveDown(0.5);
                doc.text(`Stage: ${h.stage}`);
                doc.text(`Action: ${h.status}`);
                doc.text(`By: ${h.approvedBy?.username || 'System'} (${h.approvedBy?.role || 'N/A'})`);
                doc.text(`Remarks: ${h.remarks || 'None'}`);
                doc.text(`Date: ${new Date(h.updatedAt).toLocaleString()}`);
            });
        }

        doc.end();

    } catch (error) {
        next(error);
    }
};


// @desc    Export ALL nominations as PDF
// @route   GET /api/nominations/export/pdf
// @access  Private/Admin
exports.exportAllNominationsPDF = async (req, res, next) => {
    try {
        const nominations = await Nomination.find({})
            .populate('user', 'username email registrationNumber yearAndDept section')
            .populate('form', 'title fields')
            .sort({ createdAt: -1 });

        if (nominations.length === 0) {
            res.status(404);
            throw new Error('No nominations found');
        }

        // Load settings to respect disabled/renamed fields
        const Settings = require('../models/Settings');
        const settings = await Settings.getSettings();
        const disabledFields = settings.disabledDefaultFields || [];
        const customLabels = settings.customDefaultLabels || {};
        const label = (key, fallback) => customLabels[key] || fallback;
        const isEnabled = (key) => !disabledFields.includes(key);

        const PDFDocument = require('pdfkit');
        const path = require('path');
        const fs = require('fs');
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=All_Nominations.pdf');
        doc.pipe(res);

        // Cover Title
        doc.fontSize(26).font('Helvetica-Bold').fillColor('#1e1b4b')
            .text('NOMINATION SUBMISSIONS REPORT', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica').fillColor('#6b7280')
            .text(`Total: ${nominations.length} candidates  |  Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#4f46e5').lineWidth(2).stroke();
        doc.moveDown(1.5);

        nominations.forEach((nom, idx) => {
            // Check if we need a new page (leave some margin)
            if (idx > 0) {
                doc.addPage();
            }

            // --- Candidate Photo ---
            const photoSize = 70;
            const photoX = doc.page.width - 50 - photoSize;
            const photoY = doc.y;
            let photoDrawn = false;

            if (nom.candidatePhoto) {
                const photoPath = path.join(__dirname, '../../uploads', nom.candidatePhoto);
                if (fs.existsSync(photoPath)) {
                    try {
                        doc.rect(photoX - 2, photoY - 2, photoSize + 4, photoSize + 4).fillAndStroke('#f1f5f9', '#cbd5e1');
                        doc.image(photoPath, photoX, photoY, { fit: [photoSize, photoSize], align: 'center', valign: 'center' });
                        photoDrawn = true;
                    } catch (e) {
                        console.error('Bulk PDF - Error drawing photo', e);
                    }
                }
            }

            // Candidate header
            const titleWidth = photoDrawn ? doc.page.width - 100 - photoSize - 20 : doc.page.width - 100;
            doc.fontSize(15).font('Helvetica-Bold').fillColor('#1e1b4b')
                .text(`${idx + 1}. ${nom.user?.username || 'Unknown'}`, { width: titleWidth });
            doc.fontSize(11).font('Helvetica').fillColor('#6b7280')
                .text(`   (${nom.postAppliedFor || 'N/A'})`, { width: titleWidth });
            doc.moveDown(0.3);
            
            if (photoDrawn) {
                const afterPhoto = photoY + photoSize + 15;
                if (doc.y < afterPhoto) doc.y = afterPhoto;
            }

            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
            doc.moveDown(0.5);

            const col = (labelStr, value) => {
                doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text(`${labelStr}: `, { continued: true });
                doc.font('Helvetica').fillColor('#1f2937').text(`${value || 'N/A'}`);
            };

            // Personal Info
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#4f46e5').text('Personal Information');
            doc.moveDown(0.2);
            if (isEnabled('name')) col(label('name', 'Name'), nom.personalInfo?.name || nom.user?.username);
            if (isEnabled('rollNumber')) col(label('rollNumber', 'Roll Number'), nom.personalInfo?.rollNumber || nom.user?.registrationNumber);
            if (isEnabled('gender')) col(label('gender', 'Gender'), nom.personalInfo?.gender || nom.user?.gender);
            if (isEnabled('dateOfBirth')) col(label('dateOfBirth', 'Date of Birth'), nom.personalInfo?.dateOfBirth || (nom.user?.dateOfBirth ? new Date(nom.user.dateOfBirth).toLocaleDateString() : 'N/A'));
            col('Email', nom.user?.email);
            if (isEnabled('year')) col(label('year', 'Year & Dept'), nom.personalInfo?.year || nom.user?.yearAndDept);
            if (isEnabled('section')) col(label('section', 'Section'), nom.personalInfo?.section || nom.user?.section);
            doc.moveDown(0.7);

            // Academic
            const hasAcademic = ['tenthPercentage', 'diplomaPercentage', 'cgpa', 'noOfArrears'].some(k => isEnabled(k));
            if (hasAcademic) {
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#4f46e5').text('Academic Performance');
                doc.moveDown(0.2);
                if (isEnabled('tenthPercentage')) col(label('tenthPercentage', '10th %'), nom.academicProficiency?.tenthPercentage);
                if (isEnabled('diplomaPercentage')) col(label('diplomaPercentage', 'Diploma/XII %'), nom.academicProficiency?.diplomaPercentage);
                if (isEnabled('cgpa')) col(label('cgpa', 'CGPA'), nom.academicProficiency?.cgpa);
                if (isEnabled('noOfArrears')) col(label('noOfArrears', 'No. of Arrears'), nom.academicProficiency?.noOfArrears || '0');
                doc.moveDown(0.7);
            }

            // Previous Positions
            if (nom.previousPositions && nom.previousPositions.length > 0) {
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#4f46e5').text('Previous Positions Held');
                doc.moveDown(0.2);
                nom.previousPositions.forEach((pos, i) => {
                    doc.fontSize(10).font('Helvetica').fillColor('#374151')
                        .text(`${i + 1}. ${pos.nameOfBody} — ${pos.position} (${pos.period})`);
                });
                doc.moveDown(0.7);
            }

            // Contributions
            if (nom.contributions && (nom.contributions.academic || nom.contributions.coCurricular || nom.contributions.extracurricular || nom.contributions.otherNotable)) {
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#4f46e5').text('Contributions & Achievements');
                doc.moveDown(0.2);
                if (nom.contributions.academic) col('Academic', nom.contributions.academic);
                if (nom.contributions.coCurricular) col('Co-Curricular', nom.contributions.coCurricular);
                if (nom.contributions.extracurricular) col('Extracurricular', nom.contributions.extracurricular);
                if (nom.contributions.otherNotable) col('Notable', nom.contributions.otherNotable);
                doc.moveDown(0.7);
            }

            // Custom Fields
            const isMap = nom.customFields instanceof Map;
            const entries = isMap ? [...nom.customFields.entries()] : Object.entries(nom.customFields || {});
            if (entries.length > 0) {
                doc.fontSize(11).font('Helvetica-Bold').fillColor('#4f46e5').text('Additional Fields');
                doc.moveDown(0.2);
                entries.forEach(([key, value]) => col(key, value));
                doc.moveDown(0.7);
            }

            // Status
            const statusColor = nom.status === 'Approved' ? '#16a34a' : nom.status === 'Rejected' ? '#dc2626' : '#d97706';
            doc.fontSize(10).font('Helvetica-Bold').fillColor(statusColor)
                .text(`Status: ${nom.status}`);
            doc.moveDown(0.2);
            doc.font('Helvetica').fillColor('#6b7280').fontSize(9)
                .text(`Applied on: ${new Date(nom.createdAt).toLocaleString()}`);
        });

        doc.end();
    } catch (error) {
        next(error);
    }
};

// @desc    Export ALL nominations as XLSX
// @route   GET /api/nominations/export/xlsx
// @access  Private/Admin
exports.exportAllNominationsXLSX = async (req, res, next) => {
    try {
        const nominations = await Nomination.find({})
            .populate('user', 'username email registrationNumber yearAndDept section')
            .populate('form', 'title fields')
            .sort({ createdAt: -1 });

        if (nominations.length === 0) {
            res.status(404);
            throw new Error('No nominations found');
        }

        // Load settings to respect disabled/renamed fields
        const Settings = require('../models/Settings');
        const settings = await Settings.getSettings();
        const disabledFields = settings.disabledDefaultFields || [];
        const customLabels = settings.customDefaultLabels || {};
        const label = (key, fallback) => customLabels[key] || fallback;
        const isEnabled = (key) => !disabledFields.includes(key);

        const XLSX = require('xlsx');

        // Collect all unique custom field keys
        const customFieldKeys = new Set();
        nominations.forEach(nom => {
            const isMap = nom.customFields instanceof Map;
            const entries = isMap ? nom.customFields.keys() : Object.keys(nom.customFields || {});
            for (const key of entries) customFieldKeys.add(key);
        });
        const customKeys = [...customFieldKeys];

        // Build dynamic headers (respecting disabled fields)
        const defaultHeaders = [
            { key: 'sno', header: 'S.No', always: true },
            { key: 'appName', header: 'Applicant Name', always: true },
            { key: 'email', header: 'Email', always: true },
            { key: 'yearAndDept', header: 'Year & Dept', always: true },
            { key: 'sectionUser', header: 'Section', always: true },
            { key: 'postAppliedFor', header: 'Post Applied For', always: true },
            { key: 'name', header: label('name', 'Name (Form)') },
            { key: 'rollNumber', header: label('rollNumber', 'Roll No (Form)') },
            { key: 'gender', header: label('gender', 'Gender (Form)') },
            { key: 'dateOfBirth', header: label('dateOfBirth', 'Date of Birth') },
            { key: 'year', header: label('year', 'Year (Form)') },
            { key: 'section', header: label('section', 'Section (Form)') },
            { key: 'tenthPercentage', header: label('tenthPercentage', '10th %') },
            { key: 'diplomaPercentage', header: label('diplomaPercentage', 'Diploma/XII %') },
            { key: 'cgpa', header: label('cgpa', 'CGPA') },
            { key: 'noOfArrears', header: label('noOfArrears', 'No. of Arrears') },
            { key: 'previousPositions', header: 'Previous Positions', always: true },
            { key: 'contribAcademic', header: 'Contributions (Academic)', always: true },
            { key: 'contribCoCurr', header: 'Contributions (Co-Curricular)', always: true },
            { key: 'contribExtra', header: 'Contributions (Extracurricular)', always: true },
            { key: 'contribNotable', header: 'Contributions (Notable)', always: true },
        ];

        const activeHeaders = defaultHeaders.filter(h => h.always || isEnabled(h.key));
        const headers = [...activeHeaders.map(h => h.header), ...customKeys, 'Status', 'Applied On'];

        const rows = nominations.map((nom, idx) => {
            const isMap = nom.customFields instanceof Map;
            const customValues = customKeys.map(key =>
                isMap ? (nom.customFields.get(key) || '') : (nom.customFields?.[key] || '')
            );

            const fieldMap = {
                sno: idx + 1,
                appName: nom.user?.username || 'N/A',
                email: nom.user?.email || 'N/A',
                yearAndDept: nom.user?.yearAndDept || 'N/A',
                sectionUser: nom.user?.section || 'N/A',
                postAppliedFor: nom.postAppliedFor || 'N/A',
                name: nom.personalInfo?.name || 'N/A',
                rollNumber: nom.personalInfo?.rollNumber || 'N/A',
                gender: nom.personalInfo?.gender || 'N/A',
                dateOfBirth: nom.personalInfo?.dateOfBirth || 'N/A',
                year: nom.personalInfo?.year || 'N/A',
                section: nom.personalInfo?.section || 'N/A',
                tenthPercentage: nom.academicProficiency?.tenthPercentage || 'N/A',
                diplomaPercentage: nom.academicProficiency?.diplomaPercentage || 'N/A',
                cgpa: nom.academicProficiency?.cgpa || 'N/A',
                noOfArrears: nom.academicProficiency?.noOfArrears || '0',
                previousPositions: nom.previousPositions?.map(p => `${p.nameOfBody} (${p.position}, ${p.period})`).join('; ') || 'N/A',
                contribAcademic: nom.contributions?.academic || 'N/A',
                contribCoCurr: nom.contributions?.coCurricular || 'N/A',
                contribExtra: nom.contributions?.extracurricular || 'N/A',
                contribNotable: nom.contributions?.otherNotable || 'N/A',
            };

            return [...activeHeaders.map(h => fieldMap[h.key]), ...customValues, nom.status || 'N/A', new Date(nom.createdAt).toLocaleString()];
        });

        const wsData = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Style header row
        const colWidths = headers.map((h, i) => {
            const maxLen = Math.max(h.length, ...rows.map(r => String(r[i] || '').length));
            return { wch: Math.min(maxLen + 2, 40) };
        });
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Nominations');

        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=All_Nominations.xlsx');
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

