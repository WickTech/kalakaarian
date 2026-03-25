import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  submitProposal,
  getProposals,
  updateProposalStatus,
} from '../controllers/campaignController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

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
    body('price').isNumeric().withMessage('Price must be a number'),
  ],
  validate,
  submitProposal
);

router.get('/:id/proposals', auth, getProposals);

router.put('/proposals/:proposalId/status', auth, updateProposalStatus);

export default router;
