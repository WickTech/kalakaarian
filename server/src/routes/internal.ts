import { Router, Request, Response } from 'express';
import { autoApproveExpired, syncAllPlatforms } from '../controllers/cronController';
import { platformIntegrationHealth } from '../controllers/healthController';

const router = Router();

function cronAuth(req: Request, res: Response, next: () => void): void {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.header('x-cron-secret') !== secret) {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  next();
}

router.post('/cron/auto-approve', cronAuth, autoApproveExpired);
router.post('/cron/sync-platforms', cronAuth, syncAllPlatforms);
router.get('/cron/sync-platforms', cronAuth, syncAllPlatforms);
router.get('/health/platform-integration', cronAuth, platformIntegrationHealth);

export default router;
