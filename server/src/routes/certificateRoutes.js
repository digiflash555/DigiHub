const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { createCloudinaryUpload } = require('../utils/cloudinaryUpload');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const VolunteerApplication = require('../models/VolunteerApplication');
const generateCertificate = require('../utils/certificateGenerator');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Certificate template upload — stored in Cloudinary under event_management/certificates
// Templates are full-landscape images, allowing up to 10 MB
const upload = createCloudinaryUpload('certificates', ['jpeg', 'jpg', 'png', 'webp'], 10, 'cert-template-');

// @desc    Upload certificate template and update config
// @route   POST /api/certificates/config/:eventId
// @access  Private/Admin
router.post('/config/:eventId', protect, authorize('Admin'), upload.single('template'), async (req, res, next) => {
    try {
        console.log('[Certificate Config] POST', req.params.eventId);

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid Event ID format.' });
        }

        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found for the given ID.' });
        }

        // Parse config safely
        let config;
        try {
            config = JSON.parse(req.body.config);
        } catch (parseErr) {
            console.error('[Certificate Config] JSON parse error:', parseErr.message);
            return res.status(400).json({
                success: false,
                message: 'Certificate configuration could not be saved.',
                error: 'Invalid JSON in config field: ' + parseErr.message
            });
        }

        if (!config || typeof config !== 'object') {
            return res.status(400).json({ success: false, message: 'Configuration object is missing or malformed.' });
        }

        if (req.file) {
            config.template = req.file.path;
        } else {
            // Keep existing template if not uploading new one
            config.template = config.template || event.certificateConfig?.template;
        }

        // Sanitize fields to ensure only known keys are stored
        if (config.fields && Array.isArray(config.fields)) {
            config.fields = config.fields.map(f => ({
                type: f.type,
                text: f.text || '',
                x: Number(f.x) || 0,
                y: Number(f.y) || 0,
                fontSize: Number(f.fontSize) || 20,
                color: f.color || '#000000',
                fontStyle: f.fontStyle || 'normal',
                fontFamily: f.fontFamily || 'Helvetica',
                alignment: f.alignment || 'left',
                width: Number(f.width) || 600,
                variableColors: f.variableColors && typeof f.variableColors === 'object' ? f.variableColors : {},
                variableFontStyles: f.variableFontStyles && typeof f.variableFontStyles === 'object' ? f.variableFontStyles : {},
                variableFontFamilies: f.variableFontFamilies && typeof f.variableFontFamilies === 'object' ? f.variableFontFamilies : {},
                underlineVariables: !!f.underlineVariables,
            }));
        } else {
            config.fields = [];
        }

        event.certificateConfig = config;
        event.markModified('certificateConfig');

        try {
            await event.save();
        } catch (saveErr) {
            console.error('[Certificate Config] Mongoose save error:', saveErr.message, saveErr.errors);
            const firstError = saveErr.errors ? Object.values(saveErr.errors)[0]?.message : saveErr.message;
            return res.status(400).json({
                success: false,
                message: 'Certificate configuration could not be saved.',
                error: firstError || saveErr.message
            });
        }

        console.log('[Certificate Config] Saved successfully for event:', event._id);
        // Return plain object so Mongoose internals are not exposed
        res.json(event.toObject().certificateConfig || { fields: [] });
    } catch (error) {
        console.error('[Certificate Config] Unexpected error:', error.message);
        next(error);
    }
});

// @desc    Get certificate config
// @route   GET /api/certificates/config/:eventId
// @access  Private/Admin
router.get('/config/:eventId', protect, authorize('Admin'), async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
            return res.status(400).json({ success: false, message: 'Invalid Event ID format.' });
        }
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found.' });
        }
        res.json(event.toObject().certificateConfig || { fields: [] });
    } catch (error) {
        next(error);
    }
});

