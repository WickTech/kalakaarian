import { Router, Response } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/brand/campaigns/history', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Forbidden' }); return; }
    const userId = req.user!.userId;

    const { data: campaigns } = await adminClient
      .from('campaigns')
      .select('id, title, status, created_at, deadline')
      .eq('brand_id', userId)
      .in('status', ['closed', 'archived'])
      .order('created_at', { ascending: false })
      .limit(20);

    const ids = (campaigns || []).map((c: { id: string }) => c.id);
    const { data: proposals } = ids.length
      ? await adminClient.from('proposals').select('campaign_id, bid_amount, status, workflow_stage').in('campaign_id', ids)
      : { data: [] };

    interface CampaignStats { accepted: number; completed: number; totalSpend: number; }
    const stats: Record<string, CampaignStats> = {};
    (proposals || []).forEach((p: { campaign_id: string; bid_amount?: number | null; status: string; workflow_stage?: string | null }) => {
      if (!stats[p.campaign_id]) stats[p.campaign_id] = { accepted: 0, completed: 0, totalSpend: 0 };
      if (p.status === 'accepted') { stats[p.campaign_id].accepted++; stats[p.campaign_id].totalSpend += p.bid_amount ?? 0; }
      if (p.workflow_stage === 'payment_released') stats[p.campaign_id].completed++;
    });

    res.json({
      campaigns: (campaigns || []).map((c: { id: string; title: string; status: string; created_at: string; deadline: string | null }) => ({
        id: c.id, title: c.title, status: c.status,
        createdAt: c.created_at, deadline: c.deadline,
        ...( stats[c.id] || { accepted: 0, completed: 0, totalSpend: 0 }),
      })),
    });
  } catch (error) {
    console.error('Campaign history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
