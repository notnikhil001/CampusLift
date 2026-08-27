import { Router } from 'express';
import { createIntent, getFeed, cancelIntent } from '../controllers/intentController';
import { authenticateUser, requireVerifiedStudent } from '../middleware/auth';

const router = Router();

router.get('/feed', authenticateUser, getFeed);
router.post('/', authenticateUser, requireVerifiedStudent, createIntent);
router.patch('/:id/cancel', authenticateUser, cancelIntent);

export default router;
