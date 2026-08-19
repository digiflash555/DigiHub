const cron = require('node-cron');
const ScheduledEmail = require('../models/ScheduledEmail');
const emailService = require('../services/emailService');

const initEmailJobs = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            // Find scheduled emails that are due and still in 'Scheduled' state
            const emailsToProcess = await ScheduledEmail.find({
                scheduledDate: { $lte: now },
                status: 'Scheduled'
            });

            for (const email of emailsToProcess) {
                // Mark as processing
                email.status = 'Processing';
                await email.save();

                try {
                    // Start bulk send asynchronously
                    // For massive lists, this might take time, but the loop continues to process other jobs
                    emailService.processBulkEmail(
                        email.individualRecipients.concat(email.bcc), // Assuming we stored all target emails in individualRecipients or BCC
                        email.subject,
                        email.body,
                        email.attachments,
                        email.recipientGroups
                    ).then(async (result) => {
                        email.status = 'Completed';
                        await email.save();
                        console.log(`Scheduled email ${email._id} completed. Sent: ${result.sentCount}, Failed: ${result.failedCount}`);
                    }).catch(async (err) => {
                        email.status = 'Failed';
                        await email.save();
                        console.error(`Scheduled email ${email._id} failed:`, err.message);
                    });
                } catch (err) {
                    email.status = 'Failed';
                    await email.save();
                }
            }
        } catch (error) {
            console.error('Error processing scheduled emails:', error.message);
        }
    });

    console.log('Email scheduling jobs initialized.');
};

module.exports = initEmailJobs;
