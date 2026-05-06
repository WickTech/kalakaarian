import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth';
import { getWorkflow, getActivityLog } from '../controllers/workflowController';
import {
  shortlist,
  acceptWorkflow,
  startContent,
  submitContent,
  approveContent,
  requestRevision,
  sendFeedback,
  markPaymentPending,
  releasePayment,
  rejectWorkflow,
} from '../controllers/workflowActions';

const router = Router({ mergeParams: true });

const FEEDBACK_CATEGORIES = ['creative', 'brief_match', 'quality', 'timing', 'compliance'];
const FEEDBACK_SEVERITIES = ['minor', 'major', 'blocking'];

const feedbackValidators = [
  body('category').isIn(FEEDBACK_CATEGORIES).withMessage('Invalid feedback category'),
  body('severity').isIn(FEEDBACK_SEVERITIES).withMessage('Invalid severity'),
  body('required_changes').isArray({ min: 1, max: 10 }).withMessage('1–10 required changes'),
  body('required_changes.*').isString().isLength({ max: 200 }).withMessage('Each change ≤ 200 chars'),
  body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes ≤ 500 chars'),
];

router.get('/', auth, getWorkflow);
router.get('/activity', auth, getActivityLog);

router.post('/shortlist', auth, shortlist);
router.post('/accept', auth, acceptWorkflow);
router.post('/start', auth, startContent);

router.post(
  '/submit',
  auth,
  [
    body('url').notEmpty().withMessage('Content URL required'),
    body('platform').notEmpty().withMessage('Platform required'),
    body('notes').optional().isString().isLength({ max: 500 }),
  ],
  submitContent,
);

router.post('/approve', auth, approveContent);

router.post('/request-revision', auth, feedbackValidators, requestRevision);
router.post('/feedback', auth, feedbackValidators, sendFeedback);

router.post(
  '/mark-payment-pending',
  auth,
  [body('transaction_ref').notEmpty().withMessage('Transaction reference required')],
  markPaymentPending,
);

router.post(
  '/release-payment',
  auth,
  [body('transaction_ref').notEmpty().withMessage('Transaction reference required')],
  releasePayment,
);

router.post(
  '/reject',
  auth,
  [body('current_stage').notEmpty().withMessage('current_stage required')],
  rejectWorkflow,
);

export default router;
