import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { register, login } from '../controllers/authController';
import { googleLogin, completeGoogleOnboarding } from '../controllers/googleAuthController';
import { sendOTP, verifyOTP } from '../controllers/otpController';
import { getProfile, updateProfile, changePassword } from '../controllers/profileController';
import { deleteAccount } from '../controllers/accountController';
import {
  forgotPassword,
  validateResetToken,
  resetPassword,
} from '../controllers/passwordResetController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Cast needed due to @types/express-serve-static-core version mismatch between root and server node_modules
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }) as unknown as RequestHandler;
const forgotLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }) as unknown as RequestHandler;
const validateTokenLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 30 }) as unknown as RequestHandler;
const resetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }) as unknown as RequestHandler;
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

router.post(
  '/complete-onboarding',
  auth,
  [body('role').isIn(['brand', 'influencer']).withMessage('Role must be brand or influencer')],
  validate,
  completeGoogleOnboarding as unknown as import('express').RequestHandler
);

router.get('/profile', auth, getProfile);

router.put('/profile', auth, updateProfile);

router.put(
  '/password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  changePassword
);

router.post(
  '/forgot-password',
  forgotLimiter,
  [body('email').isEmail().withMessage('Valid email required')],
  validate,
  forgotPassword
);

router.get(
  '/validate-reset-token',
  validateTokenLimiter,
  validateResetToken
);

router.post(
  '/reset-password',
  resetLimiter,
  [
    body('token').isString().isLength({ min: 64, max: 64 }).withMessage('Invalid token'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  resetPassword
);

router.delete(
  '/account',
  auth,
  [
    body('confirmation').equals('delete').withMessage('Type delete to confirm'),
    body('password').optional({ nullable: true }).isString(),
  ],
  validate,
  deleteAccount as unknown as import('express').RequestHandler
);

export default router;
