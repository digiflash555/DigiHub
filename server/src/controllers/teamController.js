const Team = require('../models/Team');
const Event = require('../models/Event');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create a team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res, next) => {
    try {
        const { name, eventId } = req.body;
        
        const event = await Event.findById(eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        if (event.participationType !== 'Team') {
            res.status(400);
            throw new Error('This event does not allow team participation');
        }

        const team = await Team.create({
            name,
            event: eventId,
            leader: req.user._id,
            members: [{ user: req.user._id, status: 'Accepted' }]
        });

        res.status(201).json(team);
    } catch (error) {
        next(error);
    }
};

// @desc    Get team details
// @route   GET /api/teams/:id
// @access  Private/Team member
exports.getTeamById = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('leader', 'username email registrationNumber')
            .populate('members.user', 'username email registrationNumber');

        if (!team) {
            res.status(404);
            throw new Error('Team not found');
        }

        const currentUserId = req.user._id.toString();
        const leaderId = (team.leader._id || team.leader).toString();
        const isMember = team.members.some((member) => {
            if (!member.user) return false;
            return (member.user._id || member.user).toString() === currentUserId;
        });

        if (req.user.role !== 'Admin' && leaderId !== currentUserId && !isMember) {
            res.status(403);
            throw new Error('You are not authorized to view this team');
        }

        res.json(team);
    } catch (error) {
        next(error);
    }
};

// @desc    Invite a member to team
// @route   POST /api/teams/:id/invite
// @access  Private/Leader
exports.inviteMember = async (req, res, next) => {
    try {
        const { userId, userIdentifier } = req.body; // id, email, username, or registration number
        const identifier = typeof userIdentifier === 'string' ? userIdentifier.trim() : userIdentifier;
        const team = await Team.findById(req.params.id);

        if (!team) {
            res.status(404);
            throw new Error('Team not found');
        }

        if (team.leader.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Only team leader can invite members');
        }

        if (!userId && !identifier) {
            res.status(400);
            throw new Error('User identifier is required');
        }

        let user;
        if (userId) {
            if (!mongoose.isValidObjectId(userId)) {
                res.status(400);
                throw new Error('Invalid user id');
            }

            user = await User.findById(userId);
        } else {
            user = await User.findOne({
                $or: [
                    { email: identifier },
                    { username: identifier },
                    { registrationNumber: identifier }
                ]
            });
        }

        if (!user) {
            res.status(404);
            throw new Error('User not found on platform');
        }

        // Check if already a member or invited
        const alreadyMember = team.members.find(m => m.user.toString() === user._id.toString());
        if (alreadyMember) {
            res.status(400);
            throw new Error('User is already invited or a member');
        }

        team.members.push({ user: user._id, status: 'Pending' });
        await team.save();

        // TODO: Send notification/email
        
        res.json({ message: 'Invitation sent successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Accept/Reject Invitation
// @route   PUT /api/teams/invitation/:teamId
// @access  Private
exports.handleInvitation = async (req, res, next) => {
    try {
        const { status } = req.body; // 'Accepted' or 'Rejected'
        const team = await Team.findById(req.params.teamId);

        if (!team) {
            res.status(404);
            throw new Error('Team not found');
        }

        const memberIndex = team.members.findIndex(m => m.user.toString() === req.user._id.toString());
        if (memberIndex === -1) {
            res.status(403);
            throw new Error('You are not invited to this team');
        }

        team.members[memberIndex].status = status;
        
        if (status === 'Rejected') {
            team.members.splice(memberIndex, 1);
        }

        await team.save();
        res.json({ message: `Invitation ${status.toLowerCase()} successfully` });
    } catch (error) {
        next(error);
    }
};
