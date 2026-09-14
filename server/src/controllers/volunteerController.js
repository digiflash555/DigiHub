const VolunteerApplication = require('../models/VolunteerApplication');
const Event = require('../models/Event');
const User = require('../models/User');
const Settings = require('../models/Settings');
const emailService = require('../services/emailService');

// @desc    Apply to volunteer for an event
// @route   POST /api/volunteers/apply
// @access  Private (Association Members)
exports.applyToVolunteer = async (req, res, next) => {
    try {
        const { eventId, role, motivation } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        if (event.status === 'Completed' || event.status === 'Cancelled') {
            return res.status(400).json({ message: 'Volunteer applications are closed for this event' });
        }

        const settings = await Settings.getSettings();
        if (settings.volunteerRestriction === 'upcoming_events_only') {
            const eventDateEnd = new Date(event.eventDate);
            eventDateEnd.setHours(23, 59, 59, 999);
            if (new Date() > eventDateEnd) {
                return res.status(400).json({ message: 'Volunteer applications are closed for past events' });
            }
        }

        const existing = await VolunteerApplication.findOne({
            event: eventId,
            applicant: req.user._id
        });
        if (existing) {
            return res.status(400).json({ message: 'You have already applied for this event' });
        }

        const application = await VolunteerApplication.create({
            event: eventId,
            applicant: req.user._id,
            role: role || 'Event Volunteer',
            motivation: motivation || '',
            applicantName: req.user.username || '',
            applicantRollNumber: req.user.registrationNumber || '',
            applicantYearAndDept: req.user.yearAndDept || '',
            applicantSection: req.user.section || '',
            status: 'Approved',
            onDutyIssued: true
        });

        // Trigger Email
        emailService.triggerAutomaticEmail('VOLUNTEER_ASSIGNMENT', {
            volunteer_name: req.user.username,
            event_name: event.title,
            volunteer_duty: application.role,
            reporting_time: event.time || 'TBA',
            event_date: event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'TBA',
            event_venue: event.venue || 'TBA'
        }, req.user.email, event._id, req.user._id);

        res.status(201).json(application);
    } catch (error) {
        next(error);
    }
};

// @desc    Get my volunteer applications
// @route   GET /api/volunteers/my
// @access  Private (Association Members)
exports.getMyApplications = async (req, res, next) => {
    try {
        const apps = await VolunteerApplication.find({ applicant: req.user._id })
            .populate('event', 'title eventDate venue status')
            .sort({ createdAt: -1 });
        res.json(apps);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all volunteer applications (Admin)
// @route   GET /api/volunteers/all
// @access  Private (Admin)
exports.getAllApplications = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.eventId) filter.event = req.query.eventId;

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
            filter.applicant = { $in: studentIds };
            filter.status = 'Approved';
        }

        const apps = await VolunteerApplication.find(filter)
            .populate('event', 'title eventDate venue')
            .populate('applicant', 'username email registrationNumber yearAndDept section')
            .sort({ createdAt: -1 });
        res.json(apps);
    } catch (error) {
        next(error);
    }
};

// @desc    Update application status / issue on-duty
// @route   PUT /api/volunteers/:id
// @access  Private (Admin)
exports.updateApplication = async (req, res, next) => {
    try {
        const { status, onDutyIssued, onDutyNote } = req.body;
        const app = await VolunteerApplication.findById(req.params.id);
        if (!app) {
            res.status(404);
            throw new Error('Application not found');
        }
        if (status) app.status = status;
        if (onDutyIssued !== undefined) app.onDutyIssued = onDutyIssued;
        if (onDutyNote !== undefined) app.onDutyNote = onDutyNote;
        app.reviewedBy = req.user._id;
        await app.save();

        // If newly approved
        if (status === 'Approved') {
            const ev = await Event.findById(app.event);
            const usr = await User.findById(app.applicant);
            if (ev && usr) {
                emailService.triggerAutomaticEmail('VOLUNTEER_ASSIGNMENT', {
                    volunteer_name: usr.username,
                    event_name: ev.title,
                    volunteer_duty: app.role,
                    reporting_time: ev.time || 'TBA',
                    event_date: ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : 'TBA',
                    event_venue: ev.venue || 'TBA'
                }, usr.email, ev._id, usr._id);
            }
        }

        res.json(app);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete (withdraw) a volunteer application
// @route   DELETE /api/volunteers/:id
// @access  Private (Association Members)
exports.withdrawApplication = async (req, res, next) => {
    try {
        const app = await VolunteerApplication.findOne({
            _id: req.params.id,
            applicant: req.user._id
        });
        if (!app) {
            res.status(404);
            throw new Error('Application not found');
        }
        if (app.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending applications can be withdrawn' });
        }
        await app.deleteOne();
        res.json({ message: 'Application withdrawn successfully' });
    } catch (error) {
        next(error);
    }
};
