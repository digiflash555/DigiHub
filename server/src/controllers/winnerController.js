const Winner = require('../models/Winner');
const Event = require('../models/Event');
const User = require('../models/User');
const Team = require('../models/Team');
const EmailService = require('../services/emailService');

// Helper to get winner emails
const getWinnerEmails = async (winner) => {
    let emails = [];
    if (winner.participant) {
        const user = await User.findById(winner.participant);
        if (user && user.email) emails.push(user.email);
    } else if (winner.team) {
        const team = await Team.findById(winner.team).populate('leader members.user');
        if (team) {
            if (team.leader && team.leader.email) emails.push(team.leader.email);
            if (team.members && team.members.length > 0) {
                team.members.forEach(m => {
                    if (m.user && m.user.email && !emails.includes(m.user.email)) {
                        emails.push(m.user.email);
                    }
                });
            }
        }
    }
    return emails;
};

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
            .populate('comments.user', 'username profileImage')
            .populate('comments.replies.user', 'username profileImage')
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

// @desc    Get current user's winnings
// @route   GET /api/winners/my-status
// @access  Private
exports.getMyWinnerStatus = async (req, res, next) => {
    try {
        const winners = await Winner.find({ participant: req.user._id })
            .populate('event', 'title category eventDate venue winnerPhotoUploadLocked');
        res.json(winners);
    } catch (error) {
        next(error);
    }
};

// @desc    Upload winner profile photo
// @route   POST /api/winners/:id/photo
// @access  Private (Winner themselves or Admin)
exports.uploadWinnerPhoto = async (req, res, next) => {
    try {
        const winner = await Winner.findById(req.params.id).populate('event');
        if (!winner) {
            res.status(404);
            throw new Error('Winner record not found');
        }

        // Check ownership or admin
        const isAdmin = req.user.role === 'Admin';
        if (!isAdmin && (!winner.participant || winner.participant.toString() !== req.user._id.toString())) {
            res.status(403);
            throw new Error('Only winners are allowed to upload a profile photo.');
        }

        // Check if locked
        if (!isAdmin && (winner.photoUploadLocked || (winner.event && winner.event.winnerPhotoUploadLocked))) {
            res.status(403);
            throw new Error('Photo uploads for this winner are locked.');
        }

        if (!req.file) {
            res.status(400);
            throw new Error('Please upload an image file');
        }

        // Remove old photo if exists
        if (winner.profilePhoto) {
            await require('../utils/cloudinaryUpload').deleteFromCloudinary(winner.profilePhoto);
        }

        winner.profilePhoto = req.file.path;
        await winner.save();

        res.json(winner);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete winner profile photo
// @route   DELETE /api/winners/:id/photo
// @access  Private/Admin
exports.deleteWinnerPhoto = async (req, res, next) => {
    try {
        const winner = await Winner.findById(req.params.id);
        if (!winner) {
            res.status(404);
            throw new Error('Winner record not found');
        }

        if (winner.profilePhoto) {
            await require('../utils/cloudinaryUpload').deleteFromCloudinary(winner.profilePhoto);
            winner.profilePhoto = undefined;
            await winner.save();
        }

        res.json({ message: 'Winner photo removed' });
    } catch (error) {
        next(error);
    }
};

// @desc    Lock/Unlock photo uploads for all winners in an event
// @route   PATCH /api/winners/event/:eventId/lock-photos
// @access  Private/Admin
exports.lockWinnerPhotos = async (req, res, next) => {
    try {
        const { locked } = req.body;
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }
        event.winnerPhotoUploadLocked = locked;
        await event.save();
        res.json({ message: `Photo uploads ${locked ? 'locked' : 'unlocked'} for event` });
    } catch (error) {
        next(error);
    }
};

// @desc    Lock/Unlock photo upload for a single winner
// @route   PATCH /api/winners/:id/lock-photo
// @access  Private/Admin
exports.lockSingleWinnerPhoto = async (req, res, next) => {
    try {
        const { locked } = req.body;
        const winner = await Winner.findById(req.params.id);
        if (!winner) {
            res.status(404);
            throw new Error('Winner record not found');
        }
        winner.photoUploadLocked = locked;
        await winner.save();
        res.json({ message: `Photo upload ${locked ? 'locked' : 'unlocked'} for winner` });
    } catch (error) {
        next(error);
    }
};

// @desc    Like or Unlike a winner
// @route   POST /api/winners/:id/like
// @access  Private
exports.likeWinner = async (req, res, next) => {
    try {
        const winner = await Winner.findById(req.params.id).populate('event');
        if (!winner) {
            res.status(404);
            throw new Error('Winner not found');
        }

        const userId = req.user._id;
        const index = winner.likes.indexOf(userId);
        
        let liked = false;
        if (index === -1) {
            // Like
            winner.likes.push(userId);
            liked = true;
        } else {
            // Unlike
            winner.likes.splice(index, 1);
        }

        await winner.save();

        // Send email if liked
        if (liked) {
            const emails = await getWinnerEmails(winner);
            if (emails.length > 0) {
                const variables = {
                    liker_name: req.user.username,
                    event_title: winner.event?.title || 'an event'
                };
                emails.forEach(email => {
                    EmailService.triggerAutomaticEmail('WINNER_LIKE', variables, email, winner.event?._id, userId)
                        .catch(err => console.error('Failed to send like notification:', err.message));
                });
            }
        }

        res.json({ likes: winner.likes, liked });
    } catch (error) {
        next(error);
    }
};

// @desc    Comment on a winner
// @route   POST /api/winners/:id/comment
// @access  Private
exports.commentWinner = async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text) {
            res.status(400);
            throw new Error('Comment text is required');
        }

        const winner = await Winner.findById(req.params.id).populate('event');
        if (!winner) {
            res.status(404);
            throw new Error('Winner not found');
        }

        const newComment = {
            user: req.user._id,
            text
        };

        winner.comments.push(newComment);
        await winner.save();

        // Populate the new comment for the response
        await winner.populate('comments.user', 'username profileImage');

        // Send email notification
        const emails = await getWinnerEmails(winner);
        if (emails.length > 0) {
            const variables = {
                commenter_name: req.user.username,
                event_title: winner.event?.title || 'an event',
                comment_text: text
            };
            emails.forEach(email => {
                EmailService.triggerAutomaticEmail('WINNER_COMMENT', variables, email, winner.event?._id, req.user._id)
                    .catch(err => console.error('Failed to send comment notification:', err.message));
            });
        }

        res.json(winner.comments);
    } catch (error) {
        next(error);
    }
};

