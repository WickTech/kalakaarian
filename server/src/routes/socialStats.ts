import { Router, Request, Response } from 'express';
import { adminClient } from '../config/supabase';
import { optionalAuth } from '../middleware/auth';
import { getInstagramStats, getInstagramPosts, getYouTubeStats, getYouTubeVideos } from '../services/socialMediaService';
import { calculateAnalytics } from '../services/analyticsService';

const router = Router();

router.get('/stats/:userId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { data: profile } = await adminClient.from('influencer_profiles')
      .select('instagram_handle, youtube_handle').eq('id', userId).single();
    if (!profile) { res.status(404).json({ message: 'Profile not found' }); return; }

    const [instagramStats, youtubeStats] = await Promise.all([
      profile.instagram_handle ? getInstagramStats(profile.instagram_handle) : Promise.resolve(null),
      profile.youtube_handle ? getYouTubeStats(profile.youtube_handle) : Promise.resolve(null),
    ]);

    res.json({ instagram: instagramStats, youtube: youtubeStats, analytics: calculateAnalytics(instagramStats, youtubeStats) });
  } catch (error) {
    console.error('Social stats error:', error);
    res.status(500).json({ message: 'Error fetching social stats' });
  }
});

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
