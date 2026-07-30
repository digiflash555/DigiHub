const Winner = require('../models/Winner');
const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Publish event winners
// @route   POST /api/winners
// @access  Private/Admin
exports.publishWinners = async (req, res, next) => {
    try {
        const { eventId, winners } = req.body; // winners is an array of objects

        // Clear existing winners for this event if any
        await Winner.deleteMany({ event: eventId });

        const winnerDocs = winners.map(w => ({
            event: eventId,
            participant: w.participantId,
            team: w.teamId,
            position: w.position,
            prize: w.prize,
            publishedBy: req.user._id
        }));

        const result = await Winner.insertMany(winnerDocs);
        
        // Update event status
        await Event.findByIdAndUpdate(eventId, { resultsPublished: true });

        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getWinnersByEvent = async (req, res, next) => {
    try {
        const winners = await Winner.find({ event: req.params.eventId })
            .populate('participant', 'username registrationNumber yearAndDept section profileImage')
            .populate('team', 'name');
        res.json(winners);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all winners
// @route   GET /api/winners
// @access  Public
exports.getAllWinners = async (req, res, next) => {
    try {
        const winners = await Winner.find()
            .populate('event', 'title category eventDate venue')
            .populate('participant', 'username registrationNumber yearAndDept section profileImage')
            .sort({ createdAt: -1 });
        res.json(winners);
    } catch (error) {
        next(error);
    }
};

// @desc    Create a single winner
// @route   POST /api/winners/single
// @access  Private/Admin
exports.createWinner = async (req, res, next) => {
    try {
        const { event, participant, position, prize } = req.body;

        const winner = await Winner.create({
            event,
            participant,
            position,
            prize,
            publishedBy: req.user._id
        });

        // Update event status to publish results
        await Event.findByIdAndUpdate(event, { resultsPublished: true });

        res.status(201).json(winner);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a winner
// @route   DELETE /api/winners/:id
// @access  Private/Admin
exports.deleteWinner = async (req, res, next) => {
    try {
        const winner = await Winner.findById(req.params.id);
        if (!winner) {
            res.status(404);
            throw new Error('Winner not found');
        }

        await winner.deleteOne();
        res.json({ message: 'Winner removed' });
    } catch (error) {
        next(error);
    }
};
