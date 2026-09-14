const SupportQuery = require('../models/SupportQuery');
const User = require('../models/User');
const emailService = require('../services/emailService');
const EmailTemplate = require('../models/EmailTemplate');

// @desc    Submit a new query/suggestion
// @route   POST /api/support
// @access  Private
exports.submitQuery = async (req, res, next) => {
    try {
        const query = await SupportQuery.create({
            user: req.user._id,
            subject: req.body.subject,
            category: req.body.category,
            message: req.body.message
        });

        // --- Notify all Association Members using DB template ---
        try {
            const associationMembers = await User.find({ role: 'Association Member' }).select('email');
            const adminEmails = associationMembers.map(u => u.email).filter(Boolean);

            if (adminEmails.length > 0) {
                const tmpl = await EmailTemplate.findOne({ trigger: 'SUPPORT_NEW_TICKET', enabled: true });
                const variables = {
                    user_name: req.user.username,
                    user_email: req.user.email,
                    ticket_category: req.body.category || 'Query',
                    ticket_subject: req.body.subject,
                    ticket_message: req.body.message,
                };
                const subject = tmpl
                    ? emailService.compileTemplate(tmpl.subject, variables)
                    : `[User Care] New Ticket: ${req.body.subject}`;
                const htmlBody = tmpl
                    ? emailService.compileTemplate(tmpl.body, variables)
                    : `<p><strong>From:</strong> ${req.user.username} (${req.user.email})<br/><strong>Subject:</strong> ${req.body.subject}<br/><strong>Message:</strong> ${req.body.message}</p>`;

                emailService._sendViaBrevoAPI({
                    to: process.env.SMTP_SENDER_EMAIL,
                    bcc: adminEmails.join(','),
                    subject,
                    htmlBody
                }).catch(err => console.error('[Support] Failed to notify association members:', err.message));
            }
        } catch (emailErr) {
            console.error('[Support] Error notifying association members:', emailErr.message);
        }
        // --- End Notify ---

        res.status(201).json(query);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all queries (Admin access)
// @route   GET /api/support
// @access  Private/Admin
exports.getQueries = async (req, res, next) => {
    try {
        const queries = await SupportQuery.find()
            .populate('user', 'username email')
            .sort({ createdAt: -1 });
        res.json(queries);
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's own queries
// @route   GET /api/support/my
// @access  Private
exports.getMyQueries = async (req, res, next) => {
    try {
        const queries = await SupportQuery.find({ user: req.user._id })
            .sort({ createdAt: -1 });
        res.json(queries);
    } catch (error) {
        next(error);
    }
};

// @desc    Update query status (Admin access)
// @route   PUT /api/support/:id
// @access  Private/Admin
exports.updateQueryStatus = async (req, res, next) => {
    try {
        const { status, adminRemarks } = req.body;
        const query = await SupportQuery.findByIdAndUpdate(
            req.params.id,
            { status, adminRemarks },
            { new: true }
        ).populate('user', 'username email');

        if (!query) {
            res.status(404);
            throw new Error('Query not found');
        }

        // --- Send Status Update Email to User using DB template ---
        try {
            if (query.user?.email) {
                const tmpl = await EmailTemplate.findOne({ trigger: 'SUPPORT_STATUS_UPDATE', enabled: true });
                const variables = {
                    user_name: query.user.username,
                    ticket_subject: query.subject,
                    ticket_status: status,
                    admin_remarks: adminRemarks || 'No additional comments.',
                };
                const emailSubject = tmpl
                    ? emailService.compileTemplate(tmpl.subject, variables)
                    : `[DigiHub User Care] Ticket Update: ${status} — ${query.subject}`;
                const htmlBody = tmpl
                    ? emailService.compileTemplate(tmpl.body, variables)
                    : `<p>Hi ${query.user.username}, your ticket "<strong>${query.subject}</strong>" status changed to <strong>${status}</strong>.<br/>Admin Remarks: ${adminRemarks || 'N/A'}</p>`;

                emailService._sendViaBrevoAPI({
                    to: query.user.email,
                    subject: emailSubject,
                    htmlBody
                }).catch(err => console.error('[Support] Failed to send status update email:', err.message));
            }
        } catch (emailErr) {
            console.error('[Support] Error sending status email to user:', emailErr.message);
        }
        // --- End Status Email ---

        res.json(query);
    } catch (error) {
        next(error);
    }
};
