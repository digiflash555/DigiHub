const cron = require('node-cron');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const EmailTemplate = require('../models/EmailTemplate');
const User = require('../models/User');

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
    // Run every 15 minutes to check for events starting in exactly 1 hour
    cron.schedule('*/15 * * * *', async () => {
        try {
            const oneHourFromNowMs = Date.now() + 60 * 60 * 1000;
            const nowMs = Date.now();
            
            // Find upcoming events where a reminder hasn't been sent yet
            const upcomingEvents = await Event.find({ 
                status: 'Upcoming', 
                reminderSent: { $ne: true } 
            });

            for (const event of upcomingEvents) {
                if (!event.eventDate || !event.startTime) continue;
                
                const eventStart = new Date(event.eventDate);
                const [hours, minutes] = event.startTime.split(':').map(Number);
                if (isNaN(hours) || isNaN(minutes)) continue;
                
                eventStart.setHours(hours, minutes, 0, 0);
                const timeDiffMs = eventStart.getTime() - nowMs;
                
                // If event starts in less than 60 minutes and hasn't started yet
                if (timeDiffMs > 0 && timeDiffMs <= 60 * 60 * 1000) {
                    console.log(`[Cron] Sending 1-hour reminders for event: ${event.title}`);
                    
                    const registrations = await Registration.find({ 
                        event: event._id, 
                        status: 'Approved' 
                    }).populate('participant', 'email username');

                    const emails = registrations.map(r => r.participant?.email).filter(Boolean);
                    
                    if (emails.length > 0) {
                        const emailService = require('../services/emailService');

                        // Load admin-customizable template from DB
                        const tmpl = await EmailTemplate.findOne({ trigger: 'EVENT_REMINDER', enabled: true });
                        const variables = {
                            event_title: event.title,
                            event_time: event.startTime,
                            event_venue: event.venue,
                        };
                        const subject = tmpl ? emailService.compileTemplate(tmpl.subject, variables) : `Reminder: ${event.title} starts in 1 hour!`;
                        const htmlBody = tmpl ? emailService.compileTemplate(tmpl.body, variables) : `<p>Reminder: <strong>${event.title}</strong> starts at ${event.startTime} in ${event.venue}.</p>`;
                        
                        try {
                            await emailService._sendViaBrevoAPI({
                                to: process.env.SMTP_SENDER_EMAIL || 'noreply@example.com',
                                bcc: emails.join(','),
                                subject,
                                htmlBody
                            });
                            console.log(`[Cron] Sent 1-hour reminders to ${emails.length} participants for ${event.title}.`);
                        } catch (err) {
                            console.error(`[Cron] Failed to send reminders for ${event.title}:`, err.message);
                        }
                    }

                    // Mark as sent so it doesn't trigger again
                    event.reminderSent = true;
                    await event.save();
                }
            }
        } catch (error) {
            console.error('[Cron] Error in reminder cron job:', error);
        }
    });

    // ── Birthday Wishes ── runs every day at 08:00 AM IST ────────────────────────
    cron.schedule('0 8 * * *', async () => {
        try {
            console.log('[Cron] Running birthday wishes job...');
            const emailService = require('../services/emailService');

            const now = new Date();
            // Convert current time to IST to get the correct today's month and day
            const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
            const istDate = new Date(istString);
            
            const todayMonth = istDate.getMonth() + 1; // 1-based
            const todayDay   = istDate.getDate();

            // Find all users whose birth month & day match today
            const birthdayUsers = await User.find({
                dateOfBirth: { $exists: true, $ne: null }
            }).select('username email dateOfBirth');

            const todayBirthdays = birthdayUsers.filter(u => {
                if (!u.dateOfBirth) return false;
                // Convert stored date to IST to match the original intended date
                const dobStr = new Date(u.dateOfBirth).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
                const dobIst = new Date(dobStr);
                
                return (
                    dobIst.getMonth() + 1 === todayMonth &&
                    dobIst.getDate()      === todayDay
                );
            });

            if (todayBirthdays.length === 0) {
                console.log('[Cron] No birthdays today.');
                return;
            }

            console.log(`[Cron] Sending birthday wishes to ${todayBirthdays.length} user(s)...`);

            // Load the BIRTHDAY_WISH template once
            const tmpl = await EmailTemplate.findOne({ trigger: 'BIRTHDAY_WISH', enabled: true });

            for (const user of todayBirthdays) {
                const variables = { user_name: user.username };
                const subject = tmpl
                    ? emailService.compileTemplate(tmpl.subject, variables)
                    : `🎂 Happy Birthday, ${user.username}! Warm Wishes from DigiFlash Association of CSE`;
                const htmlBody = tmpl
                    ? emailService.compileTemplate(tmpl.body, variables)
                    : `<p>Dear <strong>${user.username}</strong>,</p><p>Wishing you a very Happy Birthday! 🎉</p><p>Regards,<br/>DigiFlash Association of CSE</p>`;

                try {
                    await emailService._sendViaBrevoAPI({
                        to:      user.email,
                        subject,
                        htmlBody
                    });
                    console.log(`[Cron] 🎂 Birthday wish sent to ${user.username} <${user.email}>`);
                } catch (err) {
                    console.error(`[Cron] Failed to send birthday wish to ${user.email}:`, err.message);
                }
            }
        } catch (error) {
            console.error('[Cron] Error in birthday wishes cron job:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
};

module.exports = startCronJobs;