// @desc    Download certificate (Participant version)
router.get('/download/:regId', protect, async (req, res, next) => {
    try {
        const registration = await Registration.findById(req.params.regId)
            .populate('participant')
            .populate('event');

        if (!registration) {
            res.status(404);
            throw new Error('Registration not found');
        }

        // Eligibility check
        if (!registration.attendanceStatus) {
            res.status(403);
            throw new Error('Attendance required for certificate');
        }

        // Feedback check (if feedback form exists)
        if (registration.event.feedbackForm && registration.event.feedbackForm.length > 0) {
            if (!registration.feedbackSubmitted) {
                res.status(403);
                throw new Error('Feedback submission required for certificate');
            }
        }

        const event = registration.event;
        if (!event.certificateConfig || !event.certificateConfig.template) {
            res.status(404);
            throw new Error('Certificate template not configured for this event. Please contact the administrator.');
        }

        const pdfBuffer = await generateCertificate(registration, event.certificateConfig);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=certificate_${registration.registrationId}.pdf`,
            'Content-Length': pdfBuffer.byteLength
        });

        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        next(error);
    }
});

// @desc    Get certificate render data for client-side PDF generation (Participant)
// @route   GET /api/certificates/data/:regId
// @access  Private (own registration only)
router.get('/data/:regId', protect, async (req, res, next) => {
    try {
        const registration = await Registration.findById(req.params.regId)
            .populate('participant', 'username gender yearAndDept registrationNumber collegeName email')
            .populate('event', 'title eventDate certificateConfig feedbackForm');

        console.log(`[CERTIFICATE] GET /data/${req.params.regId}`);
        console.log(`[CERTIFICATE] Registration found:`, !!registration);
        if (registration) {
            console.log(`[CERTIFICATE] Template configured:`, !!registration.event.certificateConfig?.template);
            console.log(`[CERTIFICATE] Auth check: PartID=${registration.participant?._id}, UserID=${req.user._id}, Role=${req.user.role}`);
        }

        if (!registration) {
            console.log(`[CERTIFICATE] Returning 400 Registration not found`);
            return res.status(400).json({ message: 'Registration not found' });
        }

        // Only the owner or Admin can fetch certificate data
        if (
            registration.participant._id.toString() !== req.user._id.toString() &&
            req.user.role !== 'Admin'
        ) {
            return res.status(403).json({ message: 'Not authorized to access this certificate' });
        }

        // Eligibility checks
        if (!registration.attendanceStatus) {
            return res.status(403).json({ message: 'You must have attended the event to download the certificate.' });
        }
        if (registration.event.feedbackForm?.length > 0 && !registration.feedbackSubmitted) {
            return res.status(403).json({ message: 'Please submit your feedback before downloading the certificate.' });
        }

        const event = registration.event;
        if (!event.certificateConfig?.template) {
            console.log(`[CERTIFICATE] Returning 400 Template missing`);
            return res.status(400).json({ message: 'Certificate template not configured for this event. Please contact the administrator.' });
        }

        res.json({
            participant: {
                username           : registration.participant.username,
                gender             : registration.participant.gender,
                yearAndDept        : registration.participant.yearAndDept,
                registrationNumber : registration.participant.registrationNumber,
                collegeName        : registration.participant.collegeName,
            },
            event: {
                title    : event.title,
                eventDate: event.eventDate,
            },
            config        : event.toObject().certificateConfig,
            registrationId: registration.registrationId,
        });
    } catch (error) {
        next(error);
    }
});

// @desc    Get certificate render data for client-side PDF generation (Volunteer)
// @route   GET /api/certificates/volunteer-data/:volAppId
// @access  Private (own application only)
router.get('/volunteer-data/:volAppId', protect, async (req, res, next) => {
    try {
        const volApp = await VolunteerApplication.findById(req.params.volAppId)
            .populate('applicant', 'username gender yearAndDept registrationNumber collegeName email')
            .populate('event', 'title eventDate certificateConfig');

        if (!volApp) {
            return res.status(404).json({ message: 'Volunteer application not found' });
        }

        if (volApp.applicant._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to access this certificate' });
        }

        if (volApp.status !== 'Approved') {
            return res.status(403).json({ message: 'Your application must be Approved to download a certificate.' });
        }

        const event = volApp.event;
        if (!event.certificateConfig?.template) {
            return res.status(404).json({ message: 'Certificate template not configured for this event. Please contact the administrator.' });
        }

        const registrationId = `VOL-${volApp._id.toString().slice(-6).toUpperCase()}`;

        res.json({
            participant: {
                username           : volApp.applicant.username,
                gender             : volApp.applicant.gender,
                yearAndDept        : volApp.applicant.yearAndDept,
                registrationNumber : volApp.applicant.registrationNumber,
                collegeName        : volApp.applicant.collegeName,
            },
            event: {
                title    : event.title,
                eventDate: event.eventDate,
            },
            config        : event.toObject().certificateConfig,
            registrationId,
        });
    } catch (error) {
        next(error);
    }
});



// @desc    Download certificate (Volunteer/Association Member version)
// @route   GET /api/certificates/volunteer-download/:volAppId
// @access  Private (Applicant only)
router.get('/volunteer-download/:volAppId', protect, async (req, res, next) => {
    try {
        const volApp = await VolunteerApplication.findById(req.params.volAppId)
            .populate('applicant')
            .populate('event');

        if (!volApp) {
            res.status(404);
            throw new Error('Volunteer application not found');
        }

        // Ensure the requesting user is the applicant
        if (volApp.applicant._id.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('You are not authorized to download this certificate');
        }

        // Only approved volunteers can download
        if (volApp.status !== 'Approved') {
            res.status(403);
            throw new Error('Your application must be Approved to download a certificate');
        }

        const event = volApp.event;
        if (!event.certificateConfig || !event.certificateConfig.template) {
            res.status(404);
            throw new Error('Certificate template not configured for this event. Please contact the administrator.');
        }

        // Build a mock registration object compatible with the certificate generator
        const mockReg = {
            participant: volApp.applicant,
            event: event,
            registrationId: `VOL-${volApp._id.toString().slice(-6).toUpperCase()}`
        };

        const pdfBuffer = await generateCertificate(mockReg, event.certificateConfig);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=certificate_${mockReg.registrationId}.pdf`,
            'Content-Length': pdfBuffer.byteLength
        });

        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        next(error);
    }
});

