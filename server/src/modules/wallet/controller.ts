import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './service';
import type { BrandTxFilter } from './types';

// Thin HTTP handlers for the wallet domain.

export const getBrandTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Forbidden' }); return; }
  try {
    const transactions = await service.getBrandTransactions(
      req.user!.userId,
      req.query as BrandTxFilter,
    );
    res.json({ transactions });
  } catch (err) {
    console.error('brand transactions error:', err);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

export const getBrandTransactionFilters = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Forbidden' }); return; }
  try {
    res.json(await service.getBrandTransactionFilters(req.user!.userId));
  } catch (err) {
    console.error('brand transaction filters error:', err);
    res.status(500).json({ message: 'Failed to fetch filters' });
  }
};

export const getWalletTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'influencer') { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    const transactions = await service.getWalletTransactions(req.user!.userId);
    res.json({ transactions });
  } catch (err) {
    console.error('wallet transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const requestWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'influencer') { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    const result = await service.requestWithdrawal(req.user!.userId, req.body);
    if (result.kind === 'invalid') {
      res.status(400).json({ error: result.message });
      return;
    }
    res.json({ message: result.message });
  } catch (err) {
    console.error('wallet withdraw error:', err);
    res.status(500).json({ error: 'Failed to submit withdrawal request' });
  }
};
