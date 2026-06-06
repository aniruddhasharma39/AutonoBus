import express from 'express';
import { registerUser, authUser, updateUserProfile, getAllCustomers } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.put('/profile', protect, updateUserProfile);
router.get('/customers', protect, admin, getAllCustomers);

export default router;
