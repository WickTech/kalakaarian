import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign, getOpenCampaigns,
} from '../controllers/campaignController';
import { submitProposal, getProposals } from '../controllers/proposalController';
import { updateProposalStatus } from '../controllers/proposalActions';
import { auth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/open', optionalAuth, getOpenCampaigns);
router.get('/', auth, getCampaigns);
router.get('/:id', auth, getCampaignById);

router.post(
  '/',
  auth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('budget').isNumeric().withMessage('Budget must be a number'),
    body('deadline').isISO8601().withMessage('Valid deadline is required'),
  ],
  validate,
  createCampaign
);

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
