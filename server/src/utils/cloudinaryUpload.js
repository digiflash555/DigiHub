const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with env credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Creates a multer upload middleware backed by Cloudinary.
 *
 * @param {string} folder      - Cloudinary folder to store files in
 * @param {string[]} formats   - Allowed file format extensions, e.g. ['jpg','png']
 * @param {number} maxMB       - Max file size in megabytes
 * @param {string} [prefix]    - Optional public_id prefix / filename prefix
 * @returns multer middleware instance
 */
const createCloudinaryUpload = (folder, formats, maxMB = 5, prefix = '') => {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: async (req, file) => {
            // Determine resource type: PDFs and docs need 'raw'
            const ext = file.originalname.split('.').pop().toLowerCase();
            const rawTypes = ['pdf', 'doc', 'docx'];
            const resourceType = rawTypes.includes(ext) ? 'raw' : 'image';

            return {
                folder: `event_management/${folder}`,
                resource_type: resourceType,
                public_id: `${prefix}${Date.now()}-${Math.round(Math.random() * 1e9)}`,
                // Keep original format, Cloudinary handles conversion
                format: undefined,
            };
        },
    });

    return multer({
        storage,
        limits: { fileSize: maxMB * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const ext = file.originalname.split('.').pop().toLowerCase();
            if (formats.includes(ext)) {
                return cb(null, true);
            }
            cb(new Error(`Only these formats are allowed: ${formats.join(', ')}`));
        },
    });
};

/**
 * Creates a role-aware multer upload middleware backed by Cloudinary.
 * Admins bypass the regular file size limit and get a generous 50 MB cap instead.
 *
 * IMPORTANT: The `protect` middleware MUST run before this middleware in the route
 * so that req.user is populated before multer starts processing the upload.
 *
 * @param {string}   folder      - Cloudinary folder to store files in
 * @param {string[]} formats     - Allowed file format extensions, e.g. ['jpg','png']
 * @param {number}   maxMB       - Max file size in MB for regular users
 * @param {string}   [prefix]    - Optional public_id prefix / filename prefix
 * @param {number}   [adminMaxMB=50] - Max file size in MB for Admin users (no practical limit)
 * @returns {{ single, array, fields }} - Object with the same API as a multer instance
 */
const createRoleAwareUpload = (folder, formats, maxMB = 5, prefix = '', adminMaxMB = 50) => {
    const regularUpload = createCloudinaryUpload(folder, formats, maxMB, prefix);
    const adminUpload   = createCloudinaryUpload(folder, formats, adminMaxMB, prefix);

    // Returns the correct multer instance based on the authenticated user's role.
    const pick = (req) => (req.user?.role === 'Admin' ? adminUpload : regularUpload);

    return {
        single : (fieldName)        => (req, res, next) => pick(req).single(fieldName)(req, res, next),
        array  : (fieldName, max)   => (req, res, next) => pick(req).array(fieldName, max)(req, res, next),
        fields : (fields)           => (req, res, next) => pick(req).fields(fields)(req, res, next),
        none   : ()                 => (req, res, next) => pick(req).none()(req, res, next),
    };
};

/**
 * Deletes a file from Cloudinary by its public_id or full secure_url.
 * Silently ignores errors so a failed delete never breaks the API.
 *
 * @param {string} publicIdOrUrl  - Cloudinary public_id or secure_url
 * @param {string} [resourceType] - 'image' (default) or 'raw'
 */
const deleteFromCloudinary = async (publicIdOrUrl, resourceType = 'image') => {
    try {
        if (!publicIdOrUrl) return;

        // If it's a full URL, extract the public_id
        let publicId = publicIdOrUrl;
        if (publicIdOrUrl.startsWith('http')) {
            // e.g. https://res.cloudinary.com/cloud/image/upload/v123/event_management/profiles/abc.jpg
            const parts = publicIdOrUrl.split('/upload/');
            if (parts.length === 2) {
                // Remove version segment (v12345/) and file extension
                publicId = parts[1].replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
            }
        }
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
        console.warn('Cloudinary delete warning:', err.message);
    }
};

module.exports = { cloudinary, createCloudinaryUpload, createRoleAwareUpload, deleteFromCloudinary };
