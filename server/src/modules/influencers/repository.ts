import { adminClient } from '../../config/supabase';

// All Supabase access for the influencers domain lives here. Controllers and
// services never touch adminClient for influencer tables directly.

export const ALLOWED_GENDERS = ['male', 'female', 'non_binary', 'prefer_not_to_say'] as const;
const VALID_TIERS = new Set(['nano', 'micro', 'macro', 'celeb']);

const SELECT =
  '*, profiles(name, username, phone, avatar_url), influencer_pricing(platform, content_type, price)';

const normalizeTier = (t: unknown): string | undefined => {
  if (!t || typeof t !== 'string') return undefined;
  const lower = t.toLowerCase();
  if (lower === 'mega') return 'celeb'; // backwards-compat alias
  return VALID_TIERS.has(lower) ? lower : undefined;
};

export interface InfluencerFilter {
  tier?: string;
  city?: string;
  gender?: string;
  genre?: string | string[];
  platform?: string | string[];
  q?: string;
  name?: string;
}

const applyFilters = (q: any, params: InfluencerFilter): any => {
  const tier = normalizeTier(params.tier);
  if (tier) q = q.eq('tier', tier);
  if (params.city) q = q.ilike('city', `%${params.city}%`);
  if (params.gender && (ALLOWED_GENDERS as readonly string[]).includes(params.gender)) {
    q = q.eq('gender', params.gender);
  }
  if (params.genre) {
    q = q.overlaps('niches', Array.isArray(params.genre) ? params.genre : [params.genre]);
  }
  if (params.platform) {
    q = q.overlaps('platforms', Array.isArray(params.platform) ? params.platform : [params.platform]);
  }
  if (params.name) q = q.ilike('profiles.name', `%${params.name}%`);
  if (params.q) q = q.textSearch('fts', params.q, { type: 'websearch' });

  // Hide creators who explicitly went offline (last_seen_at is set + is_online false).
  // Creators who never toggled presence (last_seen_at IS NULL) still appear.
  q = q.or('is_online.eq.true,last_seen_at.is.null');
  // Respect creator privacy flags — default true keeps existing rows unaffected.
  q = q.eq('marketplace_visible', true).eq('is_discoverable', true);
  return q;
};

export async function queryInfluencers(
  filter: InfluencerFilter,
  range: { from: number; to: number },
): Promise<{ rows: unknown[]; count: number }> {
  let q = adminClient.from('influencer_profiles').select(SELECT);
  q = applyFilters(q, filter)
    .order('is_online', { ascending: false })
    .order('last_seen_at', { ascending: false, nullsFirst: false })
    .order('tier', { ascending: true })
    .order('created_at', { ascending: false })
    .range(range.from, range.to);
  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: data ?? [], count: count ?? 0 };
}

export async function countByTier(tier: string): Promise<number> {
  const { count } = await adminClient
    .from('influencer_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('tier', tier);
  return count ?? 0;
}

export async function findById(id: string): Promise<any | null> {
  const { data, error } = await adminClient
    .from('influencer_profiles')
    .select(SELECT)
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data;
}

export async function updateProfilesTable(
  userId: string,
  patch: Record<string, unknown>,
): Promise<{ code?: string }> {
  const { error } = await adminClient.from('profiles').update(patch).eq('id', userId);
  return { code: (error as { code?: string } | null)?.code };
}

export async function updateAuthName(userId: string, name: string): Promise<void> {
  await adminClient.auth.admin.updateUserById(userId, { user_metadata: { name } });
}

export async function updateInfluencerRow(
  userId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await adminClient.from('influencer_profiles').update(patch).eq('id', userId);
}

export async function getCreatedAt(userId: string): Promise<string | null> {
  const { data } = await adminClient
    .from('influencer_profiles')
    .select('created_at')
    .eq('id', userId)
    .single();
  return data?.created_at ?? null;
}

export async function countPricingRows(userId: string): Promise<number> {
  const { count } = await adminClient
    .from('influencer_pricing')
    .select('id', { count: 'exact', head: true })
    .eq('influencer_id', userId);
  return count ?? 0;
}

export async function upsertPricing(rows: Record<string, unknown>[]): Promise<void> {
  const { error } = await adminClient
    .from('influencer_pricing')
    .upsert(rows, { onConflict: 'influencer_id,platform,content_type' });
  if (error) console.error('pricing upsert failed:', error);
}

export async function updateAvatar(userId: string, avatarUrl: string): Promise<void> {
  await adminClient.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId);
}
