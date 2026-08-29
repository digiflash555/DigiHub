const EmailConfiguration = require('../models/EmailConfiguration');
const EmailTemplate = require('../models/EmailTemplate');
const EmailDraft = require('../models/EmailDraft');
const ScheduledEmail = require('../models/ScheduledEmail');
const EmailLog = require('../models/EmailLog');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const VolunteerApplication = require('../models/VolunteerApplication');
const emailService = require('../services/emailService');

// ---- CONFIGURATION ----
exports.getConfig = async (req, res) => {
    try {
        let config = await EmailConfiguration.findOne();
        if (!config) {
            config = new EmailConfiguration({
                smtpHost: 'smtp-relay.brevo.com',
                smtpPort: 587,
                smtpUsername: '',
                smtpPassword: '',
                senderName: 'Event Management System',
                senderEmail: 'admin@example.com'
            });
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.saveConfig = async (req, res) => {
    try {
        let config = await EmailConfiguration.findOne();
        if (config) {
            config = Object.assign(config, req.body);
        } else {
            config = new EmailConfiguration(req.body);
        }
        await config.save();
        res.json({ message: 'Configuration saved successfully', config });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.testConfig = async (req, res) => {
    try {
        const senderEmail = process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USERNAME;
        await emailService.sendEmail({
            to: senderEmail,
            subject: 'Test Email — SMTP Working',
            body: '<p>If you are seeing this, your SMTP configuration is working perfectly.</p>',
            type: 'Manual'
        });
        res.json({ message: 'Test email sent successfully!' });
    } catch (error) {
        res.status(500).json({ message: `Test failed: ${error.message}` });
    }
};

// ---- EVENTS (for recipient picker) ----
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find({}, 'title status eventDate').sort({ eventDate: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Returns categorised email lists for a specific event
exports.getEventRecipients = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId)
            .populate('facultyCoordinator', 'email username')
            .populate('studentCoordinator', 'email username')
            .populate('createdBy', 'email username');

        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Registered participants
        const regs = await Registration.find({ event: eventId, status: { $ne: 'Cancelled' } })
            .populate('participant', 'email username role');
        const participants = [...new Set(regs.map(r => r.participant?.email).filter(Boolean))];

        // Attended participants
        const attendedRegs = regs.filter(r => r.attendanceStatus === true);
        const attendedParticipants = [...new Set(attendedRegs.map(r => r.participant?.email).filter(Boolean))];

        // Approved volunteers
        const volApps = await VolunteerApplication.find({ event: eventId, status: 'Approved' })
            .populate('applicant', 'email username');
        const volunteers = [...new Set(volApps.map(v => v.applicant?.email).filter(Boolean))];

        // Faculty (all faculty users in system)
        const facultyUsers = await User.find({ role: { $in: ['Faculty', 'Faculty Coordinator'] } }).select('email username');
        const faculty = facultyUsers.map(u => u.email);

        // Event coordinators (faculty + student coordinators linked to this event)
        const coordinatorEmails = new Set();
        if (event.facultyCoordinator?.email) coordinatorEmails.add(event.facultyCoordinator.email);
        if (event.studentCoordinator?.email) coordinatorEmails.add(event.studentCoordinator.email);
        if (event.createdBy?.email) coordinatorEmails.add(event.createdBy.email);
        // Also include all Association Members & Student Coordinators
        const assocMembers = await User.find({ role: { $in: ['Association Member', 'Student Coordinator', 'Admin'] } }).select('email');
        assocMembers.forEach(u => coordinatorEmails.add(u.email));
        const coordinators = [...coordinatorEmails];

        // All above combined
        const all = [...new Set([...participants, ...volunteers, ...faculty, ...coordinators])];

        res.json({
            eventTitle: event.title,
            groups: {
                'Registered Participants': { emails: participants, count: participants.length },
                'Attended Participants':   { emails: attendedParticipants, count: attendedParticipants.length },
                'Event Volunteers':        { emails: volunteers,    count: volunteers.length },
                'Faculty':                 { emails: faculty,       count: faculty.length },
                'Event Coordinators':      { emails: coordinators,  count: coordinators.length },
                'Everyone in Event':       { emails: all,           count: all.length },
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---- AUTOMATED TEMPLATES ----
exports.getTemplates = async (req, res) => {
    try {
        const { eventId } = req.query;
        
        // Always fetch globals
        const globals = await EmailTemplate.find({ eventId: null }).sort({ name: 1 }).lean();
        
        if (eventId) {
            // Fetch event-specific overrides
            const overrides = await EmailTemplate.find({ eventId }).lean();
            
            const merged = globals.map(g => {
                const override = overrides.find(o => o.trigger === g.trigger);
                if (override) {
                    return { ...override, isOverride: true, globalId: g._id };
                }
                return { ...g, isOverride: false, globalId: g._id };
            });
            return res.json(merged);
        }

        res.json(globals.map(g => ({ ...g, isOverride: false, globalId: g._id })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const { eventId, subject, body, enabled } = req.body;
        
        if (eventId) {
            const templateId = req.params.id; // Could be global ID or override ID
            const existingTemplate = await EmailTemplate.findById(templateId);
            
            if (existingTemplate.eventId && existingTemplate.eventId.toString() === eventId) {
                // It's already an override for this event, just update it
                const template = await EmailTemplate.findByIdAndUpdate(templateId, { subject, body, enabled }, { new: true });
                return res.json({ message: 'Event template updated', template });
            } else {
                // It's a global template (or from another event), create an override
                const newOverride = await EmailTemplate.create({
                    eventId,
                    name: existingTemplate.name,
                    trigger: existingTemplate.trigger,
                    subject,
                    body,
                    enabled,
                    recipientType: existingTemplate.recipientType,
                    availableVariables: existingTemplate.availableVariables
                });
                return res.json({ message: 'Event template override created', template: newOverride });
            }
        }

        // Global update
        const template = await EmailTemplate.findByIdAndUpdate(req.params.id, { subject, body, enabled }, { new: true });
        res.json({ message: 'Global Template updated successfully', template });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const template = await EmailTemplate.findById(req.params.id);
        if (template && template.eventId) {
            await EmailTemplate.findByIdAndDelete(req.params.id);
            res.json({ message: 'Event template override removed' });
        } else {
            res.status(400).json({ message: 'Cannot delete global templates' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.restoreDefaultTemplate = async (req, res) => {
    try {
        const template = await EmailTemplate.findById(req.params.id);
        // Default texts would typically be loaded from a constant file, here we reset body loosely
        // In a real app we'd maintain originalBody in the schema
        res.json({ message: 'Feature to restore default not fully implemented yet.', template });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---- MANUAL EMAILS ----
exports.getRecipientGroups = async (req, res) => {
    // Return counts for each group
    try {
        const allUsers = await User.countDocuments();
        const faculty = await User.countDocuments({ role: 'Faculty' });
        const coordinators = await User.countDocuments({ role: { $in: ['Association Member', 'Student Coordinator'] } });
        const volunteers = await User.countDocuments({ role: 'Volunteer' }); // Or wherever volunteer role is
        const participants = await User.countDocuments({ role: { $in: ['Participant', 'Student'] } });

        res.json({
            'All Users': allUsers,
            'Faculty': faculty,
            'Event Coordinators': coordinators,
            'Event Volunteers': volunteers,
            'Participants': participants
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resolveRecipients = async (groups) => {
    let emails = new Set();
    const query = [];
    if (groups.includes('All Users')) query.push({});
    if (groups.includes('Faculty')) query.push({ role: 'Faculty' });
    if (groups.includes('Event Coordinators')) query.push({ role: { $in: ['Association Member', 'Student Coordinator', 'Admin'] } });
    if (groups.includes('Participants')) query.push({ role: { $in: ['Participant', 'Student'] } });
    
    // We would resolve 'Registered Participants' and 'Event Volunteers' by joining with Registration / Volunteer schemas, simplified here
    if (query.length > 0) {
        const users = await User.find({ $or: query }).select('email');
        users.forEach(u => emails.add(u.email));
    }
    return Array.from(emails);
};

exports.sendManualEmail = async (req, res) => {
    try {
        const { recipientGroups = [], specificUsers = [], cc = [], bcc = [], subject, body, attachments, scheduledDate } = req.body;
        
        // Resolve group emails
        let allBcc = [...bcc];
        if (recipientGroups.length > 0) {
            const groupEmails = await resolveRecipients(recipientGroups);
            allBcc = [...new Set([...allBcc, ...groupEmails])];
        }
        allBcc = [...new Set([...allBcc, ...specificUsers])]; // all specific and group targets go to BCC for bulk

        if (scheduledDate) {
            const scheduled = await ScheduledEmail.create({
                subject, body, attachments, recipientGroups, cc, bcc: allBcc, scheduledDate
            });
            return res.json({ message: 'Email scheduled successfully!', scheduled });
        } else {
            // Send now
            emailService.processBulkEmail(allBcc, subject, body, attachments, recipientGroups);
            res.json({ message: `Email queued for sending to ${allBcc.length} recipients.` });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---- DRAFTS ----
exports.getDrafts = async (req, res) => {
    try {
        const drafts = await EmailDraft.find().sort({ updatedAt: -1 });
        res.json(drafts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.saveDraft = async (req, res) => {
    try {
        let draft;
        if (req.body._id) {
            draft = await EmailDraft.findByIdAndUpdate(req.body._id, req.body, { new: true });
        } else {
            draft = await EmailDraft.create(req.body);
        }
        res.json({ message: 'Draft saved', draft });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteDraft = async (req, res) => {
    try {
        await EmailDraft.findByIdAndDelete(req.params.id);
        res.json({ message: 'Draft deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---- SCHEDULED EMAILS ----
exports.getScheduledEmails = async (req, res) => {
    try {
        const emails = await ScheduledEmail.find().sort({ scheduledDate: 1 });
        res.json(emails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteScheduledEmail = async (req, res) => {
    try {
        await ScheduledEmail.findByIdAndDelete(req.params.id);
        res.json({ message: 'Scheduled email cancelled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ---- LOGS & STATS ----
exports.getHistory = async (req, res) => {
    try {
        const history = await EmailLog.find().sort({ createdAt: -1 }).limit(100);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const total = await EmailLog.countDocuments();
        const sent = await EmailLog.countDocuments({ status: 'Sent' });
        const failed = await EmailLog.countDocuments({ status: 'Failed' });
        const manual = await EmailLog.countDocuments({ emailType: 'Manual' });
        const auto = await EmailLog.countDocuments({ emailType: 'Automatic' });
        
        // Aggregate for chart data
        const chartData = await EmailLog.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sent: { $sum: { $cond: [{ $eq: ["$status", "Sent"] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ["$status", "Failed"] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 30 }
        ]);

        res.json({
            summary: { total, sent, failed, manual, auto },
            chartData: chartData.map(d => ({ date: d._id, sent: d.sent, failed: d.failed }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
