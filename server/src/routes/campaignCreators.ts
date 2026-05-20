import { Router } from 'express';
import {
  getCampaignCreators,
  getCampaignCreatorById,
  getMyCampaignCreators,
} from '../modules/campaigns/campaignCreatorController';
import { submitRating, getCampaignCreatorRating } from '../controllers/ratingController';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/my', auth, getMyCampaignCreators);
router.get('/', auth, getCampaignCreators);
router.get('/:id', auth, getCampaignCreatorById);

router.get('/:id/rating', auth, getCampaignCreatorRating);
router.post('/:id/rate', auth, submitRating);

export default router;
