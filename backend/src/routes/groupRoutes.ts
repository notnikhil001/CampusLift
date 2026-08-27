import { Router } from 'express';
import {
  getGroup,
  createGroup,
  joinGroup,
  createGroupFromIntent,
  leaveGroup,
  updateCommonTime,
  setMeetingPoint,
  updateStatus,
} from '../controllers/groupController';
import { authenticateUser, requireVerifiedStudent } from '../middleware/auth';

const router = Router();

router.get('/:id', authenticateUser, getGroup);
router.post('/create', authenticateUser, requireVerifiedStudent, createGroup);
router.post('/join', authenticateUser, requireVerifiedStudent, joinGroup);
router.post('/from-intent', authenticateUser, requireVerifiedStudent, createGroupFromIntent);
router.post('/:id/leave', authenticateUser, leaveGroup);
router.patch('/:id/time', authenticateUser, updateCommonTime);
router.patch('/:id/meeting-point', authenticateUser, setMeetingPoint);
router.patch('/:id/status', authenticateUser, updateStatus);

export default router;
