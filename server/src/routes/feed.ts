import { Router, Request, Response } from 'express';
import CampaignVideo from '../models/CampaignVideo';
import InfluencerProfile from '../models/InfluencerProfile';
import User from '../models/User';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(24, parseInt(req.query.limit as string) || 12);
    const skip = (page - 1) * limit;
    const tierFilter = req.query.tier as string | undefined;
    const genreFilter = req.query.genre as string | undefined;

    // 1. Get approved campaign videos with influencer info
    const videoAgg = await CampaignVideo.aggregate([
      { $match: { status: 'approved' } },
      {
        $lookup: {
          from: 'influencerprofiles',
          localField: 'influencerId',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'influencerId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      ...(tierFilter ? [{ $match: { 'profile.tier': tierFilter } }] : []),
      ...(genreFilter ? [{ $match: { 'profile.niches': genreFilter } }] : []),
      {
        $project: {
          _id: 1,
          contentUrl: '$videoUrl',
          platform: 1,
          submittedAt: '$uploadedAt',
          creatorName: '$user.name',
          avatar: { $ifNull: ['$profile.profileImage', 'https://api.dicebear.com/7.x/avataaars/svg?seed=anon'] },
          handle: { $ifNull: ['$profile.socialHandles.instagram', '$profile.socialHandles.youtube', ''] },
          tier: { $ifNull: ['$profile.tier', 'micro'] },
          genre: { $arrayElemAt: ['$profile.niches', 0] },
          likes: { $literal: 0 },
          type: { $literal: 'video' },
        },
      },
    ]);

    // 2. Pull portfolio posts from InfluencerProfile when video feed is sparse
    let portfolioPosts: object[] = [];
    if (videoAgg.length < 6) {
      const profileQuery: Record<string, unknown> = { 'instagramPosts.0': { $exists: true } };
      if (tierFilter) profileQuery.tier = tierFilter;
      if (genreFilter) profileQuery.niches = genreFilter;

      const profiles = await InfluencerProfile.find(profileQuery)
        .populate('userId', 'name')
        .limit(10)
        .lean();

      portfolioPosts = profiles.flatMap((p) =>
        (p.instagramPosts || []).slice(0, 2).map((post) => ({
          _id: post.postId || String(Math.random()),
          contentUrl: post.url,
          thumbnailUrl: post.thumbnail,
          platform: 'instagram',
          caption: post.caption || '',
          submittedAt: p.updatedAt,
          creatorName: (p.userId as { name?: string })?.name || 'Creator',
          avatar: p.profileImage,
          handle: p.socialHandles?.instagram || '',
          tier: p.tier || 'micro',
          genre: p.niches?.[0] || '',
          likes: 0,
          type: 'image',
        }))
      );
    }

    const allPosts = [...videoAgg, ...portfolioPosts].sort(
      (a, b) => new Date((b as { submittedAt: string }).submittedAt).getTime() - new Date((a as { submittedAt: string }).submittedAt).getTime()
    );

    const total = allPosts.length;
    const posts = allPosts.slice(skip, skip + limit);

    res.json({ posts, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ message: 'Error fetching feed' });
  }
});

export default router;
