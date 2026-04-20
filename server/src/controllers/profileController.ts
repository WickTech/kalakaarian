import { Response } from 'express';
import User from '../models/User';
import InfluencerProfile from '../models/InfluencerProfile';
import BrandProfile from '../models/BrandProfile';
import { AuthRequest } from '../middleware/auth';

const getProfileDocs = async (userId: string, role: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) return null;
  const profile = role === 'brand'
    ? await BrandProfile.findOne({ userId })
    : role === 'influencer'
      ? await InfluencerProfile.findOne({ userId })
      : null;
  return { user, profile };
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const docs = await getProfileDocs(req.user.userId, req.user.role);
    if (!docs) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({
      user: { id: docs.user._id, email: docs.user.email, name: docs.user.name, role: docs.user.role },
      profile: docs.profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const user = await User.findById(req.user.userId);
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const { name, companyName, industry, bio, city, genre, platform, tier, followers, pricing, portfolio } = req.body;
    if (name) { user.name = name; await user.save(); }

    if (user.role === 'brand') {
      const update: any = {};
      if (companyName) update.companyName = companyName;
      if (industry) update.industry = industry;
      if (req.body.website) update.website = req.body.website;
      if (req.body.logo) update.logo = req.body.logo;
      if (req.body.description) update.description = req.body.description;
      await BrandProfile.findOneAndUpdate({ userId: user._id }, update, { new: true });
    } else if (user.role === 'influencer') {
      const update: any = {};
      if (bio !== undefined) update.bio = bio;
      if (city) update.city = city;
      if (genre) update.genre = genre;
      if (platform) update.platform = platform;
      if (tier) update.tier = tier;
      if (followers) update.followers = followers;
      if (pricing) update.pricing = pricing;
      if (portfolio) update.portfolio = portfolio;
      await InfluencerProfile.findOneAndUpdate({ userId: user._id }, update, { new: true });
    }

    const docs = await getProfileDocs(user._id.toString(), user.role);
    res.json({ user: docs?.user, profile: docs?.profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
