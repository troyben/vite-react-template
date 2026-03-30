import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker?: boolean;
}

export const compressImage = async (
  file: File,
  options: CompressionOptions = {
    maxSizeMB: 0.05, // Reduced from 0.1 to 0.05
    maxWidthOrHeight: 200, // Reduced from 400 to 200
    useWebWorker: true
  }
): Promise<File> => {
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};
