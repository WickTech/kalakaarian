import { Router, Response } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/brand', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Only brands can view this analytics' }); return; }
    const userId = req.user!.userId;

    const [total, open, closed, brandCampaignsResult] = await Promise.all([
      adminClient.from('campaigns').select('id', { count: 'exact', head: true }).eq('brand_id', userId),
      adminClient.from('campaigns').select('id', { count: 'exact', head: true }).eq('brand_id', userId).eq('status', 'open'),
      adminClient.from('campaigns').select('id', { count: 'exact', head: true }).eq('brand_id', userId).eq('status', 'closed'),
      adminClient.from('campaigns').select('id').eq('brand_id', userId),
    ]);
    const campaignIds = (brandCampaignsResult.data ?? []).map((c: { id: string }) => c.id);

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

router.get('/brand/deep', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'brand') { res.status(403).json({ message: 'Forbidden' }); return; }
    const brandId = req.user!.userId;

    const { data: campaigns } = await adminClient.from('campaigns').select('id, title').eq('brand_id', brandId);
    const campaignIds = (campaigns || []).map((c: any) => c.id);
    if (campaignIds.length === 0) {
      res.json({ stageBreakdown: [], topCampaigns: [], avgBid: 0, completedCount: 0 }); return;
    }
    const titleMap: Record<string, string> = {};
    (campaigns || []).forEach((c: any) => { titleMap[c.id] = c.title; });

    const { data: proposals } = await adminClient
      .from('proposals').select('bid_amount, workflow_stage, campaign_id').in('campaign_id', campaignIds);
    const all = proposals || [];

    const stageCounts: Record<string, number> = {};
    const campaignStats: Record<string, { id: string; title: string; proposalCount: number; workflowCount: number }> = {};
    all.forEach((p: any) => {
      if (p.workflow_stage) stageCounts[p.workflow_stage] = (stageCounts[p.workflow_stage] || 0) + 1;
      if (!campaignStats[p.campaign_id]) {
        campaignStats[p.campaign_id] = { id: p.campaign_id, title: titleMap[p.campaign_id] || 'Unknown', proposalCount: 0, workflowCount: 0 };
      }
      campaignStats[p.campaign_id].proposalCount++;
      if (p.workflow_stage) campaignStats[p.campaign_id].workflowCount++;
    });

    const workflowAll = all.filter((p: any) => p.workflow_stage);
    const avgBid = workflowAll.length > 0
      ? Math.round(workflowAll.reduce((s: number, p: any) => s + (p.bid_amount ?? 0), 0) / workflowAll.length)
      : 0;

    res.json({
      stageBreakdown: Object.entries(stageCounts).map(([stage, count]) => ({ stage, count })),
      topCampaigns: Object.values(campaignStats).sort((a, b) => b.proposalCount - a.proposalCount).slice(0, 5),
      avgBid,
      completedCount: all.filter((p: any) => p.workflow_stage === 'payment_released').length,
    });
  } catch (error) {
    console.error('Brand deep analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/influencer/deep', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'influencer') { res.status(403).json({ message: 'Forbidden' }); return; }
    const userId = req.user!.userId;

    const [proposalsRes, profileRes] = await Promise.all([
      adminClient.from('proposals').select('workflow_stage, bid_amount').eq('influencer_id', userId),
      adminClient.from('influencer_profiles').select('avg_rating, rating_count').eq('id', userId).single(),
    ]);

    const proposals = proposalsRes.data || [];
    const profile = profileRes.data;
    const stageCounts: Record<string, number> = {};
    proposals.forEach((p: any) => {
      if (p.workflow_stage) stageCounts[p.workflow_stage] = (stageCounts[p.workflow_stage] || 0) + 1;
    });
    const workflowCount = proposals.filter((p: any) => p.workflow_stage).length;
    const completedCount = proposals.filter((p: any) => p.workflow_stage === 'payment_released').length;

    res.json({
      completedCount,
      completionRate: workflowCount > 0 ? Math.round(completedCount / workflowCount * 100) : 0,
      avgRating: profile?.avg_rating ? Number(profile.avg_rating) : null,
      ratingCount: profile?.rating_count ?? 0,
      stageBreakdown: Object.entries(stageCounts).map(([stage, count]) => ({ stage, count })),
    });
  } catch (error) {
    console.error('Influencer deep analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
