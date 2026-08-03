/**
 * Sample Data Seeder
 * Run with: node server/src/scripts/seedSampleData.js
 * Creates admin, volunteers, participants, events, registrations, and sample attendance.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const SAMPLE_PASSWORD = 'Password@123';

const sampleUsers = [
    { username: 'SuperAdmin', email: 'admin@eventsmart.com', password: 'Admin@12345', role: 'Admin' },
    { username: 'Volunteer One', email: 'volunteer1@eventsmart.com', password: SAMPLE_PASSWORD, role: 'Volunteer' },
    { username: 'Volunteer Two', email: 'volunteer2@eventsmart.com', password: SAMPLE_PASSWORD, role: 'Volunteer' },
    { username: 'Alice Johnson', email: 'alice@student.com', password: SAMPLE_PASSWORD, role: 'Participant', registrationNumber: 'STU001', phone: '+1 555 0101', skills: ['JavaScript', 'React'] },
    { username: 'Bob Smith', email: 'bob@student.com', password: SAMPLE_PASSWORD, role: 'Participant', registrationNumber: 'STU002', phone: '+1 555 0102', skills: ['Python', 'ML'] },
    { username: 'Carol Davis', email: 'carol@student.com', password: SAMPLE_PASSWORD, role: 'Participant', registrationNumber: 'STU003', phone: '+1 555 0103', skills: ['Design', 'Figma'] },
    { username: 'David Wilson', email: 'david@student.com', password: SAMPLE_PASSWORD, role: 'Participant', registrationNumber: 'STU004', phone: '+1 555 0104', skills: ['Java', 'Spring'] },
    { username: 'Eva Martinez', email: 'eva@student.com', password: SAMPLE_PASSWORD, role: 'Participant', registrationNumber: 'STU005', phone: '+1 555 0105', skills: ['Node.js', 'MongoDB'] },
];

const createRegistration = async (event, participant, admin, attended = false) => {
    const registrationId = `REG-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const qrData = JSON.stringify({
        eventId: event._id.toString(),
        participantId: participant._id.toString(),
        registrationId,
        token: uuidv4()
    });
    const qrCode = await QRCode.toDataURL(qrData);

    return Registration.create({
        event: event._id,
        participant: participant._id,
        registrationId,
        formData: { 'Department': 'Computer Science', 'Year': '3rd Year' },
        qrCode,
        attendanceStatus: attended,
        attendanceTime: attended ? new Date() : undefined,
        markedBy: attended ? admin._id : undefined,
    });
};

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing sample data (keep structure clean for demo)
        const sampleEmails = sampleUsers.map(u => u.email);
        const existingUsers = await User.find({ email: { $in: sampleEmails } });
        const existingUserIds = existingUsers.map(u => u._id);

        if (existingUserIds.length) {
            await Registration.deleteMany({ participant: { $in: existingUserIds } });
        }
        await Event.deleteMany({ title: { $regex: /^(Tech Hackathon|Web Dev Workshop|AI Innovation Summit)$/ } });
        await User.deleteMany({ email: { $in: sampleEmails } });

        const users = {};
        for (const userData of sampleUsers) {
            const user = await User.create(userData);
            users[userData.email] = user;
            console.log(`Created ${user.role}: ${user.email}`);
        }

        const admin = users['admin@eventsmart.com'];
        const participants = [
            users['alice@student.com'],
            users['bob@student.com'],
            users['carol@student.com'],
            users['david@student.com'],
            users['eva@student.com'],
        ];

        const futureDate = (days) => {
            const d = new Date();
            d.setDate(d.getDate() + days);
            return d;
        };

        const events = await Event.insertMany([
            {
                title: 'Tech Hackathon 2026',
                description: 'A 24-hour coding marathon where teams build innovative solutions. Prizes for top 3 teams. Food and swag provided!',
                venue: 'Main Auditorium, Block A',
                eventDate: futureDate(30),
                startTime: '09:00',
                endTime: '18:00',
                registrationDeadline: futureDate(25),
                maxParticipants: 100,
                category: 'Hackathon',
                participationType: 'Team',
                minTeamSize: 2,
                maxTeamSize: 4,
                status: 'Open',
                isPublished: true,
                registrationForm: [
                    { label: 'Department', type: 'text', required: true, placeholder: 'e.g. Computer Science' },
                    { label: 'Year', type: 'dropdown', required: true, options: ['1st Year', '2nd Year', '3rd Year', '4th Year'] },
                    { label: 'GitHub Profile', type: 'text', required: false, placeholder: 'https://github.com/username' },
                ],
                createdBy: admin._id,
            },
            {
                title: 'Web Dev Workshop',
                description: 'Hands-on workshop covering React, Node.js, and MongoDB. Build a full-stack app from scratch with expert mentors.',
                venue: 'Lab 301, IT Block',
                eventDate: futureDate(14),
                startTime: '10:00',
                endTime: '16:00',
                registrationDeadline: futureDate(10),
                maxParticipants: 50,
                category: 'Workshop',
                participationType: 'Individual',
                status: 'Open',
                isPublished: true,
                registrationForm: [
                    { label: 'Department', type: 'text', required: true, placeholder: 'Your department' },
                    { label: 'Experience Level', type: 'radio', required: true, options: ['Beginner', 'Intermediate', 'Advanced'] },
                    { label: 'Resume', type: 'file', required: false },
                ],
                createdBy: admin._id,
            },
            {
                title: 'AI Innovation Summit',
                description: 'Explore the latest in artificial intelligence and machine learning. Keynote speakers from industry leaders and networking sessions.',
                venue: 'Conference Hall, Central Campus',
                eventDate: futureDate(45),
                startTime: '08:30',
                endTime: '17:30',
                registrationDeadline: futureDate(40),
                maxParticipants: 200,
                category: 'Conference',
                participationType: 'Individual',
                status: 'Open',
                isPublished: true,
                registrationForm: [
                    { label: 'Organization', type: 'text', required: true, placeholder: 'College or Company name' },
                    { label: 'Interest Area', type: 'checkbox', required: true, options: ['NLP', 'Computer Vision', 'Robotics', 'Data Science'] },
                ],
                createdBy: admin._id,
            },
        ]);

        console.log(`Created ${events.length} events`);

        // Register participants for events
        for (const participant of participants) {
            await createRegistration(events[0], participant, admin, participant === participants[0] || participant === participants[1]);
        }
        for (const participant of participants.slice(0, 3)) {
            await createRegistration(events[1], participant, admin, participant === participants[0]);
        }
        for (const participant of participants) {
            await createRegistration(events[2], participant, admin, false);
        }

        const regCount = await Registration.countDocuments();
        const attendedCount = await Registration.countDocuments({ attendanceStatus: true });

        console.log('\nSample data seeded successfully!\n');
        console.log('--- Login Credentials ---');
        console.log('Admin:       admin@eventsmart.com / Admin@12345');
        console.log('Volunteer:   volunteer1@eventsmart.com / Password@123');
        console.log('Participant: alice@student.com / Password@123');
        console.log(`\n${events.length} events, ${regCount} registrations, ${attendedCount} with attendance marked.`);
        console.log('\nTry: Login as volunteer → /scanner to scan QR codes');
        console.log('     Login as admin → /admin/attendance to download reports');

        process.exit(0);
    } catch (err) {
        console.error('Seeder failed:', err.message);
        process.exit(1);
    }
})();
