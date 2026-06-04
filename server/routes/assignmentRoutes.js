import express from 'express';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment, assignBus, manageSeat, reassignSeat, cancelSeat } from '../controllers/assignmentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAssignments)
  .post(protect, admin, createAssignment);

router.route('/:id')
  .put(protect, admin, updateAssignment)
  .delete(protect, admin, deleteAssignment);

router.route('/:id/assign-bus')
  .patch(protect, admin, assignBus);

router.route('/:id/seat')
  .patch(protect, admin, manageSeat);

router.route('/:id/seat/reassign')
  .post(protect, admin, reassignSeat);

router.route('/:id/seat/cancel')
  .post(protect, admin, cancelSeat);

export default router;
