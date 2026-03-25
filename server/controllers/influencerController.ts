import { Request, Response } from 'express';
import { InfluencerProfile } from '../models/InfluencerProfile';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getInfluencers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      niche, 
      platform, 
      tier,
      minFollowers,
      maxFollowers,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query: Record<string, unknown> = {};

    if (niche) query.niche = niche;
    if (platform) query.platform = platform;
    if (tier) query.tier = tier;

    if (minFollowers || maxFollowers) {
      query['followers.instagram'] = {};
      if (minFollowers) query['followers.instagram'].$gte = Number(minFollowers);
      if (maxFollowers) query['followers.instagram'].$lte = Number(maxFollowers);
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy as string] = order === 'asc' ? 1 : -1;

    const influencers = await InfluencerProfile.find(query)
      .populate('userId', 'name avatar')
      .sort(sort)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await InfluencerProfile.countDocuments(query);

    const data = influencers.map(inf => ({
      id: inf._id,
      name: (inf.userId as unknown as { name: string }).name,
      avatar: (inf.userId as unknown as { avatar?: string }).avatar,
      niche: inf.niche,
      bio: inf.bio,
      platform: inf.platform,
      tier: inf.tier,
      followers: inf.followers,
      engagementRate: inf.engagementRate,
      price: inf.price,
      rating: inf.rating,
    }));

    res.json({
      influencers: data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get influencers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInfluencerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const influencer = await InfluencerProfile.findById(id).populate('userId', 'name avatar email');

    if (!influencer) {
      res.status(404).json({ message: 'Influencer not found' });
      return;
    }

    res.json({
      influencer: {
        id: influencer._id,
        name: (influencer.userId as unknown as { name: string }).name,
        avatar: (influencer.userId as unknown as { avatar?: string }).avatar,
        email: (influencer.userId as unknown as { email: string }).email,
        niche: influencer.niche,
        bio: influencer.bio,
        socialHandles: influencer.socialHandles,
        platform: influencer.platform,
        tier: influencer.tier,
        followers: influencer.followers,
        activeFollowers: influencer.activeFollowers,
        engagementRate: influencer.engagementRate,
        audienceCity: influencer.audienceCity,
        genre: influencer.genre,
        price: influencer.price,
        portfolio: influencer.portfolio,
        rating: influencer.rating,
        reviewCount: influencer.reviewCount,
      },
    });
  } catch (error) {
    console.error('Get influencer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchInfluencers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, niche, platform, minFollowers, maxFollowers, minPrice, maxPrice } = req.query;

    const query: Record<string, unknown> = {};

    if (q) {
      query.$or = [
        { niche: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } },
        { genre: { $regex: q, $options: 'i' } },
      ];
    }

    if (niche) query.niche = niche;
    if (platform) query.platform = platform;

    if (minFollowers || maxFollowers) {
      query['followers.instagram'] = {};
      if (minFollowers) query['followers.instagram'].$gte = Number(minFollowers);
      if (maxFollowers) query['followers.instagram'].$lte = Number(maxFollowers);
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const influencers = await InfluencerProfile.find(query)
      .populate('userId', 'name avatar')
      .limit(50);

    const data = influencers.map(inf => ({
      id: inf._id,
      name: (inf.userId as unknown as { name: string }).name,
      avatar: (inf.userId as unknown as { avatar?: string }).avatar,
      niche: inf.niche,
      bio: inf.bio,
      platform: inf.platform,
      followers: inf.followers,
      price: inf.price,
    }));

    res.json({
      influencers: data,
      total: data.length,
      query: q,
    });
  } catch (error) {
    console.error('Search influencers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateInfluencerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'INFLUENCER') {
      res.status(403).json({ message: 'Only influencers can update their profile' });
      return;
    }

    const influencerProfile = await InfluencerProfile.findOne({ userId });
    if (!influencerProfile) {
      res.status(404).json({ message: 'Influencer profile not found' });
      return;
    }

    const allowedFields = [
      'niche', 'bio', 'socialHandles', 'platform', 'tier', 'followers',
      'activeFollowers', 'avgViews', 'avgLikes', 'engagementRate',
      'genderSplit', 'audienceCity', 'genre', 'price', 'portfolio'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (influencerProfile as Record<string, unknown>)[field] = req.body[field];
      }
    }

    await influencerProfile.save();

    res.json({ influencer: influencerProfile });
  } catch (error) {
    console.error('Update influencer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
