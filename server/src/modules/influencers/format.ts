import { applyPlatformMargin } from '../../utils/pricing';

// Pure row -> API-shape mapper for the influencers domain. No DB access here.
// Lives in its own file so other modules (campaigns, recommendations) can
// import it without pulling in the controller/route layer.

export const formatInfluencer = (row: any, opts: { rawPricing?: boolean } = {}) => {
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
    pricing: opts.rawPricing ? pricingObj : applyPlatformMargin(pricingObj),
    avgRating: row.avg_rating != null ? Number(row.avg_rating) : null,
    ratingCount: row.rating_count ?? 0,
    createdAt: row.created_at ?? null,
  };
};
