const EmailTemplate = require('../models/EmailTemplate');

const DEFAULT_TEMPLATES = [
    {
        name: 'User Registration',
        trigger: 'USER_REGISTRATION',
        subject: 'Welcome to Event Management System',
        body: '<p>Dear {{user_name}},</p><p>Welcome to our Event Management System! Your account has been successfully created.</p><p>Regards,<br/>Admin Team</p>',
        recipientType: 'User',
        availableVariables: ['user_name', 'email']
    },
    {
        name: 'New Event Creation',
        trigger: 'EVENT_CREATION',
        subject: 'New Event Announced: {{event_title}}',
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;"><h2 style="color: #2c3e50; text-align: center;">{{event_title}}</h2><p style="color: #555; line-height: 1.6;">{{event_description}}</p><hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"><ul style="list-style: none; padding: 0; color: #333;"><li style="margin-bottom: 10px;"><strong>📅 Date:</strong> {{event_date}}</li><li style="margin-bottom: 10px;"><strong>⏰ Time:</strong> {{event_start_time}} - {{event_end_time}}</li><li style="margin-bottom: 10px;"><strong>📍 Venue:</strong> {{event_venue}}</li></ul><div style="text-align: center; margin-top: 30px;"><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/events" style="background-color: #3498db; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Register Now</a></div></div>`,
        recipientType: 'Participant',
        availableVariables: ['event_title', 'event_description', 'event_venue', 'event_date', 'event_start_time', 'event_end_time']
    },
    {
        name: 'Event Registration Confirmation',
        trigger: 'EVENT_REGISTRATION',
        subject: 'Registration Confirmed: {{event_name}}',
        body: '<p>Dear {{participant_name}},</p><p>Your registration for <strong>{{event_name}}</strong> has been confirmed.</p><p>Event Date: {{event_date}}<br/>Event Time: {{event_time}}<br/>Venue: {{event_venue}}</p><p>Registration ID: {{registration_id}}</p><p>Regards,<br/>{{organization_name}}</p>',
        recipientType: 'Participant',
        availableVariables: ['participant_name', 'event_name', 'event_date', 'event_time', 'event_venue', 'registration_id', 'organization_name']
    },
    {
        name: 'Registration Cancellation',
        trigger: 'REGISTRATION_CANCELLATION',
        subject: 'Registration Cancelled: {{event_name}}',
        body: '<p>Dear {{participant_name}},</p><p>Your registration for <strong>{{event_name}}</strong> has been cancelled.</p><p>Regards,<br/>Admin Team</p>',
        recipientType: 'Participant',
        availableVariables: ['participant_name', 'event_name']
    },
    {
        name: 'Event Cancellation',
        trigger: 'EVENT_CANCELLATION',
        subject: 'URGENT: {{event_name}} Cancelled',
        body: '<p>Dear {{participant_name}},</p><p>We regret to inform you that <strong>{{event_name}}</strong> scheduled for {{event_date}} has been cancelled.</p><p>Regards,<br/>Admin Team</p>',
        recipientType: 'Participant',
        availableVariables: ['participant_name', 'event_name', 'event_date']
    },
    {
        name: 'Volunteer Assignment',
        trigger: 'VOLUNTEER_ASSIGNMENT',
        subject: 'Volunteer Duty: {{event_name}}',
        body: '<p>Dear {{volunteer_name}},</p><p>You have been assigned to volunteer for <strong>{{event_name}}</strong>.</p><p>Duty: {{volunteer_duty}}<br/>Reporting Time: {{reporting_time}}<br/>Date: {{event_date}}<br/>Venue: {{event_venue}}</p><p>Regards,<br/>Event Coordinator</p>',
        recipientType: 'Volunteer',
        availableVariables: ['volunteer_name', 'event_name', 'volunteer_duty', 'reporting_time', 'event_date', 'event_venue']
    },
    {
        name: 'Certificate Availability',
        trigger: 'CERTIFICATE_AVAILABLE',
        subject: 'Certificate Ready: {{event_name}}',
        body: '<p>Dear {{participant_name}},</p><p>Your certificate for <strong>{{event_name}}</strong> is now available.</p><p>You can download it using this link: <a href="{{certificate_link}}">Download Certificate</a></p><p>Regards,<br/>Admin Team</p>',
        recipientType: 'Participant',
        availableVariables: ['participant_name', 'event_name', 'certificate_link']
    },
    {
        name: 'Feedback Request',
        trigger: 'FEEDBACK_REQUEST',
        subject: 'How was {{event_name}}?',
        body: '<p>Dear {{participant_name}},</p><p>Thank you for attending <strong>{{event_name}}</strong>.</p><p>Please share your thoughts by filling out the feedback form: <a href="{{feedback_link}}">Feedback Form</a></p><p>Regards,<br/>Admin Team</p>',
        recipientType: 'Participant',
        availableVariables: ['participant_name', 'event_name', 'feedback_link']
    }
];

const seedEmailTemplates = async () => {
    try {
        for (const tmpl of DEFAULT_TEMPLATES) {
            const exists = await EmailTemplate.findOne({ trigger: tmpl.trigger });
            if (!exists) {
                await EmailTemplate.create({ ...tmpl, isDefault: true });
            }
        }
        console.log('Default Email Templates Seeded.');
    } catch (error) {
        console.error('Failed to seed email templates:', error);
    }
};

module.exports = seedEmailTemplates;
