import { Request, Response } from 'express';
import InfluencerProfile from '../models/InfluencerProfile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { applyPlatformMargin } from '../utils/pricing';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ALLOWED_GENDERS = ['male', 'female', 'non_binary', 'prefer_not_to_say'] as const;

const formatInfluencer = (inf: any) => ({
  id: inf._id,
  name: inf.userId?.name || 'Unknown',
  bio: inf.bio || '',
  city: inf.city || '',
  gender: inf.gender,
  niches: inf.niches || [],
  socialHandles: inf.socialHandles || {},
  profileImage: inf.profileImage,
  platform: inf.platform || [],
  tier: inf.tier,
  verified: inf.verified,
  isOnline: !!inf.isOnline,
  lastSeenAt: inf.lastSeenAt,
  // Brand-facing pricing includes the platform margin; raw stored values are untouched.
  pricing: applyPlatformMargin(inf.pricing),
});

export const getTierCounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const counts = await InfluencerProfile.aggregate([
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
        },
      },
    ]);

    const tierCounts: Record<string, number> = {
      nano: 0,
      micro: 0,
      mid: 0,
      macro: 0,
      mega: 0,
    };

    counts.forEach((item) => {
      if (item._id && tierCounts.hasOwnProperty(item._id)) {
        tierCounts[item._id] = item.count;
      }
    });

    res.json(tierCounts);
  } catch (error) {
    console.error('Get tier counts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInfluencers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tier, city, genre, platform, gender, page = 1, limit = 20 } = req.query;

    const query: any = {};

    const clampedLimit = Math.min(Number(limit) || 20, 100);

    if (tier) query.tier = tier;
    if (typeof city === 'string') query.city = { $regex: escapeRegex(city), $options: 'i' };
    if (genre) query.niches = { $in: Array.isArray(genre) ? genre : [genre] };
    if (platform) query.platform = { $in: Array.isArray(platform) ? platform : [platform] };
    if (typeof gender === 'string' && (ALLOWED_GENDERS as readonly string[]).includes(gender)) {
      query.gender = gender;
    }

    const skip = (Number(page) - 1) * clampedLimit;

    const influencers = await InfluencerProfile.find(query)
      .populate('userId', 'name')
      .skip(skip)
      .limit(clampedLimit)
      .sort({ createdAt: -1 });

    const total = await InfluencerProfile.countDocuments(query);

    const formattedInfluencers = influencers.map(formatInfluencer);

    res.json({
      influencers: formattedInfluencers,
      pagination: {
        page: Number(page),
        limit: clampedLimit,
        total,
        pages: Math.ceil(total / clampedLimit),
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

    const influencer = await InfluencerProfile.findById(id).populate('userId', 'name');
    if (!influencer) {
      res.status(404).json({ message: 'Influencer not found' });
      return;
    }

    res.json({ influencer: formatInfluencer(influencer) });
  } catch (error) {
    console.error('Get influencer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchInfluencers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, tier, city, genre, platform, gender, page = 1, limit = 20 } = req.query;

    const query: any = {};

    const clampedLimit = Math.min(Number(limit) || 20, 100);

    if (typeof q === 'string') {
      const safeQ = escapeRegex(q);
      query.$or = [
        { bio: { $regex: safeQ, $options: 'i' } },
        { city: { $regex: safeQ, $options: 'i' } },
        { niches: { $regex: safeQ, $options: 'i' } },
      ];
    }

    if (tier) query.tier = tier;
    if (typeof city === 'string') query.city = { $regex: escapeRegex(city), $options: 'i' };
    if (genre) query.niches = { $in: Array.isArray(genre) ? genre : [genre] };
    if (platform) query.platform = { $in: Array.isArray(platform) ? platform : [platform] };
    if (typeof gender === 'string' && (ALLOWED_GENDERS as readonly string[]).includes(gender)) {
      query.gender = gender;
    }

    const skip = (Number(page) - 1) * clampedLimit;

    const influencers = await InfluencerProfile.find(query)
      .populate('userId', 'name')
      .skip(skip)
      .limit(clampedLimit)
      .sort({ createdAt: -1 });

    const total = await InfluencerProfile.countDocuments(query);

    const formattedInfluencers = influencers.map(formatInfluencer);

    res.json({
      influencers: formattedInfluencers,
      pagination: {
        page: Number(page),
        limit: clampedLimit,
        total,
        pages: Math.ceil(total / clampedLimit),
      },
    });
  } catch (error) {
    console.error('Search influencers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateInfluencerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can update their profile' });
      return;
    }

    const { bio, city, gender, niches, platform, tier, followers, pricing, portfolio, instagramPosts, youtubeVideos } = req.body;

    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (city) updateData.city = city;
    if (typeof gender === 'string' && (ALLOWED_GENDERS as readonly string[]).includes(gender)) {
      updateData.gender = gender;
    }
    if (niches) updateData.niches = niches;
    if (platform) updateData.platform = platform;
    if (tier) updateData.tier = tier;
    if (followers) updateData.followers = followers;
    if (pricing) updateData.pricing = pricing;
    if (portfolio) updateData.portfolio = portfolio;
    if (instagramPosts) updateData.instagramPosts = instagramPosts;
    if (youtubeVideos) updateData.youtubeVideos = youtubeVideos;

    const profile = await InfluencerProfile.findOneAndUpdate(
      { userId: req.user.userId },
      updateData,
      { new: true }
    ).populate('userId', 'name email');

    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.json({ profile });
  } catch (error) {
    console.error('Update influencer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
