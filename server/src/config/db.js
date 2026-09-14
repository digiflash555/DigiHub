const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
            console.error('--- ERROR: MONGO_DB_URI is not configured! ---');
            console.error('Please update the MONGODB_URI in server/.env with your actual MongoDB Atlas connection string.');
            console.error('-----------------------------------------------');
            process.exit(1);
        }
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
