import { Request, Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { applyPlatformMargin } from '../utils/pricing';
import { syncInstagramAvatar } from '../services/instagramAvatarService';

const ALLOWED_GENDERS = ['male', 'female', 'non_binary', 'prefer_not_to_say'] as const;

export const formatInfluencer = (row: any) => {
  const pricingObj = (row.influencer_pricing ?? []).reduce(
    (acc: Record<string, number>, r: any) => { acc[r.content_type] = r.price; return acc; },
    {}
  );
  return {
    id: row.id,
    userId: row.id,
    name: row.profiles?.name ?? 'Unknown',
    username: row.profiles?.username ?? null,
    phone: row.profiles?.phone ?? null,
    bio: row.bio ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    gender: row.gender,
    niches: row.niches ?? [],
    platform: row.platforms ?? [],
    tier: row.tier,
    verified: !!row.is_verified,
    isOnline: !!row.is_online,
    lastSeenAt: row.last_seen_at,
    onlineSince: row.online_since ?? null,
    galleryImages: row.gallery_images ?? [],
    profileImage: row.profiles?.avatar_url ?? row.avatar_url,
    followerCount: row.followers_count ?? 0,
    portfolio: row.portfolio ?? [],
    socialHandles: {
      instagram: row.instagram_handle ?? undefined,
      youtube: row.youtube_handle ?? undefined,
    },
    pricing: applyPlatformMargin(pricingObj),
    avgRating: row.avg_rating != null ? Number(row.avg_rating) : null,
    ratingCount: row.rating_count ?? 0,
    createdAt: row.created_at ?? null,
  };
};

export const getTierCounts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tiers = ['nano', 'micro', 'macro', 'celeb'];
    const results = await Promise.all(
      tiers.map(t =>
        adminClient.from('influencer_profiles').select('id', { count: 'exact', head: true }).eq('tier', t)
      )
    );
    const tierCounts: Record<string, number> = {};
    tiers.forEach((t, i) => { tierCounts[t] = results[i].count ?? 0; });
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(tierCounts);
  } catch (error) {
    console.error('Get tier counts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const VALID_TIERS = new Set(['nano', 'micro', 'macro', 'celeb']);

const normalizeTier = (t: unknown): string | undefined => {
  if (!t || typeof t !== 'string') return undefined;
  const lower = t.toLowerCase();
  if (lower === 'mega') return 'celeb'; // backwards-compat alias
  return VALID_TIERS.has(lower) ? lower : undefined;
};

const buildInfluencerQuery = (params: Record<string, any>) => {
  let q = adminClient
    .from('influencer_profiles')
    .select('*, profiles(name, username, phone, avatar_url), influencer_pricing(platform, content_type, price)');

  const tier = normalizeTier(params.tier);
  if (tier) q = q.eq('tier', tier);
  if (params.city) q = q.ilike('city', `%${params.city}%`);
  if (params.gender && (ALLOWED_GENDERS as readonly string[]).includes(params.gender)) q = q.eq('gender', params.gender);
  if (params.genre) {
    const arr = Array.isArray(params.genre) ? params.genre : [params.genre];
    q = q.overlaps('niches', arr);
  }
  if (params.platform) {
    const arr = Array.isArray(params.platform) ? params.platform : [params.platform];
    q = q.overlaps('platforms', arr);
  }
  if (params.name) q = q.ilike('profiles.name', `%${params.name}%`);
  if (params.q) q = q.textSearch('fts', params.q, { type: 'websearch' });

  // Hide creators who explicitly went offline (last_seen_at is set + is_online false).
  // Creators who never toggled presence (last_seen_at IS NULL) still appear.
  q = q.or('is_online.eq.true,last_seen_at.is.null');

  // Respect creator privacy flags — default true keeps existing rows unaffected
  q = q.eq('marketplace_visible', true).eq('is_discoverable', true);

  return q;
};

export const getInfluencers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tier, city, genre, platform, gender, page = 1, limit = 20 } = req.query;
    const clampedLimit = Math.min(Number(limit) || 20, 100);
    const from = (Number(page) - 1) * clampedLimit;
    const to = from + clampedLimit - 1;

    const query = buildInfluencerQuery({ tier, city, genre, platform, gender })
      .order('is_online', { ascending: false })
      .order('last_seen_at', { ascending: false, nullsFirst: false })
      .order('tier', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    res.set('Cache-Control', 'no-store');
    res.json({
      influencers: (data ?? []).map(formatInfluencer),
      pagination: { page: Number(page), limit: clampedLimit, total: count ?? 0, pages: Math.ceil((count ?? 0) / clampedLimit) },
    });
  } catch (error) {
    console.error('Get influencers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchInfluencers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, tier, city, genre, platform, gender, name, page = 1, limit = 20 } = req.query;
    const clampedLimit = Math.min(Number(limit) || 20, 100);
    const from = (Number(page) - 1) * clampedLimit;
    const to = from + clampedLimit - 1;

    const { data, count, error } = await buildInfluencerQuery({ q, tier, city, genre, platform, gender, name })
      .order('is_online', { ascending: false })
      .order('last_seen_at', { ascending: false, nullsFirst: false })
      .order('tier', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;

    res.json({
      influencers: (data ?? []).map(formatInfluencer),
      pagination: { page: Number(page), limit: clampedLimit, total: count ?? 0, pages: Math.ceil((count ?? 0) / clampedLimit) },
    });
  } catch (error) {
    console.error('Search influencers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInfluencerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await adminClient
      .from('influencer_profiles')
      .select('*, profiles(name, username, phone, avatar_url), influencer_pricing(platform, content_type, price)')
      .eq('id', req.params.id)
      .single();
    if (error || !data) { res.status(404).json({ message: 'Influencer not found' }); return; }

    // Offline creators are hidden from anyone except themselves.
    // Creators who never toggled presence (last_seen_at IS NULL) remain visible — same rule as search.
    const viewerId = (req as AuthRequest).user?.userId;
    if (!data.is_online && data.last_seen_at !== null && viewerId !== data.id) {
      res.status(404).json({ message: 'Influencer not found' }); return;
    }

    res.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=120');
    res.json({ influencer: formatInfluencer(data) });
  } catch (error) {
    console.error('Get influencer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOwnProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can view their own profile' }); return;
    }
    const { data, error } = await adminClient
      .from('influencer_profiles')
      .select('*, profiles(name, username, phone, avatar_url), influencer_pricing(platform, content_type, price)')
      .eq('id', req.user.userId)
      .single();
    if (error || !data) { res.status(404).json({ message: 'Influencer profile not found' }); return; }
    res.json({ influencer: formatInfluencer(data) });
  } catch (error) {
    console.error('Get own profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateInfluencerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can update their profile' }); return;
    }
    const { name, bio, city, state, gender, niches, platform, tier, pricing, portfolio, instagramPosts, youtubeVideos, socialHandles, username, phone, avatarUrl } = req.body;
    const instagramHandle = req.body.instagramHandle ?? socialHandles?.instagram;
    const youtubeHandle = req.body.youtubeHandle ?? socialHandles?.youtube;
    const update: Record<string, unknown> = {};
    const profilesUpdate: Record<string, unknown> = {};

    if (name && typeof name === 'string' && name.trim()) {
      profilesUpdate.name = name.trim();
      await adminClient.auth.admin.updateUserById(req.user.userId, { user_metadata: { name: name.trim() } });
    }
    if (typeof username === 'string' && username.trim()) profilesUpdate.username = username.trim().toLowerCase();
    if (typeof phone === 'string') profilesUpdate.phone = phone.replace(/\D/g, '') || null;
    if (typeof avatarUrl === 'string' && avatarUrl.trim()) profilesUpdate.avatar_url = avatarUrl.trim();
    if (Object.keys(profilesUpdate).length > 0) {
      const { error: pe } = await adminClient.from('profiles').update(profilesUpdate).eq('id', req.user.userId);
      if (pe && (pe as { code?: string }).code === '23505') {
        res.status(400).json({ message: 'Username already taken' }); return;
      }
    }
    if (bio !== undefined) update.bio = bio;
    if (city) update.city = city;
    if (state !== undefined) update.state = state;
    if (typeof gender === 'string' && (ALLOWED_GENDERS as readonly string[]).includes(gender)) update.gender = gender;
    if (niches) update.niches = niches;
    if (platform) update.platforms = platform;
    if (tier) update.tier = tier;
    if (portfolio) update.portfolio = portfolio;
    if (instagramPosts) update.instagram_posts = instagramPosts;
    if (youtubeVideos) update.youtube_videos = youtubeVideos;
    if (instagramHandle !== undefined) update.instagram_handle = instagramHandle;
    if (youtubeHandle !== undefined) update.youtube_handle = youtubeHandle;

    // Fire-and-forget: sync avatar + follower count when Instagram handle is (re)set
    if (instagramHandle && typeof instagramHandle === 'string') {
      syncInstagramAvatar(req.user.userId, instagramHandle).catch(() => { /* silent */ });
    }

    if (Object.keys(update).length > 0) {
      await adminClient.from('influencer_profiles').update(update).eq('id', req.user.userId);
    }

    if (pricing && Object.keys(pricing).length > 0) {
      const { data: existing } = await adminClient
        .from('influencer_profiles')
        .select('created_at')
        .eq('id', req.user.userId)
        .single();
      const createdAtMs = existing?.created_at ? new Date(existing.created_at).getTime() : 0;
      const days = createdAtMs ? Math.floor((Date.now() - createdAtMs) / 86_400_000) : 0;

      // Bypass 6-month lock for first-time pricing setup (no rows exist yet).
      // Once any pricing row exists, the lock applies.
      const { count: existingPricingCount } = await adminClient
        .from('influencer_pricing')
        .select('id', { count: 'exact', head: true })
        .eq('influencer_id', req.user.userId);
      const isFirstTimeSetup = (existingPricingCount ?? 0) === 0;

      if (!isFirstTimeSetup && days < 180) {
        res.status(403).json({
          message: 'Commercials are locked for the first 6 months after registration',
          unlockAt: createdAtMs ? new Date(createdAtMs + 180 * 86_400_000).toISOString() : null,
        });
        return;
      }
      const rows = ['reel', 'story', 'video', 'post', 'shorts']
        .filter(t => pricing[t] != null && Number(pricing[t]) > 0)
        .map(t => ({ influencer_id: req.user!.userId, platform: 'general', content_type: t, price: Number(pricing[t]) }));
      if (rows.length > 0) {
        const { error: prErr } = await adminClient.from('influencer_pricing').upsert(rows, { onConflict: 'influencer_id,platform,content_type' });
        if (prErr) console.error('pricing upsert failed:', prErr);
      }
    }

    const { data } = await adminClient
      .from('influencer_profiles')
      .select('*, profiles(name, username, phone, avatar_url), influencer_pricing(platform, content_type, price)')
      .eq('id', req.user.userId)
      .single();

    res.json({ profile: data ? formatInfluencer(data) : null });
  } catch (error) {
    console.error('Update influencer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePresence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can update presence' }); return;
    }
    const { isOnline } = req.body;
    const now = new Date().toISOString();
    await adminClient.from('influencer_profiles').update({
      is_online: !!isOnline,
      last_seen_at: isOnline ? null : now,
      online_since: isOnline ? now : null,
    }).eq('id', req.user.userId);
    res.json({ message: 'Presence updated' });
  } catch (error) {
    console.error('Update presence error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfileImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { imageUrl } = req.body;
    if (!imageUrl) { res.status(400).json({ message: 'imageUrl required' }); return; }
    await adminClient.from('profiles').update({ avatar_url: imageUrl }).eq('id', req.user.userId);
    res.json({ message: 'Profile image updated', imageUrl });
  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateGallery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can update gallery' }); return;
    }
    const { imageUrls } = req.body as { imageUrls?: unknown };
    if (!Array.isArray(imageUrls) || !imageUrls.every((u) => typeof u === 'string')) {
      res.status(400).json({ message: 'imageUrls must be an array of strings' }); return;
    }
    if (imageUrls.length > 12) {
      res.status(400).json({ message: 'Maximum 12 gallery images' }); return;
    }
    await adminClient.from('influencer_profiles')
      .update({ gallery_images: imageUrls })
      .eq('id', req.user.userId);
    res.json({ message: 'Gallery updated', galleryImages: imageUrls });
  } catch (error) {
    console.error('Update gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const connectSocial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can connect social accounts' }); return;
    }
    const { platform: socialPlatform, handle } = req.body;
    if (!socialPlatform || !handle) { res.status(400).json({ message: 'Platform and handle required' }); return; }

    const update: Record<string, string> = {};
    if (socialPlatform === 'instagram') update.instagram_handle = handle;
    else if (socialPlatform === 'youtube') update.youtube_handle = handle;
    else { res.status(400).json({ message: 'Platform must be instagram or youtube' }); return; }

    const { error } = await adminClient.from('influencer_profiles').update(update).eq('id', req.user.userId);
    if (error) throw error;
    res.json({ message: `${socialPlatform} connected` });
  } catch (error) {
    console.error('Connect social error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
