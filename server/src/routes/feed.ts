import { Router, Request, Response } from 'express';
import { adminClient } from '../config/supabase';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(24, parseInt(req.query.limit as string) || 12);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const tierFilter = req.query.tier as string | undefined;
    const genreFilter = req.query.genre as string | undefined;

    // Approved campaign videos
    let videoQuery = adminClient
      .from('campaign_videos')
      .select('id, video_url, platform, uploaded_at, influencer_id, influencer_profiles!campaign_videos_influencer_id_fkey(tier, niches, instagram_handle, youtube_handle, avatar_url, profiles!influencer_profiles_id_fkey(name))')
      .eq('status', 'approved');

    if (tierFilter) videoQuery = videoQuery.eq('influencer_profiles.tier', tierFilter);

    const { data: videos } = await videoQuery.order('uploaded_at', { ascending: false });

    const videoFeed = (videos ?? []).map((v: any) => {
      const profile = v.influencer_profiles ?? {};
      const name = profile.profiles?.name ?? 'Creator';
      return {
        id: v.id,
        contentUrl: v.video_url,
        platform: v.platform,
        submittedAt: v.uploaded_at,
        creatorName: name,
        avatar: profile.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.influencer_id}`,
        handle: profile.instagram_handle ?? profile.youtube_handle ?? '',
        tier: profile.tier ?? 'micro',
        genre: profile.niches?.[0] ?? '',
        likes: 0,
        type: 'video',
      };
    });

    // Supplement with instagram_posts from influencer_profiles when video feed is sparse
    let portfolioFeed: object[] = [];
    if (videoFeed.length < 6) {
      let profileQuery = adminClient
        .from('influencer_profiles')
        .select('id, tier, niches, instagram_handle, avatar_url, instagram_posts, profiles!influencer_profiles_id_fkey(name)')
        .not('instagram_posts', 'eq', '[]')
        .limit(10);
      if (tierFilter) profileQuery = profileQuery.eq('tier', tierFilter);
      if (genreFilter) profileQuery = profileQuery.contains('niches', [genreFilter]);
      const { data: profiles } = await profileQuery;

      portfolioFeed = (profiles ?? []).flatMap((p: any) => {
        const posts: any[] = Array.isArray(p.instagram_posts) ? p.instagram_posts : [];
        return posts.slice(0, 2).map(post => ({
          id: post.postId ?? Math.random().toString(36).slice(2),
          contentUrl: post.url,
          thumbnailUrl: post.thumbnail,
          platform: 'instagram',
          caption: post.caption ?? '',
          submittedAt: post.publishedAt ?? null,
          creatorName: p.profiles?.name ?? 'Creator',
          avatar: p.avatar_url,
          handle: p.instagram_handle ?? '',
          tier: p.tier ?? 'micro',
          genre: p.niches?.[0] ?? '',
          likes: 0,
          type: 'image',
        }));
      });
    }

    const allPosts = [...videoFeed, ...portfolioFeed]
      .filter(p => !genreFilter || (p as any).genre === genreFilter)
      .sort((a, b) => new Date((b as any).submittedAt ?? 0).getTime() - new Date((a as any).submittedAt ?? 0).getTime());

    const total = allPosts.length;
    const posts = allPosts.slice(from, to + 1);

    res.json({ posts, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ message: 'Error fetching feed' });
  }
});

export default router;
