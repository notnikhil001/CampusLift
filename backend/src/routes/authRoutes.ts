import { Router } from 'express';
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
} from '../controllers/authController';
import { authenticateUser, optionalAuthenticateUser } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', optionalAuthenticateUser, resendVerification);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', authenticateUser, getMe);
router.patch('/profile', authenticateUser, updateProfile);

export default router;
