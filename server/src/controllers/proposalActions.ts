import { Response } from 'express';
import Proposal from '../models/Proposal';
import Campaign from '../models/Campaign';
import { AuthRequest } from '../middleware/auth';
import { sendProposalStatusEmail } from '../services/emailService';

export const updateProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can update proposals' }); return;
    }
    const { message, bidAmount, timeline } = req.body;
    const proposal = await Proposal.findOne({ _id: req.params.id, influencerId: req.user.userId });
    if (!proposal) { res.status(404).json({ message: 'Proposal not found' }); return; }
    if (proposal.status !== 'pending') { res.status(400).json({ message: 'Can only update pending proposals' }); return; }

    if (message) proposal.message = message;
    if (bidAmount) proposal.bidAmount = bidAmount;
    if (timeline) proposal.timeline = timeline;
    await proposal.save();
    await proposal.populate('influencerId', 'name email');
    await proposal.populate('campaignId', 'title');
    res.json({ proposal });
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
    const proposal = await Proposal.findOne({ _id: req.params.id, influencerId: req.user.userId });
    if (!proposal) { res.status(404).json({ message: 'Proposal not found' }); return; }
    if (proposal.status !== 'pending') { res.status(400).json({ message: 'Can only delete pending proposals' }); return; }
    await Proposal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Brand responds to a proposal (accept/reject/negotiate)
export const respondToProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can respond to proposals' }); return;
    }
    const { status } = req.body;
    const proposal = await Proposal.findById(req.params.id).populate('campaignId');
    if (!proposal) { res.status(404).json({ message: 'Proposal not found' }); return; }

    const campaign = await Campaign.findById(proposal.campaignId);
    if (!campaign || campaign.brandId.toString() !== req.user.userId) {
      res.status(403).json({ message: 'Not authorized' }); return;
    }
    proposal.status = status;
    await proposal.save();
    if (status === 'accepted') { campaign.status = 'in_progress'; await campaign.save(); }
    await proposal.populate('influencerId', 'name email');
    await proposal.populate('campaignId', 'title');

    if (status === 'accepted' || status === 'rejected') {
      const inf = proposal.influencerId as any;
      const camp = proposal.campaignId as any;
      if (inf?.email) {
        sendProposalStatusEmail(inf.email, inf.name, camp?.title ?? '', status as 'accepted' | 'rejected')
          .catch((e) => console.error('Proposal email failed:', e));
      }
    }

    res.json({ proposal });
  } catch (error) {
    console.error('Respond to proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/campaigns/proposals/:proposalId/status — brand changes via campaign route
export const updateProposalStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can update proposal status' }); return;
    }
    const { proposalId } = req.params;
    const { status } = req.body;
    const proposal = await Proposal.findById(proposalId).populate('campaignId');
    if (!proposal) { res.status(404).json({ message: 'Proposal not found' }); return; }

    const campaign = await Campaign.findById(proposal.campaignId);
    if (!campaign || campaign.brandId.toString() !== req.user.userId) {
      res.status(403).json({ message: 'Not authorized' }); return;
    }
    proposal.status = status;
    await proposal.save();
    if (status === 'accepted') { campaign.status = 'in_progress'; await campaign.save(); }
    await proposal.populate('influencerId', 'name email');
    await proposal.populate('campaignId', 'title');

    if (status === 'accepted' || status === 'rejected') {
      const inf = proposal.influencerId as any;
      const camp = proposal.campaignId as any;
      if (inf?.email) {
        sendProposalStatusEmail(inf.email, inf.name, camp?.title ?? '', status as 'accepted' | 'rejected')
          .catch((e) => console.error('Proposal email failed:', e));
      }
    }

    res.json({ proposal });
  } catch (error) {
    console.error('Update proposal status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
