import { Router } from 'express';
import { getMyTrips, rateTrip } from '../controllers/tripController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/my-trips', authenticateUser, getMyTrips);
router.post('/rate', authenticateUser, rateTrip);

export default router;
