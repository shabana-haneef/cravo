import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';
import streamifier from 'streamifier';

// Initialize with fallback dummy values for local dev to prevent crashes
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || 'dummy_cloud',
  api_key: env.CLOUDINARY_API_KEY || 'dummy_key',
  api_secret: env.CLOUDINARY_API_SECRET || 'dummy_secret',
});

export const cloudinaryService = {
  /**
   * Uploads a file buffer to Cloudinary using streams
   * @param {Buffer} buffer - The file buffer
   * @param {string} folder - The destination folder in Cloudinary
   * @returns {Promise<Object>} The Cloudinary upload result
   */
  uploadBuffer(buffer, folder) {
    return new Promise((resolve, reject) => {
      // In local dev without real keys, just mock the success so we don't block workflow
      if (env.CLOUDINARY_CLOUD_NAME === 'dummy_cloud' || !env.CLOUDINARY_CLOUD_NAME) {
        return resolve({
          secure_url: `https://dummyimage.com/600x400/000/fff&text=Dummy+Upload`,
          public_id: `dummy_${Date.now()}`
        });
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  },

  /**
   * Deletes a file from Cloudinary
   * @param {string} publicId - The public ID of the file
   */
  async deleteFile(publicId) {
    if (publicId.startsWith('dummy_')) return;
    return cloudinary.uploader.destroy(publicId);
  }
};
