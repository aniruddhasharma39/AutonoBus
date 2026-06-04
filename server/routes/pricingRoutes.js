import express from 'express';
import { getPricings, createPricing, updatePricing, deletePricing } from '../controllers/pricingController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getPricings)
  .post(protect, admin, createPricing);

router.route('/:id')
  .put(protect, admin, updatePricing)
  .delete(protect, admin, deletePricing);

export default router;
