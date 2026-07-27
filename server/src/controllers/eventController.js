const Event = require('../models/Event');
const { createCloudinaryUpload } = require('../utils/cloudinaryUpload');

const autoUpdateStatuses = async () => {
    try {
        const events = await Event.find({ status: { $in: ['Open', 'Closed'] } });
        const now = new Date();
        for (let event of events) {
            if (!event.eventDate || !event.endTime) continue;
            
            const year = event.eventDate.getUTCFullYear();
            const month = event.eventDate.getUTCMonth();
            const date = event.eventDate.getUTCDate();
            
            const [hours, minutes] = event.endTime.split(':').map(Number);
            const endDateTime = new Date(year, month, date, hours, minutes, 0, 0);
            
            let newStatus = event.status;
            if (now > endDateTime) {
                newStatus = 'Completed';
            } else if (event.registrationDeadline && now > new Date(event.registrationDeadline) && event.status === 'Open') {
                newStatus = 'Closed';
            }

            if (newStatus !== event.status) {
                await Event.findByIdAndUpdate(event._id, { status: newStatus });
            }
        }
    } catch (err) {
        console.error('Status auto-update failed:', err);
    }
};

// Event banner upload — stored in Cloudinary under event_management/banners
const upload = createCloudinaryUpload('banners', ['jpeg', 'jpg', 'png', 'gif', 'webp'], 1, 'event-banner-');

// @desc    Create new event
// @route   POST /api/events
// @access  Private/Admin
exports.createEvent = async (req, res, next) => {
    try {
        const body = req.body;
        // If banner image was uploaded, save the Cloudinary URL
        if (req.file) {
            body.bannerImage = req.file.path;
        }
        // Parse registrationForm if it's a string
        if (body.registrationForm && typeof body.registrationForm === 'string') {
            body.registrationForm = JSON.parse(body.registrationForm);
        }
        // Parse feedbackForm if it's a string
        if (body.feedbackForm && typeof body.feedbackForm === 'string') {
            body.feedbackForm = JSON.parse(body.feedbackForm);
        }
        // Auto-publish when status is set to Open
        if (body.status === 'Open') {
            body.isPublished = true;
        }
        const eventData = { ...body, createdBy: req.user._id };
        const event = await Event.create(eventData);
        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
    try {
        await autoUpdateStatuses();
        const { status, category, participationType } = req.query;
        let query = {};

        if (status) query.status = status;
        if (category) query.category = category;
        if (participationType) query.participationType = participationType;

        // Non-admin: show all non-Draft events (Open, Closed, Completed)
        // Admin: show everything including Draft
        if (!req.user || req.user.role !== 'Admin') {
            query.status = { $in: ['Open', 'Closed', 'Completed'] };
            // If user also filtered by status, keep that filter but restrict to visible statuses
            if (status && ['Open', 'Closed', 'Completed'].includes(status)) {
                query.status = status;
            }
        }

        if (req.user && ['Faculty', 'Class Coordinator', 'Program Coordinator'].includes(req.user.role)) {
            query.$or = [
                { facultyCoordinator: req.user._id },
                { studentCoordinator: req.user._id }
            ];
        }

        const events = await Event.find(query)
            .populate('facultyCoordinator', 'username email phone')
            .populate('studentCoordinator', 'username email phone')
            .sort({ eventDate: -1 });
        res.json(events);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res, next) => {
    try {
        await autoUpdateStatuses();
        const event = await Event.findById(req.params.id)
            .populate('facultyCoordinator', 'username email phone')
            .populate('studentCoordinator', 'username email phone');
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }
        res.json(event);
    } catch (error) {
        next(error);
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
exports.updateEvent = async (req, res, next) => {
    try {
        let event = await Event.findById(req.params.id);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        const updateData = req.body;
        // If banner image was uploaded, save the Cloudinary URL
        if (req.file) {
            updateData.bannerImage = req.file.path;
        }
        // Parse registrationForm if it's a string
        if (updateData.registrationForm && typeof updateData.registrationForm === 'string') {
            updateData.registrationForm = JSON.parse(updateData.registrationForm);
        }
        // Parse feedbackForm if it's a string
        if (updateData.feedbackForm && typeof updateData.feedbackForm === 'string') {
            updateData.feedbackForm = JSON.parse(updateData.feedbackForm);
        }
        if (updateData.status === 'Open') updateData.isPublished = true;
        if (updateData.status === 'Draft') updateData.isPublished = false;

        event = await Event.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        res.json(event);
    } catch (error) {
        next(error);
    }
};

// Export upload middleware for use in routes
exports.upload = upload;

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
exports.deleteEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }
        
        await event.deleteOne();
        res.json({ message: 'Event removed' });
    } catch (error) {
        next(error);
    }
};

