const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const NominationForm = require('../models/NominationForm');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        // Attempt to create a form with empty dates
        const form = await NominationForm.create({
            title: 'Test Form ' + Date.now(),
            description: 'Test Description',
            fields: [],
            isActive: true,
            startDate: '',
            endDate: ''
        });
        console.log('Successfully created form:', form._id);
        
        // Delete it afterward
        await NominationForm.findByIdAndDelete(form._id);
        console.log('Successfully deleted test form');
        
        process.exit(0);
    } catch (err) {
        console.error('Validation failed as expected:', err.message);
        process.exit(0);
    }
})();
