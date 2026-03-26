import { Request, Response } from 'express';
import Campaign from '../models/Campaign';
import Proposal from '../models/Proposal';
import { AuthRequest } from '../middleware/auth';

export const getCampaigns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { status, genre, platform, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (req.user.role === 'brand') {
      query.brandId = req.user.userId;
    } else if (req.user.role === 'influencer') {
      query.status = 'open';
    }

    if (status && req.user.role === 'brand') query.status = status;
    if (genre) query.genre = { $in: Array.isArray(genre) ? genre : [genre] };
    if (platform) query.platform = { $in: Array.isArray(platform) ? platform : [platform] };

    const skip = (Number(page) - 1) * Number(limit);

    const campaigns = await Campaign.find(query)
      .populate('brandId', 'name email')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

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

export const getOpenCampaigns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { genre, platform, budgetMin, budgetMax, page = 1, limit = 20 } = req.query;

    const query: any = { status: 'open' };

    if (genre) query.genre = { $in: Array.isArray(genre) ? genre : [genre] };
    if (platform) query.platform = { $in: Array.isArray(platform) ? platform : [platform] };
    if (budgetMin || budgetMax) {
      query.budget = {};
      if (budgetMin) query.budget.$gte = Number(budgetMin);
      if (budgetMax) query.budget.$lte = Number(budgetMax);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const campaigns = await Campaign.find(query)
      .populate('brandId', 'name email')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

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
    console.error('Get open campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id).populate('brandId', 'name email');
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
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can create campaigns' });
      return;
    }

    const { title, description, genre, platform, budget, deadline, requirements } = req.body;

    const campaign = await Campaign.create({
      brandId: req.user.userId,
      title,
      description,
      genre: genre || [],
      platform: platform || [],
      budget,
      deadline,
      requirements: requirements || '',
      status: 'open',
    });

    await campaign.populate('brandId', 'name email');

    res.status(201).json({ campaign });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can update campaigns' });
      return;
    }

    const { id } = req.params;
    const { title, description, genre, platform, budget, deadline, requirements, status } = req.body;

    const campaign = await Campaign.findOne({ _id: id, brandId: req.user.userId });
    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }

    if (title) campaign.title = title;
    if (description) campaign.description = description;
    if (genre) campaign.genre = genre;
    if (platform) campaign.platform = platform;
    if (budget) campaign.budget = budget;
    if (deadline) campaign.deadline = deadline;
    if (requirements !== undefined) campaign.requirements = requirements;
    if (status) campaign.status = status;

    await campaign.save();
    await campaign.populate('brandId', 'name email');

    res.json({ campaign });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can delete campaigns' });
      return;
    }

    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, brandId: req.user.userId });
    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }

    await Proposal.deleteMany({ campaignId: id });
    await Campaign.findByIdAndDelete(id);

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const submitProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can submit proposals' });
      return;
    }

    const { id } = req.params;
    const { message, price } = req.body;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }

    if (campaign.status !== 'open') {
      res.status(400).json({ message: 'Campaign is not accepting proposals' });
      return;
    }

    const existingProposal = await Proposal.findOne({
      campaignId: id,
      influencerId: req.user.userId,
    });
    if (existingProposal) {
      res.status(400).json({ message: 'You have already submitted a proposal' });
      return;
    }

    const proposal = await Proposal.create({
      campaignId: id,
      influencerId: req.user.userId,
      message,
      price,
      status: 'pending',
    });

    await proposal.populate('influencerId', 'name email');
    await proposal.populate('campaignId', 'title');

    res.status(201).json({ proposal });
  } catch (error) {
    console.error('Submit proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProposals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { campaignId } = req.query;

    if (req.user.role === 'brand') {
      const campaigns = await Campaign.find({ brandId: req.user.userId }).select('_id');
      const campaignIds = campaigns.map((c) => c._id);

      const query: any = { campaignId: { $in: campaignIds } };
      if (campaignId) query.campaignId = campaignId;

      const proposals = await Proposal.find(query)
        .populate('influencerId', 'name email')
        .populate('campaignId', 'title')
        .sort({ createdAt: -1 });

      res.json({ proposals });
    } else {
      const proposals = await Proposal.find({ influencerId: req.user.userId })
        .populate('campaignId', 'title')
        .sort({ createdAt: -1 });

      res.json({ proposals });
    }
  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProposalStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can update proposal status' });
      return;
    }

    const { proposalId } = req.params;
    const { status } = req.body;

    const proposal = await Proposal.findById(proposalId).populate('campaignId');
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
    console.error('Update proposal status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
