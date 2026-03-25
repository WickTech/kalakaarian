import { Request, Response } from 'express';
import { Campaign } from '../models/Campaign';
import { Proposal } from '../models/Proposal';
import { BrandProfile } from '../models/BrandProfile';
import { InfluencerProfile } from '../models/InfluencerProfile';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getCampaigns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status, page = 1, limit = 20 } = req.query;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let query: Record<string, unknown> = {};

    if (user.role === 'BRAND') {
      const brandProfile = await BrandProfile.findOne({ userId });
      if (brandProfile) {
        query.brandId = brandProfile._id;
      }
    } else if (user.role === 'INFLUENCER') {
      query.status = 'OPEN';
    }

    if (status) {
      query.status = status;
    }

    const campaigns = await Campaign.find(query)
      .populate('brandId', 'companyName industry')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id).populate('brandId', 'companyName industry website');

    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }

    res.json({ campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'BRAND') {
      res.status(403).json({ message: 'Only brands can create campaigns' });
      return;
    }

    const brandProfile = await BrandProfile.findOne({ userId });
    if (!brandProfile) {
      res.status(400).json({ message: 'Brand profile not found' });
      return;
    }

    const { title, description, budget, deadline, deliverables, requirements, status } = req.body;

    const campaign = await Campaign.create({
      brandId: brandProfile._id,
      title,
      description,
      budget,
      deadline,
      deliverables,
      requirements,
      status: status || 'OPEN',
    });

    res.status(201).json({ campaign });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const brandProfile = await BrandProfile.findOne({ userId });
    if (!brandProfile) {
      res.status(403).json({ message: 'Only brands can update campaigns' });
      return;
    }

    const campaign = await Campaign.findOne({ _id: id, brandId: brandProfile._id });
    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }

    const { title, description, budget, deadline, deliverables, requirements, status } = req.body;

    campaign.title = title || campaign.title;
    campaign.description = description || campaign.description;
    campaign.budget = budget || campaign.budget;
    campaign.deadline = deadline || campaign.deadline;
    campaign.deliverables = deliverables || campaign.deliverables;
    campaign.requirements = requirements || campaign.requirements;
    campaign.status = status || campaign.status;

    await campaign.save();

    res.json({ campaign });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const brandProfile = await BrandProfile.findOne({ userId });
    if (!brandProfile) {
      res.status(403).json({ message: 'Only brands can delete campaigns' });
      return;
    }

    const campaign = await Campaign.findOneAndDelete({ _id: id, brandId: brandProfile._id });
    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }

    await Proposal.deleteMany({ campaignId: id });

    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const submitProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id: campaignId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'INFLUENCER') {
      res.status(403).json({ message: 'Only influencers can submit proposals' });
      return;
    }

    const influencerProfile = await InfluencerProfile.findOne({ userId });
    if (!influencerProfile) {
      res.status(400).json({ message: 'Influencer profile not found' });
      return;
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }

    if (campaign.status !== 'OPEN') {
      res.status(400).json({ message: 'Campaign is not accepting proposals' });
      return;
    }

    const existingProposal = await Proposal.findOne({ campaignId, influencerId: influencerProfile._id });
    if (existingProposal) {
      res.status(400).json({ message: 'Already submitted a proposal' });
      return;
    }

    const { bidAmount, message } = req.body;

    const proposal = await Proposal.create({
      campaignId,
      influencerId: influencerProfile._id,
      bidAmount,
      message,
    });

    campaign.proposalCount = (campaign.proposalCount || 0) + 1;
    await campaign.save();

    res.status(201).json({ proposal });
  } catch (error) {
    console.error('Submit proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProposals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { campaignId } = req.query;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let proposals;

    if (user.role === 'BRAND') {
      const brandProfile = await BrandProfile.findOne({ userId });
      if (!brandProfile) {
        res.status(400).json({ message: 'Brand profile not found' });
        return;
      }

      const campaigns = await Campaign.find({ brandId: brandProfile._id }).select('_id');
      const campaignIds = campaigns.map(c => c._id);

      const query: Record<string, unknown> = { campaignId: { $in: campaignIds } };
      if (campaignId) {
        query.campaignId = campaignId;
      }

      proposals = await Proposal.find(query)
        .populate('campaignId', 'title')
        .populate('influencerId', 'niche bio followers')
        .sort({ createdAt: -1 });
    } else if (user.role === 'INFLUENCER') {
      const influencerProfile = await InfluencerProfile.findOne({ userId });
      if (!influencerProfile) {
        res.status(400).json({ message: 'Influencer profile not found' });
        return;
      }

      proposals = await Proposal.find({ influencerId: influencerProfile._id })
        .populate('campaignId', 'title status budget')
        .sort({ createdAt: -1 });
    }

    res.json({ proposals });
  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProposalStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { proposalId } = req.params;
    const { status } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const brandProfile = await BrandProfile.findOne({ userId });
    if (!brandProfile) {
      res.status(403).json({ message: 'Only brands can update proposals' });
      return;
    }

    const proposal = await Proposal.findById(proposalId).populate('campaignId');
    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    const campaign = await Campaign.findById(proposal.campaignId);
    if (!campaign || campaign.brandId.toString() !== brandProfile._id.toString()) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    proposal.status = status;
    await proposal.save();

    if (status === 'ACCEPTED') {
      campaign.status = 'IN_PROGRESS';
      await campaign.save();

      await Proposal.updateMany(
        { campaignId: proposal.campaignId, _id: { $ne: proposal._id } },
        { status: 'REJECTED' }
      );
    }

    res.json({ proposal });
  } catch (error) {
    console.error('Update proposal status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
