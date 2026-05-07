import { Router, RequestHandler } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { adminClient } from '../config/supabase';
import { sendWithdrawalRequestEmail } from '../services/emailService';

const router = Router();

router.get('/transactions', auth as unknown as RequestHandler, (async (req, res) => {
  const userId = (req as AuthRequest).user!.userId;
  try {
    const { data, error } = await adminClient
      .from('transactions')
      .select('id, amount, type, status, created_at, campaign_id, campaigns(title)')
      .eq('influencer_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    const transactions = (data || []).map((t: Record<string, unknown>) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      status: t.status,
      createdAt: t.created_at,
      campaignTitle: (t.campaigns as { title?: string } | null)?.title ?? null,
    }));
    res.json({ transactions });
  } catch (err) {
    console.error('wallet transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}) as RequestHandler);

router.post('/withdraw', auth as unknown as RequestHandler, (async (req, res) => {
  const { userId } = (req as AuthRequest).user!;
  const { amount, upiId } = req.body as { amount?: number; upiId?: string };

  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
  if (!upiId || typeof upiId !== 'string' || !upiId.trim()) {
    return res.status(400).json({ error: 'UPI ID required' });
  }

  try {
    const { data: profile, error: profErr } = await adminClient
      .from('profiles')
      .select('name, email')
      .eq('id', userId)
      .single();
    if (profErr) throw profErr;

    const { error: insertErr } = await adminClient
      .from('withdrawal_requests')
      .insert({ influencer_id: userId, amount, upi_id: upiId.trim() });
    if (insertErr) throw insertErr;

    await sendWithdrawalRequestEmail(
      (profile as { name?: string; email?: string })?.name || 'Influencer',
      (profile as { name?: string; email?: string })?.email || '',
      amount,
      upiId.trim()
    );

    res.json({ message: 'Withdrawal request submitted. Processed within 5–7 business days.' });
  } catch (err) {
    console.error('wallet withdraw error:', err);
    res.status(500).json({ error: 'Failed to submit withdrawal request' });
  }
}) as RequestHandler);

export default router;
