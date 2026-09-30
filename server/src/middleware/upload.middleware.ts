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
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // max 5 files per request
  },
});
