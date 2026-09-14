const https = require('https');
const EmailLog = require('../models/EmailLog');
const EmailTemplate = require('../models/EmailTemplate');
const User = require('../models/User');
const Event = require('../models/Event');

class EmailService {
    /**
     * Send email via Brevo's Transactional Email HTTP API (port 443).
     * Works on Render (which blocks SMTP port 587).
     */
    async _sendViaBrevoAPI({ to, cc, bcc, subject, htmlBody }) {
        const apiKey = process.env.BREVO_API_KEY || process.env.SMTP_PASSWORD;
        const senderEmail = process.env.SMTP_SENDER_EMAIL;
        const senderName = process.env.SMTP_SENDER_NAME || 'DigiHub';

        if (!apiKey) throw new Error('BREVO_API_KEY is not configured in .env.');
        if (!senderEmail) throw new Error('SMTP_SENDER_EMAIL is not configured in .env.');

        // Helper to normalise address inputs into Brevo's [{email, name}] format
        const toAddressArray = (val) => {
            if (!val) return [];
            const emails = Array.isArray(val) ? val : val.split(',').map(e => e.trim());
            return emails.filter(Boolean).map(email => ({ email }));
        };

        const ccArr  = toAddressArray(cc);
        const bccArr = toAddressArray(bcc);

        const payload = JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to:     toAddressArray(to).length > 0 ? toAddressArray(to) : [{ email: senderEmail }], // Brevo requires at least one "to"
            ...(ccArr.length  > 0 && { cc:  ccArr }),
            ...(bccArr.length > 0 && { bcc: bccArr }),
            subject,
            htmlContent: htmlBody,
        });

        return new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'api.brevo.com',
                path:     '/v3/smtp/email',
                method:   'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'api-key':       apiKey,
                    'Content-Length': Buffer.byteLength(payload),
                },
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
                    }
                });
            });
            req.on('error', reject);
            req.setTimeout(15000, () => { req.destroy(); reject(new Error('Brevo API request timed out')); });
            req.write(payload);
            req.end();
        });
    }

    /** Replace {{key}} placeholders in a string with values from an object */
    compileTemplate(html, variables) {
        let compiled = html;
        for (const [key, value] of Object.entries(variables)) {
            compiled = compiled.replace(new RegExp(`{{${key}}}`, 'g'), value ?? '');
        }
        return compiled;
    }

    /** Persist an email log entry (non-blocking, errors are swallowed) */
    async logEmail(logData) {
        try {
            await EmailLog.create(logData);
        } catch (err) {
            console.error('[EmailService] Failed to log email:', err.message);
        }
    }

    /**
     * Core send method.
     * `to`, `cc`, `bcc` can each be a string or an array of strings.
     */
    async sendEmail({ to, cc, bcc, subject, body, attachments, type, templateId, eventId, userId, recipientGroups = [] }) {
        const senderInfo = `"${process.env.SMTP_SENDER_NAME || 'DigiHub'}" <${process.env.SMTP_SENDER_EMAIL}>`;

        const countEmails = (val) => {
            if (!val) return 0;
            if (Array.isArray(val)) return val.filter(Boolean).length;
            return val.split(',').filter(Boolean).length;
        };
        const recipientCount = countEmails(to) + countEmails(cc) + countEmails(bcc);

        try {
            await this._sendViaBrevoAPI({ to, cc, bcc, subject, htmlBody: body });

            await this.logEmail({
                sender:         senderInfo,
                recipientCount,
                recipients:     (Array.isArray(to) ? to : to ? [to] : []).slice(0, 50),
                recipientGroups,
                cc:             (Array.isArray(cc)  ? cc  : cc  ? [cc]  : []).slice(0, 50),
                bcc:            (Array.isArray(bcc) ? bcc : bcc ? [bcc] : []).slice(0, 50),
                subject,
                body,
                emailType:      type,
                templateId,
                status:         'Sent',
                eventId,
                userId,
            });

            return { success: true };
        } catch (error) {
            await this.logEmail({
                sender:         senderInfo,
                recipientCount,
                recipients:     (Array.isArray(to) ? to : to ? [to] : []).slice(0, 50),
                recipientGroups,
                cc:             (Array.isArray(cc)  ? cc  : cc  ? [cc]  : []).slice(0, 50),
                bcc:            (Array.isArray(bcc) ? bcc : bcc ? [bcc] : []).slice(0, 50),
                subject,
                body,
                emailType:      type,
                templateId,
                status:         'Failed',
                failureReason:  error.message,
                eventId,
                userId,
            });
            throw error;
        }
    }

    /**
     * Fire an automatic email template by its trigger key.
     * Silently skips if the template is disabled or not found.
     */
    async triggerAutomaticEmail(triggerName, variables = {}, toEmail = null, eventId = null, userId = null) {
        try {
            let template;

            // Try to find an event-specific override first
            if (eventId) {
                template = await EmailTemplate.findOne({ trigger: triggerName, eventId, enabled: true });
            }

            // Fallback to global template
            if (!template) {
                template = await EmailTemplate.findOne({ trigger: triggerName, eventId: null, enabled: true });
            }

            if (!template) {
                console.log(`[EmailService] Trigger [${triggerName}] skipped — disabled or not found.`);
                return;
            }

            const subject = this.compileTemplate(template.subject, variables);
            const body    = this.compileTemplate(template.body, variables);

            if (toEmail) {
                // Fire-and-forget so it never blocks the HTTP response
                this.sendEmail({
                    to:         toEmail,
                    subject,
                    body,
                    type:       'Automatic',
                    templateId: template._id,
                    eventId,
                    userId,
                }).catch(err => console.error(`[EmailService] Auto-email error [${triggerName}]:`, err.message));
            }
        } catch (err) {
            console.error(`[EmailService] triggerAutomaticEmail error [${triggerName}]:`, err.message);
        }
    }

    /**
     * Send to a large list of recipients in BCC batches of 50 or individually if templates contain variables.
     * Returns { sentCount, failedCount }.
     */
    async processBulkEmail(recipients, subject, body, attachments, recipientGroups, eventId = null) {
        const hasVariables = (subject + body).includes('{{');

        if (hasVariables) {
            let event = null;
            if (eventId) {
                try {
                    event = await Event.findById(eventId);
                } catch (err) {
                    console.error('[EmailService] Failed to load event for variables:', err.message);
                }
            }

            // Look up all recipient users by email
            let userMap = new Map();
            try {
                const users = await User.find({ email: { $in: recipients } }).select('email username');
                users.forEach(u => {
                    if (u.email) userMap.set(u.email.toLowerCase(), u.username);
                });
            } catch (err) {
                console.error('[EmailService] Error fetching recipient details:', err.message);
            }

            let sentCount   = 0;
            let failedCount = 0;

            for (const email of recipients) {
                const username = userMap.get(email.toLowerCase()) || email.split('@')[0];
                const variables = {
                    name: username,
                    username: username,
                    email: email,
                    eventTitle: event?.title || '',
                    eventDate: event?.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '',
                    venue: event?.venue || '',
                    category: event?.category || '',
                };

                const compiledSubject = this.compileTemplate(subject, variables);
                const compiledBody    = this.compileTemplate(body, variables);

                try {
                    await this.sendEmail({
                        to:             email,
                        subject:        compiledSubject,
                        body:           compiledBody,
                        attachments,
                        type:           'Manual',
                        recipientGroups,
                        eventId,
                    });
                    sentCount++;
                } catch (err) {
                    failedCount++;
                    console.error(`[EmailService] Personalized email to ${email} failed:`, err.message);
                }

                // Small throttle to avoid hitting Brevo API burst limits
                await new Promise(res => setTimeout(res, 150));
            }

            return { sentCount, failedCount };
        }

        // Fast BCC batching if no {{ variables exist
        const BATCH_SIZE = 50;
        const DELAY_MS   = 1000; // 1 s between batches — respects Brevo rate limits

        let sentCount   = 0;
        let failedCount = 0;

        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
            const batch = recipients.slice(i, i + BATCH_SIZE);
            try {
                await this.sendEmail({
                    to:             '',   // BCC-only: Brevo API uses sender as "to" internally
                    bcc:            batch,
                    subject,
                    body,
                    attachments,
                    type:           'Manual',
                    recipientGroups,
                    eventId,
                });
                sentCount += batch.length;
            } catch (err) {
                failedCount += batch.length;
                console.error('[EmailService] Batch failed:', err.message);
            }

            // Throttle — don't wait after the last batch
            if (i + BATCH_SIZE < recipients.length) {
                await new Promise(res => setTimeout(res, DELAY_MS));
            }
        }

        return { sentCount, failedCount };
    }
}

module.exports = new EmailService();
