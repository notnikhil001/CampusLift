import { Router } from 'express';
import { createReport, blockUser, unblockUser, getBlocks } from '../controllers/safetyController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.post('/reports', authenticateUser, createReport);
router.get('/blocks', authenticateUser, getBlocks);
router.post('/blocks', authenticateUser, blockUser);
router.delete('/blocks/:blockedUserId', authenticateUser, unblockUser);

export default router;
