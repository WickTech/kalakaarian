import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
  respondToProposal,
} from '../controllers/proposalController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/', auth, getProposals);

router.get('/:id', auth, getProposalById);

router.post(
  '/',
  auth,
  [
    body('campaignId').notEmpty().withMessage('Campaign ID is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
  ],
  validate,
  createProposal
);

router.put('/:id', auth, updateProposal);

router.delete('/:id', auth, deleteProposal);

router.post(
  '/:id/respond',
  auth,
  [body('status').isIn(['accepted', 'rejected', 'negotiating']).withMessage('Invalid status')],
  validate,
  respondToProposal
);

export default router;
