const Registration = require('../models/Registration');
const generateCertificate = require('../utils/certificateGenerator');

// @desc    Download certificate
// @route   GET /api/certificates/download/:regId
// @access  Private
exports.downloadCertificate = async (req, res, next) => {
    try {
        const registration = await Registration.findById(req.params.regId)
            .populate('participant', 'username')
            .populate('event', 'title eventDate');

        if (!registration) {
            res.status(404);
            throw new Error('Registration not found');
        }

        if (!registration.attendanceStatus && req.user.role !== 'Admin') {
            res.status(403);
            throw new Error('You must attend the event to receive a certificate');
        }

        const pdfBuffer = await generateCertificate({
            participantName: registration.participant.username,
            eventName: registration.event.title,
            date: new Date(registration.event.eventDate).toLocaleDateString(),
        });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=certificate_${registration.registrationId}.pdf`,
            'Content-Length': pdfBuffer.byteLength
        });

        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        next(error);
    }
};
