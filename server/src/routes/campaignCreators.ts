import { Router } from 'express';
import {
  getCampaignCreators,
  getCampaignCreatorById,
  getMyCampaignCreators,
} from '../controllers/campaignCreatorController';
import { submitRating, getProposalRating } from '../controllers/ratingController';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/my', auth, getMyCampaignCreators);
router.get('/', auth, getCampaignCreators);
router.get('/:id', auth, getCampaignCreatorById);

router.get('/:id/rating', auth, getProposalRating);
router.post('/:id/rate', auth, submitRating);

export default router;
