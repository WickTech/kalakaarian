import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

// "campaign_creators" replaces the legacy "proposals" table. A row represents
// a brand-selected creator attached to a campaign; the brand drives selection
// (cart -> checkout), creators never bid.
//
// Response field names are kept stable for the existing client (campaignTitle,
// influencerName, agreedPrice) but the on-the-wire shape no longer implies
// a creator-initiated proposal.

const SELECT = '*, campaigns!campaign_creators_campaign_id_fkey(title, brand_id, budget, status), profiles!campaign_creators_influencer_id_fkey(name, email)';

const formatRow = (row: any) => ({
  _id: row.id,
  campaignId: row.campaign_id,
  influencerId: row.influencer_id,
  campaignTitle: (row.campaigns as any)?.title ?? '',
  influencerName: (row.profiles as any)?.name ?? '',
  status: row.status,
  agreedPrice: row.agreed_price ?? 0,
  message: row.message ?? null,
  createdAt: row.created_at,
  workflow_stage: row.workflow_stage ?? null,
  workflow_stage_updated_at: row.workflow_stage_updated_at ?? null,
});

export const getCampaignCreators = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { status, campaignId } = req.query;

    if (req.user.role === 'brand') {
      let q = adminClient.from('campaign_creators').select(SELECT)
        .in('campaign_id',
          adminClient.from('campaigns').select('id').eq('brand_id', req.user.userId) as any,
        );
      if (campaignId) q = q.eq('campaign_id', campaignId as string);
      if (status) q = q.eq('status', status as string);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ campaignCreators: (data ?? []).map(formatRow) });
    } else {
      let q = adminClient.from('campaign_creators').select(SELECT).eq('influencer_id', req.user.userId);
      if (status) q = q.eq('status', status as string);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ campaignCreators: (data ?? []).map(formatRow) });
    }
  } catch (error) {
    console.error('getCampaignCreators error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyCampaignCreators = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only creators can view their campaigns' }); return;
    }
    const { status, campaignId } = req.query;
    let q = adminClient.from('campaign_creators')
      .select(SELECT)
      .eq('influencer_id', req.user.userId);
    if (status) q = q.eq('status', status as string);
    if (campaignId) q = q.eq('campaign_id', campaignId as string);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ campaignCreators: (data ?? []).map(formatRow) });
  } catch (error) {
    console.error('getMyCampaignCreators error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCampaignCreatorById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { data, error } = await adminClient.from('campaign_creators').select(SELECT).eq('id', req.params.id).single();
    if (error || !data) { res.status(404).json({ message: 'Not found' }); return; }

    const campaign = data.campaigns as any;
    if (data.influencer_id !== req.user.userId && campaign?.brand_id !== req.user.userId) {
      res.status(403).json({ message: 'Not authorized' }); return;
    }
    res.json({ campaignCreator: formatRow(data) });
  } catch (error) {
    console.error('getCampaignCreatorById error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
