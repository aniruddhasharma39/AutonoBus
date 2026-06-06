import express from 'express';
import {
  createOffer,
  getOffers,
  updateOffer,
  deleteOffer,
  validateCoupon
} from '../controllers/offerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getOffers)
  .post(protect, admin, createOffer);

router.route('/validate').post(protect, validateCoupon);

router.route('/:id')
  .put(protect, admin, updateOffer)
  .delete(protect, admin, deleteOffer);

export default router;
