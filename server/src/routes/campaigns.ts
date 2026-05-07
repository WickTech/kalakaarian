import { Router, RequestHandler } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign, getOpenCampaigns,
  getCampaignInfluencers,
} from '../controllers/campaignController';
import { submitProposal, getProposals } from '../controllers/proposalController';
import { updateProposalStatus } from '../controllers/proposalActions';
import { auth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const campaignCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
}) as unknown as RequestHandler;

router.get('/open', optionalAuth, getOpenCampaigns);
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
  createCampaign
);

router.get('/:id/influencers', auth, getCampaignInfluencers);
router.put('/:id', auth, updateCampaign);
router.delete('/:id', auth, deleteCampaign);

router.post(
  '/:id/proposals',
  auth,
  [
    body('message').notEmpty().withMessage('Message is required'),
    body('bidAmount').isNumeric().withMessage('Bid amount must be a number'),
  ],
  validate,
  submitProposal
);

router.get('/:id/proposals', auth, getProposals);
router.put('/proposals/:proposalId/status', auth, updateProposalStatus);

export default router;
