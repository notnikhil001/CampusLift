import { Router } from 'express';
import { getColleges, getCollegeLocations } from '../controllers/collegeController';

const router = Router();

router.get('/', getColleges);
router.get('/:collegeId/locations', getCollegeLocations);

export default router;
