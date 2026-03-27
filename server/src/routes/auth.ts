import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, updateProfile, googleLogin, sendOTP, verifyOTP } from '../controllers/authController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.post(
  '/register',
  [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role').isIn(['brand', 'influencer']).withMessage('Role must be brand or influencer'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').optional().isEmail(),
    body('username').optional(),
    body('password').optional(),
    body('phone').optional(),
    body('isPhoneLogin').optional().isBoolean(),
  ],
  validate,
  login
);

router.post(
  '/send-otp',
  [
    body('phone').notEmpty().withMessage('Phone number is required'),
  ],
  validate,
  sendOTP
);

router.post(
  '/verify-otp',
  [
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
  ],
  validate,
  verifyOTP
);

router.post(
  '/google',
  [
    body('code').optional(),
    body('jwtToken').optional(),
  ],
  validate,
  googleLogin
);

router.get('/profile', auth, getProfile);

router.put('/profile', auth, updateProfile);

export default router;
