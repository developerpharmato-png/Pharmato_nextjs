import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
    fileBuffer: Buffer,
    publicId: string,
    resourceType: 'image' | 'raw'
) => {
    try {

        if (resourceType == 'raw') {

            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        public_id: publicId,
                        resource_type: 'image', // 🔥 MAIN CHANGE
                        folder: 'uploads',
                        format : 'pdf'
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );

                uploadStream.end(fileBuffer);
            });

            return result;

        } else {

            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        public_id: publicId,
                        resource_type: 'image', // 🔥 MAIN CHANGE
                        folder: 'uploads'
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );

                uploadStream.end(fileBuffer);
            });

            return result;

        }

    } catch (err) {
        throw err;
    }
};

export const deleteImageFromCloudinary = async (imageUrl: string) => {
    try {
        // Extract public_id from URL
        const urlParts = imageUrl.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        let publicIdWithVersion = urlParts.slice(uploadIndex + 1).join('/');
        publicIdWithVersion = publicIdWithVersion.replace(/v[0-9]+\//, '');
        const publicId = publicIdWithVersion.replace(/\.[^.]+$/, '');
        console.log("Public ID:", publicId);
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error('Failed to delete image from Cloudinary');
    }
};
