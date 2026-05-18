import { Router, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { auth } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import {
  signOutAll,
  getPreferences,
  updatePreferences,
  requestDataExport,
  updateAvatar,
} from '../controllers/accountController';

const router = Router();

// 1 data export request per 24 hours per user (keyed by auth'd userId via IP fallback)
const exportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  keyGenerator: (req) => ((req as unknown as AuthRequest).user?.userId) ?? req.ip ?? 'unknown',
  message: { message: 'Only one data export request per day is allowed' },
}) as unknown as RequestHandler;

router.post('/sign-out-all', auth, signOutAll as unknown as RequestHandler);
router.get('/preferences', auth, getPreferences as unknown as RequestHandler);
router.put('/preferences', auth, updatePreferences as unknown as RequestHandler);
router.post('/data-export', auth, exportLimiter, requestDataExport as unknown as RequestHandler);
router.post('/avatar', auth, updateAvatar as unknown as RequestHandler);

export default router;
