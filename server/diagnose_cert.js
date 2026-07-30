/**
 * Diagnostic script: checks if the certificate route would succeed
 * for all registrations with attendanceStatus=true.
 * Run from: server/ directory  →  node diagnose_cert.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Registration = require('./src/models/Registration');

async function diagnose() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all attended registrations
    const regs = await Registration.find({ attendanceStatus: true })
        .populate('participant', 'username email')
        .populate('event', 'title certificateConfig feedbackForm');

    console.log(`Found ${regs.length} registrations with attendanceStatus=true\n`);

    let issues = 0;
    for (const reg of regs) {
        const event = reg.event;
        let status = '✅ OK';

        if (!event) {
            status = '❌ EVENT MISSING (event document deleted)';
            issues++;
        } else if (!event.certificateConfig?.template) {
            status = '⚠️  NO TEMPLATE (certificateConfig.template is empty)';
            issues++;
        }

        console.log(`Reg ID: ${reg._id}  |  ${reg.registrationId}`);
        console.log(`   Participant: ${reg.participant?.username} (${reg.participant?.email})`);
        console.log(`   Event:       ${event?.title || 'DELETED'}`);
        console.log(`   Template:    ${event?.certificateConfig?.template || '(none)'}`);
        console.log(`   Status:      ${status}`);
        console.log('');
    }

    console.log(`\n--- Summary ---`);
    console.log(`Total attended: ${regs.length}`);
    console.log(`Issues found:   ${issues}`);

    await mongoose.disconnect();
}

diagnose().catch(err => {
    console.error(err);
    process.exit(1);
});
