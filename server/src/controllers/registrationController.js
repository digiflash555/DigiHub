const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Team = require('../models/Team');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { createCloudinaryUpload } = require('../utils/cloudinaryUpload');
const { generatePDFReport } = require('../utils/reportGenerator');

// Registration file upload — stored in Cloudinary under event_management/registrations
const registrationFileUpload = createCloudinaryUpload('registrations', ['jpeg', 'jpg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'], 1, 'reg-file-');

exports.registrationFileUpload = registrationFileUpload;
const User = require('../models/User');

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private
exports.registerForEvent = async (req, res, next) => {
    try {
        if (['Class Coordinator', 'Program Coordinator', 'Admin', 'Faculty', 'Faculty Coordinator'].includes(req.user.role)) {
            res.status(403);
            throw new Error('Faculty, Coordinators, and Administrators are not allowed to register for events.');
        }

        let { eventId, teamId, teamMembers, teamName, formData, memberFormData } = req.body;
        const userId = req.user._id;

        if (typeof formData === 'string') {
            formData = JSON.parse(formData);
        }
        if (typeof memberFormData === 'string') {
            memberFormData = JSON.parse(memberFormData);
        }
        if (typeof teamMembers === 'string') {
            teamMembers = JSON.parse(teamMembers);
        }
        formData = formData || {};
        memberFormData = memberFormData || {};

        // Attach uploaded files to form data
        if (req.files && req.files.length) {
            req.files.forEach((file) => {
                // Determine if it's a member file: memberFiles_{memberId}_{fieldLabel}
                if (file.fieldname.startsWith('memberFiles_')) {
                    const parts = file.fieldname.split('_');
                    const memberId = parts[1];
                    const fieldLabel = parts.slice(2).join('_');
                    
                    if (!memberFormData[memberId]) memberFormData[memberId] = {};
                    memberFormData[memberId][fieldLabel] = file.path; // Cloudinary secure_url
                } else {
                    // Regular file field
                    formData[file.fieldname] = file.path; // Cloudinary secure_url
                }
            });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        // Check registration deadline
        if (new Date() > new Date(event.registrationDeadline)) {
            res.status(400);
            throw new Error('Registration deadline has passed');
        }

        // Generate a more professional Registration ID
        const eventCode = event.title.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
        const registrationId = `REG-${eventCode}-${timestamp}-${randomPart}`;

        if (event.participationType === 'Team') {
            if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
                res.status(400);
                throw new Error('Please select team members for team event');
            }

            if (!teamName) {
                res.status(400);
                throw new Error('Please provide a team name');
            }

            const totalSize = teamMembers.length + 1;
            if (totalSize < event.minTeamSize || totalSize > event.maxTeamSize) {
                res.status(400);
                throw new Error(`Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}`);
            }

            const participantsToCheck = [userId, ...teamMembers];
            const alreadyRegistered = await Registration.find({
                event: eventId,
                participant: { $in: participantsToCheck }
            }).populate('participant', 'username');

            if (alreadyRegistered.length > 0) {
                const names = alreadyRegistered.map(r => r.participant.username).join(', ');
                res.status(400);
                throw new Error(`The following users are already registered for this event: ${names}`);
            }

            const regCount = await Registration.countDocuments({ event: eventId });
            if (regCount + participantsToCheck.length > event.maxParticipants) {
                res.status(400);
                throw new Error('Not enough slots left for the whole team');
            }

            const team = await Team.create({
                name: teamName,
                event: eventId,
                leader: userId,
                members: [
                    { user: userId, status: 'Accepted' },
                    ...teamMembers.map(id => ({ user: id, status: 'Accepted' }))
                ],
                isRegistrationComplete: true
            });

            // Compact QR Data for efficiency
            const qrPayload = JSON.stringify({ r: registrationId, e: eventId });
            const qrCodeImage = await QRCode.toDataURL(qrPayload);

            const registrationRecords = [];
            registrationRecords.push({
                event: eventId,
                participant: userId,
                registrationId,
                formData,
                qrCode: qrCodeImage,
                team: team._id
            });

            teamMembers.forEach(memberId => {
                registrationRecords.push({
                    event: eventId,
                    participant: memberId,
                    registrationId,
                    formData: memberFormData[memberId] || formData,
                    qrCode: qrCodeImage,
                    team: team._id
                });
            });

            const registrations = await Registration.insertMany(registrationRecords);

            // Email notification removed

            return res.status(201).json(registrations[0]);

        } else {
            // Individual Registration Logic
            const existingReg = await Registration.findOne({ event: eventId, participant: userId });
            if (existingReg) {
                res.status(400);
                throw new Error('You are already registered for this event');
            }

            const regCount = await Registration.countDocuments({ event: eventId });
            if (regCount >= event.maxParticipants) {
                res.status(400);
                throw new Error('Event is full');
            }

            const qrPayload = JSON.stringify({ r: registrationId, e: eventId });
            const qrCodeImage = await QRCode.toDataURL(qrPayload);

            const registration = await Registration.create({
                event: eventId,
                participant: userId,
                registrationId,
                formData,
                qrCode: qrCodeImage,
                team: teamId || undefined
            });

            // Email notification removed

            return res.status(201).json(registration);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's registrations
// @route   GET /api/registrations/my
// @access  Private
exports.getMyRegistrations = async (req, res, next) => {
    try {
        const registrations = await Registration.find({ participant: req.user._id })
            .populate('event')
            .sort({ createdAt: -1 });
        res.json(registrations);
    } catch (error) {
        next(error);
    }
};

// @desc    Get event registrations (for admin/staff)
// @route   GET /api/registrations/event/:eventId
// @access  Private/Staff
exports.getEventRegistrations = async (req, res, next) => {
    try {
        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('participant', 'username email registrationNumber yearAndDept section department phone');
        res.json(registrations);
    } catch (error) {
        next(error);
    }
};

// @desc    Get ALL registrations across all events (Admin only)
// @route   GET /api/registrations/all
// @access  Private/Admin
exports.getAllRegistrations = async (req, res, next) => {
    try {
        const registrations = await Registration.find({})
            .populate('participant', 'username email registrationNumber yearAndDept section department phone')
            .populate('event', 'title eventDate venue')
            .sort({ createdAt: -1 });
        res.json(registrations);
    } catch (error) {
        next(error);
    }
};

// @desc    Get registrations of students in a faculty's class
// @route   GET /api/registrations/class
// @access  Private (Class Coordinator, Program Coordinator, Admin)
exports.getClassRegistrations = async (req, res, next) => {
    try {
        let filter = {};
        
        if (req.user.role === 'Class Coordinator') {
            const yearMapping = {
                'I': 'I B.E. CSE',
                'II': 'II B.E. CSE',
                'III': 'III B.E. CSE',
                'IV': 'IV B.E. CSE'
            };
            const studentYearAndDept = yearMapping[req.user.assignedYear];
            const studentSection = req.user.assignedSection;

            const students = await User.find({
                yearAndDept: studentYearAndDept,
                section: studentSection
            }).select('_id');

            const studentIds = students.map(s => s._id);
            filter.participant = { $in: studentIds };
        } else if (req.user.role === 'Program Coordinator') {
            const students = await User.find({
                department: req.user.department
            }).select('_id');

            const studentIds = students.map(s => s._id);
            filter.participant = { $in: studentIds };
        }

        const registrations = await Registration.find(filter)
            .populate('event', 'title eventDate venue status')
            .populate('participant', 'username email registrationNumber yearAndDept section')
            .sort({ createdAt: -1 });

        res.json(registrations);
    } catch (error) {
        next(error);
    }
};

// @desc    Export registration report to PDF
// @route   POST /api/registrations/export/pdf/:eventId
// @access  Private (Admin, Class Coordinator, Program Coordinator, Faculty, Association Member)
exports.exportRegistrationPDF = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        // Check authorization
        const authorizedRoles = ['Admin', 'Class Coordinator', 'Program Coordinator', 'Faculty', 'Association Member'];
        if (!authorizedRoles.includes(req.user.role)) {
            res.status(403);
            throw new Error('You are not authorized to export registration report for this event.');
        }

        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('participant', 'username email registrationNumber yearAndDept section department phone')
            .populate('team');

        const { header, columns, symposiumName, symposiumType } = req.body;

        const buffer = await generatePDFReport(registrations, event, { header, columns, symposiumName, symposiumType });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Registrations_${event.title.replace(/\s/g, '_')}.pdf`,
            'Content-Length': buffer.byteLength
        });

        res.send(buffer);
    } catch (error) {
        next(error);
    }
};
