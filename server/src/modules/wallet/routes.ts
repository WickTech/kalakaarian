import { Router } from 'express';
import { auth } from '../../middleware/auth';
import {
  getBrandTransactions,
  getBrandTransactionFilters,
  getWalletTransactions,
  requestWithdrawal,
} from './controller';

const router = Router();

router.get('/brand/transactions', auth, getBrandTransactions);
router.get('/brand/transactions/filters', auth, getBrandTransactionFilters);
router.get('/transactions', auth, getWalletTransactions);
router.post('/withdraw', auth, requestWithdrawal);

export default router;
