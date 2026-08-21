const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 10000;

// Connect to Database
connectDB();

// Start Background Jobs
require('./utils/cronJobs')();
require('./jobs/emailJobs')();

// Seed Default Data
require('./utils/seedEmails')();

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
