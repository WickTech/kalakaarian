import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

const PROPOSAL_SELECT = '*, campaigns!proposals_campaign_id_fkey(title, brand_id, budget, status), profiles!proposals_influencer_id_fkey(name, email)';

export const getProposals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { status, campaignId } = req.query;

    if (req.user.role === 'brand') {
      let q = adminClient.from('proposals').select(PROPOSAL_SELECT)
        .in('campaign_id',
          adminClient.from('campaigns').select('id').eq('brand_id', req.user.userId) as any
        );
      if (campaignId) q = q.eq('campaign_id', campaignId as string);
      if (status) q = q.eq('status', status as string);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ proposals: data ?? [] });
    } else {
      let q = adminClient.from('proposals').select(PROPOSAL_SELECT).eq('influencer_id', req.user.userId);
      if (status) q = q.eq('status', status as string);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ proposals: data ?? [] });
    }
  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyProposals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can view their proposals' }); return;
    }
    const { status, campaignId } = req.query;
    let q = adminClient.from('proposals')
      .select('*, campaigns!proposals_campaign_id_fkey(title, budget, status)')
      .eq('influencer_id', req.user.userId);
    if (status) q = q.eq('status', status as string);
    if (campaignId) q = q.eq('campaign_id', campaignId as string);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ proposals: data ?? [] });
  } catch (error) {
    console.error('Get my proposals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProposalById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { data, error } = await adminClient.from('proposals').select(PROPOSAL_SELECT).eq('id', req.params.id).single();
    if (error || !data) { res.status(404).json({ message: 'Proposal not found' }); return; }

    const campaign = data.campaigns as any;
    if (data.influencer_id !== req.user.userId && campaign?.brand_id !== req.user.userId) {
      res.status(403).json({ message: 'Not authorized' }); return;
    }
    res.json({ proposal: data });
  } catch (error) {
    console.error('Get proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createProposalDoc = async (campaignId: string, influencerId: string, message: string, bidAmount: number) => {
  const { data: campaign } = await adminClient.from('campaigns').select('id, status').eq('id', campaignId).single();
  if (!campaign) return { error: 'Campaign not found', status: 404 };
  if (campaign.status !== 'open') return { error: 'Campaign is not accepting proposals', status: 400 };

  const { data, error } = await adminClient.from('proposals').insert({
    campaign_id: campaignId,
    influencer_id: influencerId,
    message,
    bid_amount: bidAmount,
    status: 'submitted',
  }).select(PROPOSAL_SELECT).single();

  if (error) {
    if (error.code === '23505') return { error: 'You have already submitted a proposal', status: 400 };
    return { error: error.message, status: 500 };
  }
  return { proposal: data };
};

export const createProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can create proposals' }); return;
    }
    const { campaignId, message, bidAmount } = req.body;
    const result = await createProposalDoc(campaignId, req.user.userId, message, bidAmount);
    if (result.error) { res.status(result.status!).json({ message: result.error }); return; }
    res.status(201).json({ proposal: result.proposal });
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const submitProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can submit proposals' }); return;
    }
    const { message, bidAmount } = req.body;
    const result = await createProposalDoc(req.params.id, req.user.userId, message, bidAmount);
    if (result.error) { res.status(result.status!).json({ message: result.error }); return; }
    res.status(201).json({ proposal: result.proposal });
  } catch (error) {
    console.error('Submit proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
