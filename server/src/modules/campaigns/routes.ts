import { Router } from 'express';
import { createRateLimiter } from '../../middleware/rateLimit';
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

const campaignCreateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
});

router.get('/', auth, getCampaigns);
router.get('/:id', auth, getCampaignById);

router.post('/', auth, campaignCreateLimiter, validateBody(createCampaignSchema), createCampaign);

router.get('/:id/influencers', auth, getCampaignInfluencers);
router.put('/:id', auth, validateBody(updateCampaignSchema), updateCampaign);
router.delete('/:id', auth, deleteCampaign);

router.get('/:id/creators', auth, getCampaignCreators);

export default router;
