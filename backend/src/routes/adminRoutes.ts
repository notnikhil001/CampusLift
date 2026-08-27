import { Router } from 'express';
import {
  getDashboardMetrics,
  getUsers,
  updateUserStatus,
  deleteUser,
  getAdminColleges,
  createCollege,
  updateCollege,
  getAdminLocations,
  createLocation,
  updateLocation,
  getAdminReports,
  resolveReport,
} from '../controllers/adminController';
import { authenticateUser, requireAdmin } from '../middleware/auth';

const router = Router();

// Apply admin auth to all routes
router.use(authenticateUser, requireAdmin);

router.get('/metrics', getDashboardMetrics);

router.get('/users', getUsers);
router.patch('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);

router.get('/colleges', getAdminColleges);
router.post('/colleges', createCollege);
router.patch('/colleges/:id', updateCollege);

router.get('/locations', getAdminLocations);
router.post('/locations', createLocation);
router.patch('/locations/:id', updateLocation);

router.get('/reports', getAdminReports);
router.patch('/reports/:id', resolveReport);

export default router;
