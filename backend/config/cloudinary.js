const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload file to Cloudinary
exports.uploadToCloudinary = async (fileBuffer, folder = 'gym_erp', options = {}) => {
    try {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'auto',
                    ...options
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            streamifier.createReadStream(fileBuffer).pipe(uploadStream);
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

// Delete file from Cloudinary
exports.deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

// Generate transformation URL
exports.getImageUrl = (publicId, transformations = {}) => {
    const options = {
        width: transformations.width || 800,
        height: transformations.height || 600,
        crop: transformations.crop || 'fill',
        quality: transformations.quality || 'auto'
    };

    return cloudinary.url(publicId, options);
};

module.exports = cloudinary;