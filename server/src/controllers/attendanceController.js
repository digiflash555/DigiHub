const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { generateExcelReport, generatePDFReport } = require('../utils/reportGenerator');

const isAuthorizedForEvent = async (user, eventId) => {
    if (['Admin', 'Class Coordinator', 'Program Coordinator', 'Association Member'].includes(user.role)) {
        return true;
    }
    const event = await Event.findById(eventId);
    if (!event) return false;
    
    const userId = user._id.toString();
    const isFacultyCoord = event.facultyCoordinator && event.facultyCoordinator.toString() === userId;
    const isStudentCoord = event.studentCoordinator && event.studentCoordinator.toString() === userId;
    
    return !!(isFacultyCoord || isStudentCoord);
};

// @desc    Mark attendance via QR scan or Manual ID
// @route   POST /api/attendance/mark
// @access  Private/Staff
exports.markAttendance = async (req, res, next) => {
    try {
        const { registrationId, eventId, signature } = req.body;

        const authorized = await isAuthorizedForEvent(req.user, eventId);
        if (!authorized) {
            res.status(403);
            throw new Error('You are not authorized to manage attendance for this event.');
        }

        let registration = await Registration.findOne({ 
            registrationId, 
            event: eventId 
        }).populate('participant', 'username email signature registrationNumber').populate('team');

        if (!registration) {
            const userWithRoll = await User.findOne({ registrationNumber: registrationId });
            if (userWithRoll) {
                registration = await Registration.findOne({
                    participant: userWithRoll._id,
                    event: eventId
                }).populate('participant', 'username email signature registrationNumber').populate('team');
            }
        }

        if (!registration) {
            res.status(404);
            throw new Error('Invalid registration or student ID for this event');
        }

        if (registration.attendanceStatus && !registration.team) {
            return res.status(400).json({
                message: 'Attendance already marked',
                participant: registration.participant.username,
                time: registration.attendanceTime
            });
        }

        const event = await Event.findById(eventId);
        if (!event || event.status === 'Completed' || event.status === 'Cancelled') {
            res.status(400);
            throw new Error(`Event is not active or already ${event?.status}`);
        }

        let message = `Attendance marked successfully for ${registration.participant.username}`;
        let participantName = registration.participant.username;
        let memberNames = [];

        if (registration.team) {
            // Ensure we handle both populated and unpopulated team field
            const teamId = registration.team._id || registration.team;
            
            // Find all registrations for this team in this event
            const teamRegistrations = await Registration.find({ 
                event: eventId, 
                team: teamId
            }).populate('participant', 'username signature');

            const now = new Date();
            let markedCount = 0;
            memberNames = teamRegistrations.map(m => m.participant?.username || 'Unknown');

            for (const reg of teamRegistrations) {
                if (!reg.attendanceStatus) {
                    reg.attendanceStatus = true;
                    reg.attendanceTime = now;
                    reg.markedBy = req.user._id;
                    
                    // Auto-attach signature if available in user profile
                    if (!reg.signature && reg.participant && reg.participant.signature) {
                        reg.signature = reg.participant.signature;
                    }
                    await reg.save();
                    markedCount++;
                }
            }
            
            message = `Team attendance marked! (${markedCount} new, ${teamRegistrations.length} total)`;
            participantName = registration.team.name || 'Team';
        } else {
            // Individual attendee
            registration.attendanceStatus = true;
            registration.attendanceTime = new Date();
            registration.markedBy = req.user._id;
            
            if (!registration.signature && registration.participant && registration.participant.signature) {
                registration.signature = registration.participant.signature;
            }
            await registration.save();
            participantName = registration.participant.username;
        }

        res.json({
            success: true,
            message,
            participant: participantName,
            members: memberNames,
            timestamp: new Date()
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance reports
// @route   GET /api/attendance/report/:eventId
// @access  Private/Staff
exports.getAttendanceReport = async (req, res, next) => {
    try {
        const authorized = await isAuthorizedForEvent(req.user, req.params.eventId);
        if (!authorized) {
            res.status(403);
            throw new Error('You are not authorized to view reports for this event.');
        }
        const registrations = await Registration.find({ 
            event: req.params.eventId,
            attendanceStatus: true
        }).populate('participant', 'username email registrationNumber');

        const totalRegistrations = await Registration.countDocuments({ event: req.params.eventId });
        
        res.json({
            count: registrations.length,
            total: totalRegistrations,
            percentage: totalRegistrations > 0
                ? ((registrations.length / totalRegistrations) * 100).toFixed(2)
                : '0.00',
            attendees: registrations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get full attendance records for an event
// @route   GET /api/attendance/records/:eventId
// @access  Private/Staff
exports.getAttendanceRecords = async (req, res, next) => {
    try {
        const authorized = await isAuthorizedForEvent(req.user, req.params.eventId);
        if (!authorized) {
            res.status(403);
            throw new Error('You are not authorized to view records for this event.');
        }
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('participant', 'username email registrationNumber phone gender yearAndDept section')
            .populate('team', 'name')
            .populate('markedBy', 'username')
            .sort({ attendanceStatus: -1, createdAt: 1 });

        const attended = registrations.filter(r => r.attendanceStatus).length;

        res.json({
            event: { 
                _id: event._id, 
                title: event.title, 
                eventDate: event.eventDate, 
                venue: event.venue,
                startTime: event.startTime,
                endTime: event.endTime
            },
            summary: {
                total: registrations.length,
                attended,
                absent: registrations.length - attended,
                percentage: registrations.length > 0
                    ? ((attended / registrations.length) * 100).toFixed(1)
                    : '0.0'
            },
            records: registrations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export attendance report to Excel
// @route   GET /api/attendance/export/:eventId
// @access  Private/Staff
exports.exportReport = async (req, res, next) => {
    try {
        const authorized = await isAuthorizedForEvent(req.user, req.params.eventId);
        if (!authorized) {
            res.status(403);
            throw new Error('You are not authorized to export report for this event.');
        }
        const event = await Event.findById(req.params.eventId);
        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('participant', 'username email registrationNumber');

        const buffer = await generateExcelReport(registrations, event.title);

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename=Report_${event.title.replace(/\s/g, '_')}.xlsx`,
            'Content-Length': buffer.byteLength
        });

        res.send(Buffer.from(buffer));
    } catch (error) {
        next(error);
    }
};

// @desc    Export attendance report to PDF
// @route   POST /api/attendance/export/pdf/:eventId
// @access  Private/Staff
exports.exportPDFReport = async (req, res, next) => {
    try {
        const authorized = await isAuthorizedForEvent(req.user, req.params.eventId);
        if (!authorized) {
            res.status(403);
            throw new Error('You are not authorized to export PDF report for this event.');
        }
        const { header, columns, symposiumName, symposiumType } = req.body;
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }
        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('participant', 'username email registrationNumber yearAndDept section department')
            .populate('team');

        const pdfHeader = header || `${event.title} - Attendance Sheet`;
        const buffer = await generatePDFReport(registrations, event, { header: pdfHeader, columns, symposiumName, symposiumType });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Report_${event.title.replace(/\s/g, '_')}.pdf`,
            'Content-Length': buffer.byteLength
        });

        res.send(buffer);
    } catch (error) {
        next(error);
    }
};
