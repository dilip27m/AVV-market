import { Readable } from 'stream';
import cloudinary from '../config/cloudinary';
import { env } from '../config/env';

// All our uploads live under this Cloudinary folder
const ROOT_FOLDER = 'avv-market';

/** Upload one image buffer, resized and compressed for the web. */
const uploadOne = (buffer: Buffer, folder: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' }, // max 800x800, keep ratio
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) reject(error || new Error('Upload failed'));
        else resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(stream);
  });

/**
 * Upload multer files to `avv-market/<subfolder>` and return their URLs.
 * If any upload fails, the ones that succeeded are deleted again so
 * nothing is left orphaned.
 */
export const uploadImages = async (files: unknown, subfolder: 'listings' | 'missing'): Promise<string[]> => {
  if (!Array.isArray(files) || files.length === 0) return [];

  const results = await Promise.allSettled(
    (files as Express.Multer.File[]).map((file) => uploadOne(file.buffer, `${ROOT_FOLDER}/${subfolder}`))
  );

  const uploaded = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failed) {
    deleteImages(uploaded);
    throw failed.reason;
  }
  return uploaded;
};

/**
 * Extract the Cloudinary public_id from one of OUR image URLs, e.g.
 * https://res.cloudinary.com/<cloud>/image/upload/v1712/avv-market/listings/abc.jpg
 *   -> "avv-market/listings/abc"
 * Returns null for anything that isn't ours, so a crafted URL can never
 * make us delete someone else's file.
 */
export const publicIdFromUrl = (url: string): string | null => {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname !== 'res.cloudinary.com') return null;

    const match = pathname.match(/^\/([^/]+)\/image\/upload\/(?:.+?\/)?v\d+\/(.+)\.[a-z0-9]+$/i);
    if (!match) return null;

    const [, cloudName, publicId] = match;
    if (env.CLOUDINARY_CLOUD_NAME && cloudName !== env.CLOUDINARY_CLOUD_NAME) return null;
    if (!publicId.startsWith(`${ROOT_FOLDER}/`)) return null;
    return decodeURIComponent(publicId);
  } catch {
    return null;
  }
};

/**
 * Delete images from Cloudinary in the background. Never throws:
 * a failed cleanup must not break the user's request, so we only log it.
 */
export const deleteImages = (urls: string[] | undefined | null): void => {
  const publicIds = (urls || []).map(publicIdFromUrl).filter((id): id is string => !!id);
  if (publicIds.length === 0 || !env.CLOUDINARY_API_SECRET) return;

  cloudinary.api
    .delete_resources(publicIds, { resource_type: 'image' })
    .then((result: { deleted?: Record<string, string> }) => {
      const notFound = Object.entries(result.deleted || {}).filter(([, status]) => status !== 'deleted');
      if (notFound.length > 0) console.warn('⚠️ Cloudinary: some images were not deleted:', notFound);
    })
    .catch((error: unknown) => console.error('❌ Cloudinary cleanup failed:', error));
};
