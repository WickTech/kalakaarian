import { Router, Request, Response } from 'express';
import { adminClient } from '../config/supabase';
import { optionalAuth } from '../middleware/auth';
import {
  getInstagramStats, getInstagramPosts, getYouTubeStats, getYouTubeVideos,
  InstagramStats, YouTubeStats,
} from '../services/socialMediaService';
import { calculateAnalytics } from '../services/analyticsService';
import { listForUser } from '../services/platformAccountService';
import { getMetrics } from '../services/platformMetricsService';

const router = Router();

router.get('/stats/:userId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { data: profile } = await adminClient
      .from('influencer_profiles')
      .select('instagram_handle, youtube_handle, followers_count')
      .eq('id', userId)
      .single();
    if (!profile) { res.status(404).json({ message: 'Profile not found' }); return; }

    const accounts = await listForUser(userId);
    const igAcc = accounts.find((a) => a.platform === 'instagram');
    const ytAcc = accounts.find((a) => a.platform === 'youtube');

    const [instagramStats, youtubeStats] = await Promise.all([
      buildIgStats(igAcc?.id, igAcc?.platform_username ?? profile.instagram_handle, profile.followers_count),
      buildYtStats(ytAcc?.id, ytAcc?.platform_username ?? profile.youtube_handle),
    ]);

    res.json({
      instagram: instagramStats,
      youtube: youtubeStats,
      analytics: calculateAnalytics(instagramStats, youtubeStats),
    });
  } catch (error) {
    console.error('Social stats error:', error);
    res.status(500).json({ message: 'Error fetching social stats' });
  }
});

async function buildIgStats(accountId: string | undefined, handle: string | null, fallbackFollowers: number | null): Promise<InstagramStats | null> {
  if (accountId) {
    const m = await getMetrics(accountId);
    if (m) {
      const followers = m.followers ?? 0;
      return {
        handle: handle ?? '',
        followers,
        following: m.following ?? 0,
        posts: m.posts_count ?? 0,
        avgLikes: m.avg_likes ?? 0,
        avgComments: m.avg_comments ?? 0,
        engagementRate: m.engagement_rate ?? 0,
        isMock: false,
      };
    }
  }
  if (!handle) return null;
  const mock = await getInstagramStats(handle);
  if (mock.isMock && fallbackFollowers) mock.followers = fallbackFollowers;
  return mock;
}

async function buildYtStats(accountId: string | undefined, handle: string | null): Promise<YouTubeStats | null> {
  if (accountId) {
    const m = await getMetrics(accountId);
    if (m) {
      const subs = m.followers ?? 0;
      return {
        handle: handle ?? '',
        channelId: handle ?? '',
        subscribers: subs,
        videos: m.posts_count ?? 0,
        totalViews: 0,
        avgViews: 0,
        isMock: false,
      };
    }
  }
  if (!handle) return null;
  return await getYouTubeStats(handle);
}

router.get('/instagram/:handle/posts', async (req: Request, res: Response) => {
  try {
    const posts = await getInstagramPosts(req.params.handle, parseInt(req.query.limit as string) || 9);
    res.json(posts);
  } catch { res.status(500).json({ message: 'Error fetching Instagram posts' }); }
});

router.get('/youtube/:channelId/videos', async (req: Request, res: Response) => {
  try {
    const videos = await getYouTubeVideos(req.params.channelId, parseInt(req.query.limit as string) || 10);
    res.json(videos);
  } catch { res.status(500).json({ message: 'Error fetching YouTube videos' }); }
});

router.get('/instagram/stats/:handle', async (req: Request, res: Response) => {
  try {
    const stats = await getInstagramStats(req.params.handle);
    res.json(stats);
  } catch { res.status(500).json({ message: 'Error fetching Instagram stats' }); }
});

router.get('/youtube/stats/:channelId', async (req: Request, res: Response) => {
  try {
    const stats = await getYouTubeStats(req.params.channelId);
    res.json(stats);
  } catch { res.status(500).json({ message: 'Error fetching YouTube stats' }); }
});

export default router;
