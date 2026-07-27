const errorMiddleware = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Handle MongoDB duplicate key error (E11000)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        const value = err.keyValue ? err.keyValue[field] : '';
        message = `An account with this ${field} (${value}) already exists.`;
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'File too large. Maximum allowed sizes: 5MB for profile/signature images, 10MB for banners and certificate templates.';
    } else if (err.message && err.message.includes('Images only')) {
        statusCode = 400;
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }

    res.status(statusCode);
    res.json({
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorMiddleware };
