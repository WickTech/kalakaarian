import { Router, RequestHandler } from 'express';
import { auth, AuthRequest } from '../../middleware/auth';
import { getInvoicePdf } from './invoiceController';

const router = Router();

router.get(
  '/:transactionId.pdf',
  auth as unknown as RequestHandler,
  ((req, res) => getInvoicePdf(req as AuthRequest, res)) as RequestHandler,
);

export default router;
