const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');
const EmailTemplate = require('../models/EmailTemplate');

class EmailService {
    /**
     * Build a Nodemailer transporter from environment variables.
     * No DB lookup needed — config lives in .env (Brevo SMTP).
     */
    getTransporter() {
        const host     = process.env.SMTP_HOST;
        const port     = parseInt(process.env.SMTP_PORT) || 587;
        const user     = process.env.SMTP_USERNAME;
        const pass     = process.env.SMTP_PASSWORD;
        const enc      = (process.env.SMTP_ENCRYPTION || 'TLS').toUpperCase();

        if (!host || !user || !pass) {
            throw new Error('SMTP credentials are not configured in .env (SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD).');
        }

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: enc === 'SSL', // true only for port 465 / SSL
            auth: { user, pass },
        });

        const senderInfo = `"${process.env.SMTP_SENDER_NAME || 'Event Management System'}" <${process.env.SMTP_SENDER_EMAIL || user}>`;
        return { transporter, senderInfo };
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
        const { transporter, senderInfo } = this.getTransporter();

        const normalise = (val) =>
            Array.isArray(val) ? val.join(', ') : (val || undefined);

        const mailOptions = {
            from:        senderInfo,
            to:          normalise(to),
            cc:          normalise(cc),
            bcc:         normalise(bcc),
            subject,
            html:        body,
            attachments,
        };

        const countEmails = (val) => {
            if (!val) return 0;
            if (Array.isArray(val)) return val.length;
            return val.split(',').filter(Boolean).length;
        };
        const recipientCount = countEmails(to) + countEmails(cc) + countEmails(bcc);

        try {
            const info = await transporter.sendMail(mailOptions);

            await this.logEmail({
                sender:         senderInfo,
                recipientCount,
                recipients:     (Array.isArray(to) ? to : [to]).slice(0, 50),
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

            return { success: true, messageId: info.messageId };
        } catch (error) {
            await this.logEmail({
                sender:         senderInfo,
                recipientCount,
                recipients:     (Array.isArray(to) ? to : [to]).slice(0, 50),
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
     * Send to a large list of recipients in BCC batches of 50.
     * Returns { sentCount, failedCount }.
     */
    async processBulkEmail(recipients, subject, body, attachments, recipientGroups) {
        const BATCH_SIZE = 50;
        const DELAY_MS   = 1000;   // 1 s between batches — respects Brevo rate limits

        let sentCount   = 0;
        let failedCount = 0;

        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
            const batch = recipients.slice(i, i + BATCH_SIZE);
            try {
                await this.sendEmail({
                    to:             '',
                    bcc:            batch,
                    subject,
                    body,
                    attachments,
                    type:           'Manual',
                    recipientGroups,
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
