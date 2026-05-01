import { Router, Response } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/brand', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Only brands can view this analytics' }); return; }
    const userId = req.user!.userId;

    const [total, open, closed] = await Promise.all([
      adminClient.from('campaigns').select('id', { count: 'exact', head: true }).eq('brand_id', userId),
      adminClient.from('campaigns').select('id', { count: 'exact', head: true }).eq('brand_id', userId).eq('status', 'open'),
      adminClient.from('campaigns').select('id', { count: 'exact', head: true }).eq('brand_id', userId).eq('status', 'closed'),
    ]);

    // Get proposals for brand's campaigns
    const { data: brandCampaigns } = await adminClient.from('campaigns').select('id').eq('brand_id', userId);
    const campaignIds = (brandCampaigns ?? []).map((c: { id: string }) => c.id);

    const [totalProps, acceptedProps, rejectedProps] = await Promise.all([
      adminClient.from('proposals').select('id', { count: 'exact', head: true }).in('campaign_id', campaignIds),
      adminClient.from('proposals').select('bid_amount').in('campaign_id', campaignIds).eq('status', 'accepted'),
      adminClient.from('proposals').select('id', { count: 'exact', head: true }).in('campaign_id', campaignIds).eq('status', 'rejected'),
    ]);

    const totalSpent = (acceptedProps.data ?? []).reduce((sum: number, p: { bid_amount?: number | null }) => sum + (p.bid_amount ?? 0), 0);

    res.json({
      campaigns: { total: total.count ?? 0, open: open.count ?? 0, inProgress: 0, completed: closed.count ?? 0 },
      proposals: {
        total: totalProps.count ?? 0,
        accepted: (acceptedProps.data ?? []).length,
        pending: Math.max(0, (totalProps.count ?? 0) - (acceptedProps.data ?? []).length - (rejectedProps.count ?? 0)),
        rejected: rejectedProps.count ?? 0,
      },
      spend: totalSpent,
    });
  } catch (error) {
    console.error('Brand analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/influencer', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'influencer') { res.status(403).json({ message: 'Only influencers can view this analytics' }); return; }
    const userId = req.user!.userId;

    const [total, accepted, rejected] = await Promise.all([
      adminClient.from('proposals').select('id', { count: 'exact', head: true }).eq('influencer_id', userId),
      adminClient.from('proposals').select('bid_amount').eq('influencer_id', userId).eq('status', 'accepted'),
      adminClient.from('proposals').select('id', { count: 'exact', head: true }).eq('influencer_id', userId).eq('status', 'rejected'),
    ]);

    const totalCount = total.count ?? 0;
    const acceptedCount = (accepted.data ?? []).length;
    const totalEarnings = (accepted.data ?? []).reduce((sum: number, p: { bid_amount?: number | null }) => sum + (p.bid_amount ?? 0), 0);

    res.json({
      proposals: {
        total: totalCount,
        accepted: acceptedCount,
        pending: Math.max(0, totalCount - acceptedCount - (rejected.count ?? 0)),
        rejected: rejected.count ?? 0,
      },
      earnings: totalEarnings,
      acceptedRate: totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0,
    });
  } catch (error) {
    console.error('Influencer analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
