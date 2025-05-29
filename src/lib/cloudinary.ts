import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret',
  secure: true,
});

/**
 * Upload an image to Cloudinary
 * @param file Buffer or base64 string of the image
 * @param options Additional upload options
 * @returns Promise with the upload result
 */
export async function uploadImage(
  file: Buffer | string,
  options: {
    folder?: string;
    public_id?: string;
    tags?: string[];
    transformation?: any;
  } = {}
): Promise<{ url: string; public_id: string }> {
  try {
    // For Buffer data
    if (Buffer.isBuffer(file)) {
      const uploadOptions = {
        folder: options.folder || 'pneumonia-xrays',
        public_id: options.public_id,
        tags: options.tags || ['xray', 'pneumonia-detection'],
        transformation: options.transformation,
      };

      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, uploadResult) => {
            if (error) return reject(error);
            resolve(uploadResult);
          }
        ).end(file);
      });

      return {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }
    
    // For base64 data (string starting with data:image)
    else if (typeof file === 'string') {
      const uploadOptions = {
        folder: options.folder || 'pneumonia-xrays',
        public_id: options.public_id,
        tags: options.tags || ['xray', 'pneumonia-detection'],
        transformation: options.transformation,
      };

      const result = await cloudinary.uploader.upload(file, uploadOptions);

      return {
        url: result.secure_url,
        public_id: result.public_id,
      };
    } 
    else {
      throw new Error('Invalid file format for Cloudinary upload');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Get a Cloudinary URL with transformations
 * @param publicId The public ID of the image
 * @param options Transformation options
 * @returns The transformed URL
 */
export function getImageUrl(publicId: string, options: any = {}): string {
  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
}

export default cloudinary; 