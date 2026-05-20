import { Router } from 'express';
import { createRateLimiter } from '../middleware/rateLimit';
import { auth, AuthRequest } from '../middleware/auth';
import {
  getConnectedPlatforms,
  getPlatformMetrics,
  triggerPlatformSync,
  disconnectPlatform,
} from '../controllers/platformsController';
import { getInstagramAuthUrl, handleInstagramCallback, getInstagramConnectionStatus } from '../controllers/instagramOAuthController';
import { getYouTubeAuthUrl, handleYouTubeCallback, getYouTubeConnectionStatus } from '../controllers/youtubeOAuthController';

const router = Router();

// 10 sync requests per hour per user
const syncLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req: unknown) => {
    const r = req as AuthRequest;
    return r.user?.userId ?? r.ip ?? 'unknown';
  },
});

// Unified status + metrics
router.get('/', auth, (req, res) => getConnectedPlatforms(req as AuthRequest, res));
router.get('/:platform/metrics', auth, (req, res) => getPlatformMetrics(req as AuthRequest, res));
router.post('/:platform/sync', auth, syncLimiter, (req, res) => triggerPlatformSync(req as AuthRequest, res));
router.delete('/:platform', auth, (req, res) => disconnectPlatform(req as AuthRequest, res));

// Per-platform OAuth flows
router.get('/instagram/auth', auth, (req, res) => getInstagramAuthUrl(req as AuthRequest, res));
router.get('/instagram/callback', (req, res) => handleInstagramCallback(req, res));
router.get('/instagram/status', auth, (req, res) => getInstagramConnectionStatus(req as AuthRequest, res));

router.get('/youtube/auth', auth, (req, res) => getYouTubeAuthUrl(req as AuthRequest, res));
router.get('/youtube/callback', (req, res) => handleYouTubeCallback(req, res));
router.get('/youtube/status', auth, (req, res) => getYouTubeConnectionStatus(req as AuthRequest, res));

export default router;
