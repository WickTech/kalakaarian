import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { sendProposalStatusEmail } from '../services/emailService';

const PROPOSAL_SELECT = '*, campaigns!proposals_campaign_id_fkey(id, title, brand_id), profiles!proposals_influencer_id_fkey(name, email)';

export const updateProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can update proposals' }); return;
    }
    const { message, bidAmount } = req.body;
    const { data: existing } = await adminClient.from('proposals')
      .select('status').eq('id', req.params.id).eq('influencer_id', req.user.userId).single();
    if (!existing) { res.status(404).json({ message: 'Proposal not found' }); return; }
    if (existing.status !== 'submitted') { res.status(400).json({ message: 'Can only update submitted proposals' }); return; }

    const update: Record<string, unknown> = {};
    if (message) update.message = message;
    if (bidAmount) update.bid_amount = bidAmount;

    const { data, error } = await adminClient.from('proposals')
      .update(update)
      .eq('id', req.params.id)
      .select(PROPOSAL_SELECT)
      .single();
    if (error || !data) { res.status(500).json({ message: 'Update failed' }); return; }
    res.json({ proposal: data });
  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can delete proposals' }); return;
    }
    const { data: existing } = await adminClient.from('proposals')
      .select('status').eq('id', req.params.id).eq('influencer_id', req.user.userId).single();
    if (!existing) { res.status(404).json({ message: 'Proposal not found' }); return; }
    if (existing.status !== 'submitted') { res.status(400).json({ message: 'Can only delete submitted proposals' }); return; }

    await adminClient.from('proposals').delete().eq('id', req.params.id);
    res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const respondToProposalCore = async (req: AuthRequest, res: Response, proposalId: string): Promise<void> => {
  if (!req.user || req.user.role !== 'brand') {
    res.status(403).json({ message: 'Only brands can respond to proposals' }); return;
  }
  const { status } = req.body;

  const { data: proposal } = await adminClient.from('proposals')
    .select(PROPOSAL_SELECT)
    .eq('id', proposalId)
    .single();
  if (!proposal) { res.status(404).json({ message: 'Proposal not found' }); return; }

  const campaign = proposal.campaigns as any;
  if (campaign?.brand_id !== req.user.userId) {
    res.status(403).json({ message: 'Not authorized' }); return;
  }

  const { data: updated, error } = await adminClient.from('proposals')
    .update({ status })
    .eq('id', proposalId)
    .select(PROPOSAL_SELECT)
    .single();
  if (error || !updated) { res.status(500).json({ message: 'Update failed' }); return; }

  if (status === 'accepted') {
    await adminClient.from('campaigns').update({ status: 'closed' }).eq('id', campaign.id);
  }

  const inf = updated.profiles as any;
  if ((status === 'accepted' || status === 'rejected') && inf?.email) {
    sendProposalStatusEmail(inf.email, inf.name, campaign?.title ?? '', status as 'accepted' | 'rejected')
      .catch((e) => console.error('Proposal email failed:', e));
  }

  res.json({ proposal: updated });
};

export const respondToProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await respondToProposalCore(req, res, req.params.id);
  } catch (error) {
    console.error('Respond to proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProposalStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await respondToProposalCore(req, res, req.params.proposalId);
  } catch (error) {
    console.error('Update proposal status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
