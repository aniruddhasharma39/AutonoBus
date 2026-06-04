import express from 'express';
import { 
  createBooking, 
  getUserBookings, 
  savePassenger, 
  getSavedPassengers 
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createBooking);
router.route('/mybookings').get(protect, getUserBookings);
router.route('/passengers').post(protect, savePassenger).get(protect, getSavedPassengers);

export default router;
