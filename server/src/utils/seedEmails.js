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
    },
    {
        name: 'Event Reminder (1 Hour Before)',
        trigger: 'EVENT_REMINDER',
        subject: 'Reminder: {{event_title}} starts in 1 hour!',
        body: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:16px;">
  <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;border-radius:12px;text-align:center;margin-bottom:24px;">
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:900;">⏰ Event Reminder</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0 0;font-size:14px;">{{event_title}} starts in less than 1 hour!</p>
  </div>
  <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e2e8f0;margin-bottom:16px;">
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 12px 0;">Hi there,</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 12px 0;">This is a quick reminder that <strong>{{event_title}}</strong> is starting very soon. Don't miss it!</p>
    <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;color:#334155;font-size:14px;"><strong>📅 Time:</strong> {{event_time}}</p>
      <p style="margin:4px 0;color:#334155;font-size:14px;"><strong>📍 Venue:</strong> {{event_venue}}</p>
    </div>
    <p style="color:#475569;font-size:14px;line-height:1.7;">Please make sure you arrive on time and have your <strong>QR Event Pass</strong> ready from your dashboard.</p>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px;">DigiHub Events Platform — This is an automated reminder.</p>
</div>`,
        recipientType: 'Participant',
        availableVariables: ['event_title', 'event_time', 'event_venue']
    },
    {
        name: 'User Care — New Ticket Alert (to Association Members)',
        trigger: 'SUPPORT_NEW_TICKET',
        subject: '[User Care] New Ticket: {{ticket_subject}}',
        body: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:16px;">
  <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;border-radius:12px;text-align:center;margin-bottom:24px;">
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:900;">📬 New User Care Ticket</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0 0;font-size:14px;">A user has submitted a new complaint or query.</p>
  </div>
  <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e2e8f0;margin-bottom:16px;">
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 8px 0;"><strong>From:</strong> {{user_name}} ({{user_email}})</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 8px 0;"><strong>Category:</strong> {{ticket_category}}</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 8px 0;"><strong>Subject:</strong> {{ticket_subject}}</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 8px 0;"><strong>Message:</strong> {{ticket_message}}</p>
    <p style="color:#475569;font-size:14px;margin-top:16px;">Please log in to the <strong>Admin Panel → User Care</strong> section to review and respond.</p>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px;">DigiHub Events Platform — This is an automated message.</p>
</div>`,
        recipientType: 'Association Member',
        availableVariables: ['user_name', 'user_email', 'ticket_category', 'ticket_subject', 'ticket_message']
    },
    {
        name: 'User Care — Status Update (to User)',
        trigger: 'SUPPORT_STATUS_UPDATE',
        subject: '[DigiHub User Care] Ticket Update: {{ticket_status}} — {{ticket_subject}}',
        body: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:16px;">
  <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;border-radius:12px;text-align:center;margin-bottom:24px;">
    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:900;">🔔 Ticket Status Updated</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0 0;font-size:14px;">Ticket: "{{ticket_subject}}"</p>
  </div>
  <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e2e8f0;margin-bottom:16px;">
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 12px 0;">Hi <strong>{{user_name}}</strong>,</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 12px 0;">Your ticket status has been updated to <strong>{{ticket_status}}</strong>.</p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 12px 0;"><strong>Admin Response:</strong> {{admin_remarks}}</p>
    <p style="color:#475569;font-size:14px;line-height:1.7;">If you have further questions, please visit the <strong>User Care</strong> section of DigiHub.</p>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px;">DigiHub Events Platform — This is an automated message.</p>
</div>`,
        recipientType: 'User',
        availableVariables: ['user_name', 'ticket_subject', 'ticket_status', 'admin_remarks']
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