// @desc    Like or Unlike a specific comment on a winner
// @route   POST /api/winners/:id/comment/:commentId/like
// @access  Private
exports.likeComment = async (req, res, next) => {
    try {
        const winner = await Winner.findById(req.params.id);
        if (!winner) {
            res.status(404);
            throw new Error('Winner not found');
        }

        const comment = winner.comments.id(req.params.commentId);
        if (!comment) {
            res.status(404);
            throw new Error('Comment not found');
        }

        const userId = req.user._id.toString();
        const index = comment.likes.findIndex(id => id.toString() === userId);
        if (index === -1) {
            comment.likes.push(req.user._id);
        } else {
            comment.likes.splice(index, 1);
        }

        await winner.save();
        await winner.populate([
            { path: 'comments.user', select: 'username profileImage' },
            { path: 'comments.replies.user', select: 'username profileImage' }
        ]);
        res.json(winner.comments);
    } catch (error) {
        next(error);
    }
};

// @desc    Reply to a specific comment on a winner
// @route   POST /api/winners/:id/comment/:commentId/reply
// @access  Private
exports.replyToComment = async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text) {
            res.status(400);
            throw new Error('Reply text is required');
        }

        const winner = await Winner.findById(req.params.id);
        if (!winner) {
            res.status(404);
            throw new Error('Winner not found');
        }

        const comment = winner.comments.id(req.params.commentId);
        if (!comment) {
            res.status(404);
            throw new Error('Comment not found');
        }

        comment.replies.push({ user: req.user._id, text });
        await winner.save();

        await winner.populate([
            { path: 'comments.user', select: 'username profileImage' },
            { path: 'comments.replies.user', select: 'username profileImage' }
        ]);
        res.json(winner.comments);
    } catch (error) {
        next(error);
    }
};

// @desc    Like or Unlike a reply inside a comment
// @route   POST /api/winners/:id/comment/:commentId/reply/:replyId/like
// @access  Private
exports.likeReply = async (req, res, next) => {
    try {
        const winner = await Winner.findById(req.params.id);
        if (!winner) { res.status(404); throw new Error('Winner not found'); }

        const comment = winner.comments.id(req.params.commentId);
        if (!comment) { res.status(404); throw new Error('Comment not found'); }

        const reply = comment.replies.id(req.params.replyId);
        if (!reply) { res.status(404); throw new Error('Reply not found'); }

        const userId = req.user._id.toString();
        const index = reply.likes.findIndex(id => id.toString() === userId);
        if (index === -1) {
            reply.likes.push(req.user._id);
        } else {
            reply.likes.splice(index, 1);
        }

        await winner.save();
        await winner.populate([
            { path: 'comments.user', select: 'username profileImage' },
            { path: 'comments.replies.user', select: 'username profileImage' }
        ]);
        res.json(winner.comments);
    } catch (error) {
        next(error);
    }
};
