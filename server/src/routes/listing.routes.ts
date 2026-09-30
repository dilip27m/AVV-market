import { Router } from 'express';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  updateListingStatus,
  deleteListing,
  getMyListings,
  renewListing,
  adminDeleteListing,
} from '../controllers/listing.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Public
router.get('/', getListings);
router.get('/search', getListings); // Same handler, search via query params

// Protected — "my" route MUST come before "/:id" to avoid matching "my" as an ID
router.get('/my', authMiddleware, getMyListings);

// Public
router.get('/:id', getListingById);

// Protected
router.post('/', authMiddleware, upload.array('images', 4), createListing);
router.put('/:id', authMiddleware, upload.array('images', 4), updateListing);
router.patch('/:id/status', authMiddleware, updateListingStatus);
router.patch('/:id/renew', authMiddleware, renewListing);
router.delete('/:id', authMiddleware, deleteListing);
router.delete('/:id/admin', authMiddleware, adminDeleteListing);

export default router;
