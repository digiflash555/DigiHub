const mongoose = require('mongoose');
const Registration = require('./src/models/Registration');
const Event = require('./src/models/Event');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://event_admin:event_admin_123@event.lnrqecr.mongodb.net/?appName=event');
        console.log('Connected to DB');

        const regId1 = '6a5b6cb0bc3eb60ae5301773';
        const reg1 = await Registration.findById(regId1).populate('event', 'title eventDate certificateConfig feedbackForm');
        console.log('Registration 1:', reg1 ? 'Found' : 'Not found');
        if (reg1 && reg1.event) {
            console.log('Event template config for Reg 1:', reg1.event.certificateConfig?.template);
        }

        const volAppId1 = '6a5b6cb0bc3eb60ae5301773';
        const reg1_participant = reg1.participant;
        console.log('Reg 1 participant ID:', reg1_participant?._id);

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: reg1_participant._id, role: 'Participant' }, 'your_jwt_secret_key_change_this_for_production', { expiresIn: '1d' });
        
        try {
            const res = await fetch(`http://localhost:5000/api/certificates/data/${volAppId1}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            console.log('API Response:', res.status, data);
        } catch (apiErr) {
            console.log('API Error:', apiErr.message);
        }



    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

test();
