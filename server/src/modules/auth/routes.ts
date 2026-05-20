import { Router, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login } from './authController';
import { sendOTP, verifyOTP } from './otpController';
import { googleLogin, completeGoogleOnboarding } from './oauthController';
import { forgotPassword, validateResetToken, resetPassword } from './passwordResetController';
import { getProfile, updateProfile, changePassword } from '../../controllers/profileController';
import { deleteAccount } from '../../controllers/accountController';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  registerValidators, loginValidators, sendOtpValidators, verifyOtpValidators,
  googleValidators, completeOnboardingValidators, changePasswordValidators,
  forgotPasswordValidators, resetPasswordValidators, deleteAccountValidators,
} from './validators';

const router = Router();

// Rate limiters are disabled only under NODE_ENV=test so the integration suite
// can exercise these endpoints without tripping production throttles. They are
// always active outside test. The `as unknown as RequestHandler` cast works
// around an @types/express-serve-static-core version mismatch between the root
// and server node_modules.
const testMode = process.env.NODE_ENV === 'test';
const passthrough: RequestHandler = (_req, _res, next) => next();
const limiter = (opts: Parameters<typeof rateLimit>[0]): RequestHandler =>
  testMode ? passthrough : (rateLimit(opts) as unknown as RequestHandler);

const authLimiter = limiter({ windowMs: 15 * 60 * 1000, max: 20 });
const forgotLimiter = limiter({ windowMs: 60 * 60 * 1000, max: 10 });
const validateTokenLimiter = limiter({ windowMs: 60 * 60 * 1000, max: 30 });
const resetLimiter = limiter({ windowMs: 60 * 60 * 1000, max: 10 });
const otpLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (r: any) => (r.body?.phone as string) || r.ip || 'unknown',
});

router.post('/register', authLimiter, registerValidators, validate, register);
router.post('/login', authLimiter, loginValidators, validate, login);
router.post('/send-otp', otpLimiter, sendOtpValidators, validate, sendOTP);
router.post('/verify-otp', otpLimiter, verifyOtpValidators, validate, verifyOTP);
router.post('/google', authLimiter, googleValidators, validate, googleLogin);
router.post(
  '/complete-onboarding',
  auth,
  completeOnboardingValidators,
  validate,
  completeGoogleOnboarding as unknown as RequestHandler,
);

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/password', auth, changePasswordValidators, validate, changePassword);

router.post('/forgot-password', forgotLimiter, forgotPasswordValidators, validate, forgotPassword);
router.get('/validate-reset-token', validateTokenLimiter, validateResetToken);
router.post('/reset-password', resetLimiter, resetPasswordValidators, validate, resetPassword);

router.delete(
  '/account',
  auth,
  deleteAccountValidators,
  validate,
  deleteAccount as unknown as RequestHandler,
);

export default router;
