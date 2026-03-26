import { Request, Response } from 'express';
import Proposal from '../models/Proposal';
import Campaign from '../models/Campaign';
import { AuthRequest } from '../middleware/auth';

export const getProposals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { status, campaignId } = req.query;

    if (req.user.role === 'brand') {
      const campaigns = await Campaign.find({ brandId: req.user.userId }).select('_id');
      const campaignIds = campaigns.map((c) => c._id);

      const query: any = { campaignId: { $in: campaignIds } };
      if (campaignId) query.campaignId = campaignId;
      if (status) query.status = status;

      const proposals = await Proposal.find(query)
        .populate('influencerId', 'name email')
        .populate('campaignId', 'title')
        .sort({ createdAt: -1 });

      res.json({ proposals });
    } else {
      const query: any = { influencerId: req.user.userId };
      if (status) query.status = status;

      const proposals = await Proposal.find(query)
        .populate('campaignId', 'title')
        .sort({ createdAt: -1 });

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
      res.status(403).json({ message: 'Only influencers can view their proposals' });
      return;
    }

    const { status, campaignId } = req.query;

    const query: any = { influencerId: req.user.userId };
    if (status) query.status = status;
    if (campaignId) query.campaignId = campaignId;

    const proposals = await Proposal.find(query)
      .populate('campaignId', 'title budget status')
      .sort({ createdAt: -1 });

    res.json({ proposals });
  } catch (error) {
    console.error('Get my proposals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProposalById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const proposal = await Proposal.findById(id)
      .populate('influencerId', 'name email')
      .populate('campaignId', 'title description budget');

    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    const campaign = await Campaign.findById(proposal.campaignId);
    const influencerUserId = (proposal.influencerId as any)._id || proposal.influencerId;
    const campaignBrandId = (campaign as any)?.brandId;
    
    if (
      String(influencerUserId) !== req.user.userId &&
      String(campaignBrandId) !== req.user.userId
    ) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    res.json({ proposal });
  } catch (error) {
    console.error('Get proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can create proposals' });
      return;
    }

    const { campaignId, message, price } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }

    if (campaign.status !== 'open') {
      res.status(400).json({ message: 'Campaign is not accepting proposals' });
      return;
    }

    const existingProposal = await Proposal.findOne({
      campaignId,
      influencerId: req.user.userId,
    });
    if (existingProposal) {
      res.status(400).json({ message: 'You have already submitted a proposal' });
      return;
    }

    const proposal = await Proposal.create({
      campaignId,
      influencerId: req.user.userId,
      message,
      price,
      status: 'pending',
    });

    await proposal.populate('influencerId', 'name email');
    await proposal.populate('campaignId', 'title');

    res.status(201).json({ proposal });
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can update proposals' });
      return;
    }

    const { id } = req.params;
    const { message, bidAmount, timeline } = req.body;

    const proposal = await Proposal.findOne({ _id: id, influencerId: req.user.userId });
    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    if (proposal.status !== 'pending') {
      res.status(400).json({ message: 'Can only update pending proposals' });
      return;
    }

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
      res.status(403).json({ message: 'Only influencers can delete proposals' });
      return;
    }

    const { id } = req.params;

    const proposal = await Proposal.findOne({ _id: id, influencerId: req.user.userId });
    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    if (proposal.status !== 'pending') {
      res.status(400).json({ message: 'Can only delete pending proposals' });
      return;
    }

    await Proposal.findByIdAndDelete(id);

    res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const respondToProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can respond to proposals' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const proposal = await Proposal.findById(id).populate('campaignId');
    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    const campaign = await Campaign.findById(proposal.campaignId);
    if (!campaign || campaign.brandId.toString() !== req.user.userId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    proposal.status = status;
    await proposal.save();

    if (status === 'accepted') {
      campaign.status = 'in_progress';
      await campaign.save();
    }

    await proposal.populate('influencerId', 'name email');
    await proposal.populate('campaignId', 'title');

    res.json({ proposal });
  } catch (error) {
    console.error('Respond to proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
