const cron = require('node-cron');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// Run every hour to check for events that completed 24+ hours ago
// and delete the event pass (QR code) for their registrations.
const startCronJobs = () => {
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('Running cron job: Cleaning up event passes (QR codes) for past events...');
            
            // 24 hours ago
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            // Find events that happened more than 24 hours ago
            // We use eventDate as the anchor point
            const pastEvents = await Event.find({ eventDate: { $lt: twentyFourHoursAgo } }).select('_id');
            const pastEventIds = pastEvents.map(e => e._id);
            
            if (pastEventIds.length > 0) {
                // Remove QR code (event pass) from registrations of these events
                // where qrCode is not already null
                const result = await Registration.updateMany(
                    { event: { $in: pastEventIds }, qrCode: { $ne: null } },
                    { $set: { qrCode: null } }
                );
                
                if (result.modifiedCount > 0) {
                    console.log(`Cleaned up event passes for ${result.modifiedCount} registrations across ${pastEventIds.length} old events.`);
                }
            }
        } catch (error) {
            console.error('Error in cleanup cron job:', error);
        }
    });
};

module.exports = startCronJobs;
