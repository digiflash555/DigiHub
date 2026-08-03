/**
 * Admin Seeder Script
 * Run once with: node server/src/scripts/seedAdmin.js
 * Creates the first admin user. Skip if one already exists.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@eventsmart.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'SuperAdmin';

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const existing = await User.findOne({ role: 'Admin' });
        if (existing) {
            console.log(`ℹ️  Admin already exists: ${existing.email}`);
            process.exit(0);
        }

        const admin = await User.create({
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'Admin',
        });

        console.log('🎉 Admin user created successfully!');
        console.log(`   Email   : ${admin.email}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log('   ⚠️  Change the password after first login!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeder failed:', err.message);
        process.exit(1);
    }
})();
