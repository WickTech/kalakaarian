import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { register, login, googleLogin } from '../controllers/authController';
import { sendOTP, verifyOTP } from '../controllers/otpController';
import { getProfile, updateProfile } from '../controllers/profileController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Cast needed due to @types/express-serve-static-core version mismatch between root and server node_modules
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }) as unknown as RequestHandler;
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (r: any) => (r.body?.phone as string) || r.ip || 'unknown',
}) as unknown as RequestHandler;

router.post(
  '/register',
  authLimiter,
  [
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role').isIn(['brand', 'influencer']).withMessage('Role must be brand or influencer'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
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
  otpLimiter,
  [
    body('phone').notEmpty().withMessage('Phone number is required'),
  ],
  validate,
  sendOTP
);

router.post(
  '/verify-otp',
  otpLimiter,
  [
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
  ],
  validate,
  verifyOTP
);

router.post(
  '/google',
  authLimiter,
  [
    body('code').optional(),
    body('token').optional(),
  ],
  validate,
  googleLogin
);

router.get('/profile', auth, getProfile);

router.put('/profile', auth, updateProfile);

export default router;
