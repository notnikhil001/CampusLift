import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/', authenticateUser, getNotifications);
router.patch('/read-all', authenticateUser, markAllAsRead);
router.patch('/:id/read', authenticateUser, markAsRead);

export default router;
