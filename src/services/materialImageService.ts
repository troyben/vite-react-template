import imageCompression from 'browser-image-compression';

export const MATERIAL_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_MATERIAL_IMAGE_BYTES = 256 * 1024;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Resize and compress locally, then persist the resulting raster as a data URL. */
export async function compressMaterialImage(file: File, signal?: AbortSignal): Promise<string> {
  if (!MATERIAL_IMAGE_TYPES.includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP image.');
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) throw new Error('Choose an image between 1 byte and 10 MB.');
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.25, maxWidthOrHeight: 1200, initialQuality: 0.8, fileType: 'image/webp',
    useWebWorker: false, preserveExif: false, signal,
  });
  if (signal?.aborted) throw new Error('Image selection cancelled.');
  if (compressed.size > MAX_MATERIAL_IMAGE_BYTES) throw new Error('This image could not be compressed below 256 KB. Choose a smaller image.');
  const data = await imageCompression.getDataUrlFromFile(compressed);
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(data)) throw new Error('Unable to read the compressed image.');
  return data;
}
