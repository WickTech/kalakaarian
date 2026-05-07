import { Router, RequestHandler } from 'express';
import { auth } from '../middleware/auth';
import { recommendCreators, recommendCampaigns } from '../controllers/recommendationController';

const router = Router();

router.get('/creators', auth as unknown as RequestHandler, recommendCreators as unknown as RequestHandler);
router.get('/campaigns', auth as unknown as RequestHandler, recommendCampaigns as unknown as RequestHandler);

export default router;
