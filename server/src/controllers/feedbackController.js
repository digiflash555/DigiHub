const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const { generateFeedbackPDFReport } = require('../utils/reportGenerator');

const isAuthorizedForFeedback = async (user, eventId, allowedRoles = ['Admin', 'Association Member']) => {
    if (allowedRoles.includes(user.role)) {
        return true;
    }
    const event = await Event.findById(eventId);
    if (!event) return false;
    
    const userId = user._id.toString();
    const isFacultyCoord = event.facultyCoordinator && event.facultyCoordinator.toString() === userId;
    const isStudentCoord = event.studentCoordinator && event.studentCoordinator.toString() === userId;
    
    return !!(isFacultyCoord || isStudentCoord);
};

// @desc    Submit feedback for an event
// @route   POST /api/feedback
// @access  Private
exports.submitFeedback = async (req, res, next) => {
    try {
        const { eventId, responses } = req.body;
        const userId = req.user._id;

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        // Check if event has a feedback form
        if (!event.feedbackForm || event.feedbackForm.length === 0) {
            res.status(400);
            throw new Error('This event has no feedback form');
        }

        // Check if user attended the event
        const registration = await Registration.findOne({ 
            event: eventId, 
            participant: userId,
            attendanceStatus: true 
        });

        if (!registration) {
            res.status(403);
            throw new Error('You can only submit feedback for events you attended');
        }

        // Check if already submitted
        const existingFeedback = await Feedback.findOne({ event: eventId, user: userId });
        if (existingFeedback) {
            res.status(400);
            throw new Error('You have already submitted feedback for this event');
        }

        const feedback = await Feedback.create({
            event: eventId,
            user: userId,
            responses
        });

        // Mark registration as feedback submitted
        registration.feedbackSubmitted = true;
        await registration.save();

        res.status(201).json(feedback);
    } catch (error) {
        next(error);
    }
};

// @desc    Get feedback for an event (Admin only)
// @route   GET /api/feedback/event/:eventId
// @access  Private/Admin
exports.getEventFeedback = async (req, res, next) => {
    try {
        const authorized = await isAuthorizedForFeedback(req.user, req.params.eventId, ['Admin']);
        if (!authorized) {
            res.status(403);
            throw new Error('You are not authorized to view feedback for this event.');
        }
        const feedback = await Feedback.find({ event: req.params.eventId })
            .populate('user', 'username email registrationNumber')
            .sort({ createdAt: -1 });
        res.json(feedback);
    } catch (error) {
        next(error);
    }
};

// @desc    Check if current user has submitted feedback for an event
// @route   GET /api/feedback/check/:eventId
// @access  Private
exports.checkFeedbackStatus = async (req, res, next) => {
    try {
        const feedback = await Feedback.findOne({ 
            event: req.params.eventId, 
            user: req.user._id 
        });
        res.json({ submitted: !!feedback });
    } catch (error) {
        next(error);
    }
};

// @desc    Get feedback analytics for an event
// @route   GET /api/feedback/analytics/:eventId
// @access  Private/Admin
exports.getFeedbackAnalytics = async (req, res, next) => {
    try {
        const authorized = await isAuthorizedForFeedback(req.user, req.params.eventId, ['Admin']);
        if (!authorized) {
            res.status(403);
            throw new Error('You are not authorized to view analytics for this event.');
        }
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        const feedbacks = await Feedback.find({ event: req.params.eventId });
        
        // Simple summary: count of responses for each option in each field
        const summary = {};
        
        event.feedbackForm.forEach(field => {
            summary[field.label] = {
                type: field.type,
                totalResponses: feedbacks.length,
                options: {}
            };
            
            if (['dropdown', 'radio', 'checkbox'].includes(field.type)) {
                field.options.forEach(opt => {
                    summary[field.label].options[opt] = 0;
                });
            }
        });

        feedbacks.forEach(fb => {
            for (const [label, value] of fb.responses.entries()) {
                if (summary[label]) {
                    if (Array.isArray(value)) {
                        value.forEach(v => {
                            summary[label].options[v] = (summary[label].options[v] || 0) + 1;
                        });
                    } else if (summary[label].options[value] !== undefined) {
                        summary[label].options[value]++;
                    } else {
                        // For text fields, maybe just collect last 5 responses
                        if (!summary[label].recentResponses) summary[label].recentResponses = [];
                        if (summary[label].recentResponses.length < 5) {
                            summary[label].recentResponses.push(value);
                        }
                    }
                }
            }
        });

        res.json({
            eventTitle: event.title,
            totalFeedbacks: feedbacks.length,
            summary
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export feedback to Excel
// @route   GET /api/feedback/export/excel/:eventId
// @access  Private/Admin
exports.exportFeedbackExcel = async (req, res, next) => {
    try {
        const authorized = await isAuthorizedForFeedback(req.user, req.params.eventId, ['Admin', 'Association Member']);
        if (!authorized) {
            res.status(403);
            throw new Error('You are not authorized to export feedback for this event.');
        }
        const event = await Event.findById(req.params.eventId);
        const feedbacks = await Feedback.find({ event: req.params.eventId }).populate('user', 'username email registrationNumber');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Feedback');

        // Header
        const headers = ['Username', 'Email', 'Reg Number'];
        event.feedbackForm.forEach(f => headers.push(f.label));
        worksheet.addRow(headers);

        // Data
        feedbacks.forEach(fb => {
            const row = [
                fb.user.username,
                fb.user.email,
                fb.user.registrationNumber || 'N/A'
            ];
            event.feedbackForm.forEach(f => {
                const val = fb.responses.get(f.label);
                row.push(Array.isArray(val) ? val.join(', ') : (val || ''));
            });
            worksheet.addRow(row);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=feedback-${event.title}.xlsx`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};

// @desc    Export feedback to PDF
// @route   GET /api/feedback/export/pdf/:eventId
// @access  Private/Admin
exports.exportFeedbackPDF = async (req, res, next) => {
    try {
        const authorized = await isAuthorizedForFeedback(req.user, req.params.eventId, ['Admin', 'Association Member']);
        if (!authorized) {
            res.status(403);
            throw new Error('You are not authorized to export feedback for this event.');
        }
        const event = await Event.findById(req.params.eventId);
        const feedbacks = await Feedback.find({ event: req.params.eventId }).populate('user', 'username email registrationNumber');

        // Ensure the event has a feedback form
        if (!event.feedbackForm || event.feedbackForm.length === 0) {
            res.status(400);
            throw new Error('This event has no feedback form to export');
        }
        const pdfBuffer = await generateFeedbackPDFReport(feedbacks, event, {
            symposiumName: 'DIGIFLASH 2026',
            symposiumType: 'National Level Technical Symposium'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=feedback-${event.title}.pdf`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};
