import * as repo from './repository';
import { ALLOWED_GENDERS } from './repository';
import { formatInfluencer } from './format';
import { syncInstagramAvatar } from '../../services/instagramAvatarService';
import type { InfluencerListQuery, UpdateProfileInput, Pagination } from './types';

// Business logic for the influencers domain. No Express types here — handlers
// in controller.ts adapt HTTP to these calls.

const TIERS = ['nano', 'micro', 'macro', 'celeb'];
const PRICING_LOCK_DAYS = 180;

function paginate(query: InfluencerListQuery): { page: number; limit: number; from: number; to: number } {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const from = (page - 1) * limit;
  return { page, limit, from, to: from + limit - 1 };
}

export async function getTierCounts(): Promise<Record<string, number>> {
  const results = await Promise.all(TIERS.map((t) => repo.countByTier(t)));
  const counts: Record<string, number> = {};
  TIERS.forEach((t, i) => { counts[t] = results[i]; });
  return counts;
}

export async function listInfluencers(
  query: InfluencerListQuery,
): Promise<{ influencers: unknown[]; pagination: Pagination }> {
  const { page, limit, from, to } = paginate(query);
  const { rows, count } = await repo.queryInfluencers(
    { tier: query.tier, city: query.city, gender: query.gender, genre: query.genre, platform: query.platform, q: query.q, name: query.name },
    { from, to },
  );
  return {
    influencers: rows.map((r: any) => formatInfluencer(r)),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
  };
}

export async function getInfluencerById(id: string, viewerId?: string): Promise<unknown | null> {
  const data = await repo.findById(id);
  if (!data) return null;
  // Offline creators are hidden from anyone except themselves. Creators who
  // never toggled presence (last_seen_at IS NULL) remain visible.
  if (!data.is_online && data.last_seen_at !== null && viewerId !== data.id) return null;
  return formatInfluencer(data, { rawPricing: viewerId === data.id });
}

export async function getOwnProfile(userId: string): Promise<unknown | null> {
  const data = await repo.findById(userId);
  if (!data) return null;
  return formatInfluencer(data, { rawPricing: true });
}

export type UpdateResult =
  | { kind: 'conflict' }
  | { kind: 'locked'; unlockAt: string | null }
  | { kind: 'ok'; profile: unknown | null };

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<UpdateResult> {
  const instagramHandle = input.instagramHandle ?? input.socialHandles?.instagram;
  const youtubeHandle = input.youtubeHandle ?? input.socialHandles?.youtube;

  const profilesUpdate: Record<string, unknown> = {};
  if (input.name && typeof input.name === 'string' && input.name.trim()) {
    profilesUpdate.name = input.name.trim();
    await repo.updateAuthName(userId, input.name.trim());
  }
  if (typeof input.username === 'string' && input.username.trim()) {
    profilesUpdate.username = input.username.trim().toLowerCase();
  }
  if (typeof input.phone === 'string') profilesUpdate.phone = input.phone.replace(/\D/g, '') || null;
  if (typeof input.avatarUrl === 'string' && input.avatarUrl.trim()) {
    profilesUpdate.avatar_url = input.avatarUrl.trim();
  }
  if (Object.keys(profilesUpdate).length > 0) {
    const { code } = await repo.updateProfilesTable(userId, profilesUpdate);
    if (code === '23505') return { kind: 'conflict' };
  }

  const update: Record<string, unknown> = {};
  if (input.bio !== undefined) update.bio = input.bio;
  if (input.city) update.city = input.city;
  if (input.state !== undefined) update.state = input.state;
  if (typeof input.gender === 'string' && (ALLOWED_GENDERS as readonly string[]).includes(input.gender)) {
    update.gender = input.gender;
  }
  if (input.niches) update.niches = input.niches;
  if (input.platform) update.platforms = input.platform;
  if (input.tier) update.tier = input.tier;
  if (input.portfolio) update.portfolio = input.portfolio;
  if (input.instagramPosts) update.instagram_posts = input.instagramPosts;
  if (input.youtubeVideos) update.youtube_videos = input.youtubeVideos;
  if (instagramHandle !== undefined) update.instagram_handle = instagramHandle;
  if (youtubeHandle !== undefined) update.youtube_handle = youtubeHandle;

  // Fire-and-forget: sync avatar + follower count when Instagram handle is (re)set.
  if (instagramHandle && typeof instagramHandle === 'string') {
    syncInstagramAvatar(userId, instagramHandle).catch(() => { /* silent */ });
  }

  if (Object.keys(update).length > 0) await repo.updateInfluencerRow(userId, update);

  if (input.pricing && Object.keys(input.pricing).length > 0) {
    const lock = await applyPricing(userId, input.pricing);
    if (lock) return lock;
  }

  return { kind: 'ok', profile: await getOwnProfile(userId) };
}

// Returns a `locked` result when the 6-month commercials lock is in effect,
// otherwise upserts the pricing rows and returns null.
async function applyPricing(
  userId: string,
  pricing: Record<string, unknown>,
): Promise<{ kind: 'locked'; unlockAt: string | null } | null> {
  const createdAt = await repo.getCreatedAt(userId);
  const createdAtMs = createdAt ? new Date(createdAt).getTime() : 0;
  const days = createdAtMs ? Math.floor((Date.now() - createdAtMs) / 86_400_000) : 0;

  // Bypass the lock for first-time pricing setup (no rows exist yet).
  const isFirstTimeSetup = (await repo.countPricingRows(userId)) === 0;
  if (!isFirstTimeSetup && days < PRICING_LOCK_DAYS) {
    return {
      kind: 'locked',
      unlockAt: createdAtMs ? new Date(createdAtMs + PRICING_LOCK_DAYS * 86_400_000).toISOString() : null,
    };
  }

  const rows = ['reel', 'story', 'video', 'post', 'shorts']
    .filter((t) => pricing[t] != null && Number(pricing[t]) > 0)
    .map((t) => ({ influencer_id: userId, platform: 'general', content_type: t, price: Number(pricing[t]) }));
  if (rows.length > 0) await repo.upsertPricing(rows);
  return null;
}

export async function updatePresence(userId: string, isOnline: boolean): Promise<void> {
  const now = new Date().toISOString();
  await repo.updateInfluencerRow(userId, {
    is_online: isOnline,
    last_seen_at: isOnline ? null : now,
    online_since: isOnline ? now : null,
  });
}

export async function updateProfileImage(userId: string, imageUrl: string): Promise<void> {
  await repo.updateAvatar(userId, imageUrl);
}

export async function updateGallery(userId: string, imageUrls: string[]): Promise<void> {
  await repo.updateInfluencerRow(userId, { gallery_images: imageUrls });
}

export async function connectSocial(
  userId: string,
  platform: string,
  handle: string,
): Promise<{ error?: string }> {
  const update: Record<string, string> = {};
  if (platform === 'instagram') update.instagram_handle = handle;
  else if (platform === 'youtube') update.youtube_handle = handle;
  else return { error: 'Platform must be instagram or youtube' };
  await repo.updateInfluencerRow(userId, update);
  return {};
}
