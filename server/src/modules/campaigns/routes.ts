import { Router, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignInfluencers,
} from './controller';
import { getCampaignCreators } from '../../controllers/campaignCreatorController';
import { auth } from '../../middleware/auth';
import { validateBody } from '../../middleware/zodValidate';
import { createCampaignSchema, updateCampaignSchema } from './validators';

const router = Router();

const campaignCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
}) as unknown as RequestHandler;

router.get('/', auth, getCampaigns);
router.get('/:id', auth, getCampaignById);

router.post('/', auth, campaignCreateLimiter, validateBody(createCampaignSchema), createCampaign);

router.get('/:id/influencers', auth, getCampaignInfluencers);
router.put('/:id', auth, validateBody(updateCampaignSchema), updateCampaign);
router.delete('/:id', auth, deleteCampaign);

router.get('/:id/creators', auth, getCampaignCreators);

export default router;
