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

    // ── Birthday Wishes ── runs every day at 12:00 AM (midnight) IST ─────────────
    // Cron expression '0 0 * * *' with timezone 'Asia/Kolkata' fires at exactly
    // midnight IST (00:00 IST = 18:30 UTC previous day).
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('[Cron] Running birthday wishes job at midnight IST...');
            const emailService = require('../services/emailService');

            // Determine today's date in IST correctly.
            // Because this cron runs with timezone: 'Asia/Kolkata', `new Date()` inside
            // the callback is still UTC — we must derive the IST calendar date from UTC.
            const nowUTC = new Date();
            // IST = UTC + 5h 30m
            const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
            const nowIST = new Date(nowUTC.getTime() + istOffsetMs);
            // Use UTC accessors on the IST-shifted date to get the correct IST calendar values
            const todayMonth = nowIST.getUTCMonth(); // 0-based
            const todayDay   = nowIST.getUTCDate();

            console.log(`[Cron] Checking birthdays for IST date: month=${todayMonth + 1}, day=${todayDay}`);

            // Find all users that have a dateOfBirth stored
            const allUsers = await User.find({
                dateOfBirth: { $exists: true, $ne: null },
                email:       { $exists: true, $ne: null }
            }).select('username email dateOfBirth role');

            // Filter users whose birthday (month+day) matches today in IST.
            // DOBs are stored as UTC midnight (e.g. 2002-05-14T00:00:00.000Z).
            // We compare only month & day — year is irrelevant.
            const birthdayUsers = allUsers.filter(u => {
                if (!u.dateOfBirth || !u.email) return false;
                const dob = new Date(u.dateOfBirth);
                // Shift the stored UTC-midnight DOB by IST offset so we get the
                // calendar date the user actually entered (avoids off-by-one on DOBs
                // near midnight UTC caused by timezone differences).
                const dobIST = new Date(dob.getTime() + istOffsetMs);
                return dobIST.getUTCMonth() === todayMonth && dobIST.getUTCDate() === todayDay;
            });

            // Deduplicate by email (safety check)
            const uniqueMap = new Map();
            birthdayUsers.forEach(u => {
                if (u.email && !uniqueMap.has(u.email.toLowerCase())) {
                    uniqueMap.set(u.email.toLowerCase(), u);
                }
            });
            const dedupedUsers = [...uniqueMap.values()];

            if (dedupedUsers.length === 0) {
                console.log('[Cron] No birthdays today.');
                return;
            }

            // Log a role breakdown so it's clear ALL roles are included
            const roleBreakdown = dedupedUsers.reduce((acc, u) => {
                const role = u.role || 'Unknown';
                acc[role] = (acc[role] || 0) + 1;
                return acc;
            }, {});
            console.log(`[Cron] 🎂 ${dedupedUsers.length} birthday(s) today — roles:`, JSON.stringify(roleBreakdown));


            // Load the BIRTHDAY_WISH template once (must have {{user_name}} placeholder)
            const tmpl = await EmailTemplate.findOne({ trigger: 'BIRTHDAY_WISH', enabled: true });

            // Send personalized email to each birthday user individually so that
            // {{user_name}} is compiled per-recipient.
            let sentCount   = 0;
            let failedCount = 0;

            for (const user of dedupedUsers) {
                const variables = {
                    user_name: user.username,
                    username:  user.username,
                    name:      user.username,
                };

                const subject = tmpl
                    ? emailService.compileTemplate(tmpl.subject, variables)
                    : `🎂 Happy Birthday, ${user.username}! Warm Wishes from DigiFlash Association of CSE`;
                const htmlBody = tmpl
                    ? emailService.compileTemplate(tmpl.body, variables)
                    : `<p>Dear <strong>${user.username}</strong>,</p><p>Wishing you a very Happy Birthday! 🎉</p><p>Regards,<br/>DigiFlash Association of CSE</p>`;

                try {
                    await emailService.sendEmail({
                        to:         user.email,
                        subject,
                        body:       htmlBody,
                        type:       'Automatic',
                        templateId: tmpl ? tmpl._id : null,
                    });
                    sentCount++;
                    console.log(`[Cron] 🎂 Birthday wish sent to ${user.username} <${user.email}>`);
                } catch (err) {
                    failedCount++;
                    console.error(`[Cron] ❌ Failed to send birthday wish to ${user.email}:`, err.message);
                }

                // Throttle: 300 ms between sends to respect Brevo API rate limits
                await new Promise(res => setTimeout(res, 300));
            }

            console.log(`[Cron] Birthday wishes complete — sent: ${sentCount}, failed: ${failedCount}`);
        } catch (error) {
            console.error('[Cron] Error in birthday wishes cron job:', error);
        }
    }, {
        scheduled: true,
        timezone: 'Asia/Kolkata'   // node-cron interprets the schedule in this timezone
    });

};

module.exports = startCronJobs;
