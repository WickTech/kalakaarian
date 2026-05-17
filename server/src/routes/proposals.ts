import { Router } from 'express';
import { body } from 'express-validator';
import { getProposals, getProposalById, getMyProposals } from '../controllers/proposalController';
import { respondToProposal } from '../controllers/proposalActions';
import { submitRating, getProposalRating } from '../controllers/ratingController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/my', auth, getMyProposals);
router.get('/', auth, getProposals);
router.get('/:id', auth, getProposalById);

router.get('/:id/rating', auth, getProposalRating);
router.post('/:id/rate', auth, submitRating);

router.post(
  '/:id/respond',
  auth,
  [body('status').isIn(['accepted', 'rejected', 'negotiating']).withMessage('Invalid status')],
  validate,
  respondToProposal
);

export default router;
