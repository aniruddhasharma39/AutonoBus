import express from 'express';
import { getMyNotifications, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getMyNotifications);
router.route('/read-all').put(protect, markAllRead);

export default router;
