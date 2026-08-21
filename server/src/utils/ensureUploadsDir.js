const fs = require('fs');
const path = require('path');

// server/uploads — shared with express.static in app.js
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const ensureUploadsDir = () => {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    return UPLOADS_DIR;
};

module.exports = { ensureUploadsDir, UPLOADS_DIR };
