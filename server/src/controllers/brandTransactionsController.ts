import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

const VALID_STATUS = new Set(['pending', 'completed', 'failed', 'refunded']);

type Row = {
  id: string;
  amount: number | string;
  status: string;
  invoice_number: string | null;
  created_at: string;
  payment_method: string | null;
  transaction_id: string | null;
  campaign_id: string;
  influencer_id: string;
  campaigns: { id: string; title: string } | null;
  profiles: { id: string; name: string } | null;
};

export const getBrandTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Forbidden' }); return; }
  const brandId = req.user!.userId;

  const { creatorId, campaignId, from, to, status, limit } = req.query as Record<string, string | undefined>;

  let query = adminClient
    .from('transactions')
    .select(`
      id, amount, status, invoice_number, created_at,
      payment_method, transaction_id, campaign_id, influencer_id,
      campaigns:campaign_id(id, title),
      profiles:influencer_id(id, name)
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Number(limit) || 100, 200));

  if (creatorId)  query = query.eq('influencer_id', creatorId);
  if (campaignId) query = query.eq('campaign_id', campaignId);
  if (status && VALID_STATUS.has(status)) query = query.eq('status', status);
  if (from) query = query.gte('created_at', from);
  if (to)   query = query.lte('created_at', to);

  const { data, error } = await query;
  if (error) {
    console.error('brand transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
    return;
  }

  const transactions = (data as unknown as Row[] | null ?? []).map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    status: t.status,
    invoiceNumber: t.invoice_number,
    createdAt: t.created_at,
    paymentMethod: t.payment_method,
    transactionId: t.transaction_id,
    campaignId: t.campaign_id,
    campaignTitle: t.campaigns?.title ?? null,
    influencerId: t.influencer_id,
    influencerName: t.profiles?.name ?? null,
  }));

  res.json({ transactions });
};

export const getBrandTransactionFilters = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Forbidden' }); return; }
  const brandId = req.user!.userId;

  const { data, error } = await adminClient
    .from('transactions')
    .select('campaign_id, influencer_id, campaigns:campaign_id(id, title), profiles:influencer_id(id, name)')
    .eq('brand_id', brandId)
    .limit(500);

  if (error) {
    console.error('brand transaction filters error:', error);
    res.status(500).json({ message: 'Failed to fetch filters' });
    return;
  }

  const campaignMap = new Map<string, string>();
  const creatorMap  = new Map<string, string>();
  type FilterRow = { campaigns: { id: string; title: string } | null; profiles: { id: string; name: string } | null };
  (data as unknown as FilterRow[] | null ?? []).forEach((r) => {
    if (r.campaigns?.id) campaignMap.set(r.campaigns.id, r.campaigns.title);
    if (r.profiles?.id)  creatorMap.set(r.profiles.id, r.profiles.name);
  });

  res.json({
    campaigns: [...campaignMap].map(([id, title]) => ({ id, title })),
    creators:  [...creatorMap ].map(([id, name])  => ({ id, name  })),
  });
};
