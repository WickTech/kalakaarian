import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign,
  getCampaignInfluencers,
} from '../controllers/campaignController';
import { getCampaignCreators } from '../controllers/campaignCreatorController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const campaignCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
}) as unknown as RequestHandler;

router.get('/', auth, getCampaigns);
router.get('/:id', auth, getCampaignById);

router.post(
  '/',
  auth,
  campaignCreateLimiter,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
  ],
  validate,
  createCampaign,
);

router.get('/:id/influencers', auth, getCampaignInfluencers);
router.put('/:id', auth, updateCampaign);
router.delete('/:id', auth, deleteCampaign);

router.get('/:id/creators', auth, getCampaignCreators);

export default router;
