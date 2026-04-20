import { Response } from 'express';
import Proposal from '../models/Proposal';
import Campaign from '../models/Campaign';
import { AuthRequest } from '../middleware/auth';

export const getProposals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { status, campaignId } = req.query;

    if (req.user.role === 'brand') {
      const campaigns = await Campaign.find({ brandId: req.user.userId }).select('_id');
      const campaignIds = campaigns.map((c) => c._id);
      const query: any = { campaignId: { $in: campaignIds } };
      if (campaignId) query.campaignId = campaignId;
      if (status) query.status = status;
      const proposals = await Proposal.find(query)
        .populate('influencerId', 'name email').populate('campaignId', 'title').sort({ createdAt: -1 });
      res.json({ proposals });
    } else {
      const query: any = { influencerId: req.user.userId };
      if (status) query.status = status;
      const proposals = await Proposal.find(query).populate('campaignId', 'title').sort({ createdAt: -1 });
      res.json({ proposals });
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
    const query: any = { influencerId: req.user.userId };
    if (status) query.status = status;
    if (campaignId) query.campaignId = campaignId;
    const proposals = await Proposal.find(query).populate('campaignId', 'title budget status').sort({ createdAt: -1 });
    res.json({ proposals });
  } catch (error) {
    console.error('Get my proposals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProposalById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const proposal = await Proposal.findById(req.params.id)
      .populate('influencerId', 'name email').populate('campaignId', 'title description budget');
    if (!proposal) { res.status(404).json({ message: 'Proposal not found' }); return; }

    const campaign = await Campaign.findById(proposal.campaignId);
    const influencerUserId = (proposal.influencerId as any)._id || proposal.influencerId;
    if (String(influencerUserId) !== req.user.userId && String((campaign as any)?.brandId) !== req.user.userId) {
      res.status(403).json({ message: 'Not authorized' }); return;
    }
    res.json({ proposal });
  } catch (error) {
    console.error('Get proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createProposalDoc = async (campaignId: string, influencerId: string, message: string, bidAmount: number, timeline?: string) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return { error: 'Campaign not found', status: 404 };
  if (campaign.status !== 'open') return { error: 'Campaign is not accepting proposals', status: 400 };
  const existing = await Proposal.findOne({ campaignId, influencerId });
  if (existing) return { error: 'You have already submitted a proposal', status: 400 };
  const proposal = await Proposal.create({ campaignId, influencerId, message, bidAmount, timeline, status: 'pending' });
  await proposal.populate('influencerId', 'name email');
  await proposal.populate('campaignId', 'title');
  return { proposal };
};

// POST /api/proposals — body contains campaignId
export const createProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can create proposals' }); return;
    }
    const { campaignId, message, bidAmount, timeline } = req.body;
    const result = await createProposalDoc(campaignId, req.user.userId, message, bidAmount, timeline);
    if (result.error) { res.status(result.status!).json({ message: result.error }); return; }
    res.status(201).json({ proposal: result.proposal });
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/campaigns/:id/proposals — campaignId from URL
export const submitProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can submit proposals' }); return;
    }
    const { message, bidAmount, timeline } = req.body;
    const result = await createProposalDoc(req.params.id, req.user.userId, message, bidAmount, timeline);
    if (result.error) { res.status(result.status!).json({ message: result.error }); return; }
    res.status(201).json({ proposal: result.proposal });
  } catch (error) {
    console.error('Submit proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
