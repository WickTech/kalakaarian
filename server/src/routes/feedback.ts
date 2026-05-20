import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { createRateLimiter } from '../middleware/rateLimit';
import { adminClient } from '../config/supabase';
import { validate } from '../middleware/validate';
import { AuthRequest, auth } from '../middleware/auth';

const router = Router();

const feedbackLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (r: any) => r.ip || 'unknown',
});

router.post(
  '/app-rating',
  feedbackLimiter,
  auth,
  [
    body('score').isInt({ min: 1, max: 5 }).withMessage('score must be 1–5'),
    body('feedback').optional().isString().isLength({ max: 500 }).withMessage('feedback ≤ 500 chars'),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { score, feedback } = req.body as { score: number; feedback?: string };
      const userId = req.user?.userId ?? null;

      const { error } = await adminClient.from('app_ratings').insert({
        user_id: userId,
        score,
        feedback: feedback ?? null,
      });

      if (error) throw error;
      res.status(201).json({ message: 'Rating submitted' });
    } catch (err) {
      console.error('App rating error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;