const Registration = require('../models/Registration');

exports.getEventStats = async (req, res, next) => {
    try {
        await autoUpdateStatuses();
        const totalEvents = await Event.countDocuments();
        const totalRegistrations = await Registration.countDocuments();
        const totalAttendees = await Registration.countDocuments({ attendanceStatus: true });

        res.json({
            totalEvents,
            totalRegistrations,
            totalAttendees
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get public statistics for home page
// @route   GET /api/events/public-stats
// @access  Public
exports.getPublicStats = async (req, res, next) => {
    try {
        await autoUpdateStatuses();
        const totalEvents = await Event.countDocuments({ status: { $ne: 'Draft' } });
        const totalRegistrations = await Registration.countDocuments();
        
        // We can add a bit of padding to make it look "massive" as requested by the UI design
        res.json({
            totalEvents: totalEvents + 10, 
            totalRegistrations: totalRegistrations + 500,
            totalAttendees: totalRegistrations + 450
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Publish/Unpublish event results
// @route   PUT /api/events/:id/publish-results
// @access  Private/Admin
exports.publishResults = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        event.resultsPublished = !event.resultsPublished;
        await event.save();

        res.json({
            message: event.resultsPublished ? 'Results published' : 'Results unpublished',
            resultsPublished: event.resultsPublished
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get events where the current user is assigned as coordinator (incharge)
// @route   GET /api/events/my-incharge
// @access  Private
exports.getMyInchargeEvents = async (req, res, next) => {
    try {
        await autoUpdateStatuses();
        const userId = req.user._id;
        const events = await Event.find({
            $or: [
                { facultyCoordinator: userId },
                { studentCoordinator: userId }
            ]
        })
            .populate('facultyCoordinator', 'username email phone')
            .populate('studentCoordinator', 'username email phone')
            .sort({ eventDate: -1 });
        res.json(events);
    } catch (error) {
        next(error);
    }
};

const RegistrationTemplate = require('../models/RegistrationTemplate');

// @desc    Import registration template into an event
// @route   POST /api/events/:eventId/import-template
// @access  Private/Admin/Coordinators
exports.importTemplate = async (req, res, next) => {
    try {
        const { templateId } = req.body;
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        const template = await RegistrationTemplate.findById(templateId);
        if (!template) {
            res.status(404);
            throw new Error('Template not found');
        }

        // Copy template fields directly
        event.registrationForm = template.fields.map(f => {
            const fieldObj = f.toObject ? f.toObject() : { ...f };
            delete fieldObj._id;
            return fieldObj;
        });

        await event.save();
        
        console.log(`[AUDIT LOG] [${new Date().toISOString()}] User: ${req.user.username} (${req.user.role}) - Action: IMPORT_TEMPLATE - Event ID: ${event._id} - Template ID: ${templateId}`);

        res.json(event);
    } catch (error) {
        next(error);
    }
};

// @desc    Save current event registration form as a new template
// @route   POST /api/events/:eventId/save-template
// @access  Private/Admin/Coordinators
exports.saveAsTemplate = async (req, res, next) => {
    try {
        const { templateName, description, category } = req.body;
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        if (!templateName) {
            res.status(400);
            throw new Error('Template name is required');
        }

        const fields = event.registrationForm.map(f => {
            const fieldObj = f.toObject ? f.toObject() : { ...f };
            delete fieldObj._id;
            return fieldObj;
        });

        const template = new RegistrationTemplate({
            templateName,
            description,
            category: category || 'Workshop',
            fields,
            createdBy: req.user._id
        });

        await template.save();

        console.log(`[AUDIT LOG] [${new Date().toISOString()}] User: ${req.user.username} (${req.user.role}) - Action: SAVE_EVENT_AS_TEMPLATE - Event ID: ${event._id} - Template ID: ${template._id}`);

        res.status(201).json(template);
    } catch (error) {
        next(error);
    }
};
