const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
const Event = require('./src/models/Event');
const Registration = require('./src/models/Registration');
const Team = require('./src/models/Team');

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:admin@cluster0.lnrqecr.mongodb.net/event_management?retryWrites=true&w=majority')
    .then(async () => {
        try {
            const events = await Event.find({ participationType: 'Team' }).limit(1);
            if (!events.length) process.exit(0);
            const event = events[0];
            
            const users = await User.find({ role: 'Participant' }).limit(2);
            if (users.length < 2) process.exit(0);
            
            const leader = users[0];
            const member = users[1];
            
            // Delete existing registrations for this event to simulate a clean state
            await Registration.deleteMany({ event: event._id, participant: { $in: [leader._id, member._id] } });
            
            // Simulate req.body
            const eventId = event._id.toString();
            const teamMembers = [member._id.toString()];
            const userId = leader._id.toString();
            const teamName = "Test Team";
            const formData = {};
            const memberFormData = {};
            
            console.log('Inserting team registration...');
            const registrationId = 'TEST-REG-123';
            const qrCodeImage = 'dummy';
            
            const team = await Team.create({
                name: teamName,
                event: eventId,
                leader: userId,
                members: [
                    { user: userId, status: 'Accepted' },
                    ...teamMembers.map(id => ({ user: id, status: 'Accepted' }))
                ],
                isRegistrationComplete: true
            });

            const registrationRecords = [];
            registrationRecords.push({
                event: eventId,
                participant: userId,
                registrationId,
                formData,
                qrCode: qrCodeImage,
                team: team._id
            });

            teamMembers.forEach(memberId => {
                registrationRecords.push({
                    event: eventId,
                    participant: memberId,
                    registrationId,
                    formData: memberFormData[memberId] || formData,
                    qrCode: qrCodeImage,
                    team: team._id
                });
            });

            console.log('Records to insert:', registrationRecords.length);
            const registrations = await Registration.insertMany(registrationRecords);
            console.log('Inserted:', registrations.length);
            
            process.exit(0);
        } catch (e) {
            console.error('Error during insertMany:', e);
            process.exit(1);
        }
    });
