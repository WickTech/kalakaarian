import { Router, Request, Response } from 'express';
import { autoApproveExpired } from '../controllers/cronController';

const router = Router();

function cronAuth(req: Request, res: Response, next: () => void): void {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.header('x-cron-secret') !== secret) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  next();
}

router.post('/cron/auto-approve', cronAuth, autoApproveExpired);

export default router;
