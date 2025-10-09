import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import streamifier from 'streamifier';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload buffer to Cloudinary with dynamic resource type.
 * @param {Buffer} buffer - File buffer (Image or Video)
 * @param {string} filename - e.g. "my_event_image.png"
 * @param {string} folderName - e.g. "events/ACS2025" or "tdc/John_A_Doe"
 * @param {'image' | 'video' | 'raw'} resourceType - Type of file to upload
 */
export const uploadBufferToCloudinary = async (buffer, filename, folderName, resourceType) => {
  return new Promise((resolve, reject) => {
    // Create a secure public ID path
    const publicId = `${folderName}/${filename.split('.')[0]}-${Date.now()}`;
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        public_id: publicId,
        // Optional: Apply transformations or quality settings here
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};
