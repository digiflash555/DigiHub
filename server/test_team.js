const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
const Event = require('./src/models/Event');
const Registration = require('./src/models/Registration');
const Team = require('./src/models/Team');

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:admin@cluster0.lnrqecr.mongodb.net/event_management?retryWrites=true&w=majority')
    .then(async () => {
        try {
            console.log('Testing team registration...');
            const events = await Event.find({ participationType: 'Team' }).limit(1);
            if (!events.length) {
                console.log('No team event found.');
                process.exit(0);
            }
            const event = events[0];
            
            const users = await User.find({ role: 'Participant' }).limit(2);
            if (users.length < 2) {
                console.log('Not enough participants found.');
                process.exit(0);
            }
            
            const leader = users[0];
            const member = users[1];
            
            console.log(`Leader: ${leader.username}, Member: ${member.username}`);
            
            // Check registrations
            const regs = await Registration.find({ event: event._id, participant: { $in: [leader._id, member._id] } });
            console.log('Existing registrations:', regs.length);
            
            process.exit(0);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
