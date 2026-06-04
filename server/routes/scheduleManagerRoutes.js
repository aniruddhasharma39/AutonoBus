import express from 'express';
import { getSchedules, createSchedule, deleteSchedule } from '../controllers/scheduleManagerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getSchedules)
  .post(protect, admin, createSchedule);

router.route('/:id')
  .delete(protect, admin, deleteSchedule);

export default router;
