import multer from 'multer';

/**
 * Multer configuration for image uploads.
 * Uses memory storage — files are kept in buffer until
 * we upload them to Cloudinary in the controller.
 * 
 * Limits:
 * - Max file size: 5MB (client should compress before upload)
 * - Only image MIME types accepted
 */
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const isImageMime = file.mimetype.startsWith('image/');
  const isImageExt = /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(file.originalname);
  if (isImageMime || isImageExt) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 4, // max 4 files per request
  },
});