// @desc    Preview certificate
// @route   POST /api/certificates/preview/:eventId
// @access  Private/Admin
router.post('/preview/:eventId', protect, authorize('Admin'), async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        // Dummy registration for preview
        const dummyReg = {
            participant: {
                username: 'Murugan',
                gender: 'Male',
                yearAndDept: 'III B.E. CSE',
                section: 'A',
                registrationNumber: 'ST12345'
            },
            event: event
        };

        const config = req.body; // Expect config in body
        if (!config.template && event.certificateConfig?.template) {
            config.template = event.certificateConfig.template;
        }

        const pdfBuffer = await generateCertificate(dummyReg, config);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.byteLength
        });
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        next(error);
    }
});

// @desc    Bulk send certificates via email
// @route   POST /api/certificates/bulk-send/:eventId
// @access  Private/Admin
router.post('/bulk-send/:eventId', protect, authorize('Admin'), async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }
        if (!event.certificateConfig || !event.certificateConfig.template) {
            res.status(400);
            throw new Error('Certificate template not configured. Please upload a template image and configure fields before sending certificates.');
        }
        if (!event.certificateConfig.fields || event.certificateConfig.fields.length === 0) {
            res.status(400);
            throw new Error('Certificate fields not configured. Please add at least one field to the certificate configuration.');
        }

        const { sendEmail } = require('../utils/emailService');
        let successCount = 0;

        const target = req.body.target || 'both'; // 'participants', 'volunteers', 'both'

        if (target === 'both' || target === 'participants') {
            const eligibleRegs = await Registration.find({
                event: req.params.eventId,
                attendanceStatus: true
            }).populate('participant');

            for (const reg of eligibleRegs) {
                // Check feedback if required
                if (event.feedbackForm && event.feedbackForm.length > 0 && !reg.feedbackSubmitted) {
                    continue;
                }

                try {
                    const pdfBuffer = await generateCertificate(reg, event.certificateConfig);

                    await sendEmail({
                        to: reg.participant.email,
                        subject: `Certificate of Participation: ${event.title}`,
                        htmlContent: `
                            <p>Hello ${reg.participant.username},</p>
                            <p>Congratulations! Your certificate for <strong>${event.title}</strong> is ready.</p>
                            <p>Please find it attached to this email.</p>
                        `,
                        attachments: [
                            {
                                content: Buffer.from(pdfBuffer).toString('base64'),
                                filename: `certificate_${reg.registrationId}.pdf`,
                                type: 'application/pdf',
                                disposition: 'attachment'
                            }
                        ]
                    });
                    successCount++;
                } catch (err) {
                    console.error(`Failed to send cert to ${reg.participant.email}:`, err);
                }
            }
        }

        if (target === 'both' || target === 'volunteers') {
            const volunteers = await VolunteerApplication.find({
                event: req.params.eventId,
                status: 'Approved' // Send to approved volunteers
            }).populate('applicant');

            for (const vol of volunteers) {
                try {
                    const mockReg = {
                        participant: vol.applicant,
                        event: event,
                        registrationId: `VOL-${vol._id.toString().slice(-6).toUpperCase()}`
                    };
                    const pdfBuffer = await generateCertificate(mockReg, event.certificateConfig);

                    await sendEmail({
                        to: vol.applicant.email,
                        subject: `Certificate of Appreciation (Volunteer): ${event.title}`,
                        htmlContent: `
                            <p>Hello ${vol.applicant.username},</p>
                            <p>Thank you for your valuable contribution as a volunteer! Your certificate for <strong>${event.title}</strong> is ready.</p>
                            <p>Please find it attached to this email.</p>
                        `,
                        attachments: [
                            {
                                content: Buffer.from(pdfBuffer).toString('base64'),
                                filename: `certificate_${mockReg.registrationId}.pdf`,
                                type: 'application/pdf',
                                disposition: 'attachment'
                            }
                        ]
                    });
                    successCount++;
                } catch (err) {
                    console.error(`Failed to send volunteer cert to ${vol.applicant.email}:`, err);
                }
            }
        }

        res.json({ message: `Certificates sent to ${successCount} people successfully.` });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
