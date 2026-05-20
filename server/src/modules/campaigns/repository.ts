import { adminClient } from '../../config/supabase';

// All Supabase access for the campaigns domain lives here. Controllers and
// services never touch adminClient for campaign tables directly.

const CAMPAIGN_SELECT = '*, profiles!campaigns_brand_id_fkey(name, email)';

export interface ListFilter {
  status?: string;
  genre?: string | string[];
  platform?: string | string[];
}

export interface AmountRow {
  influencer_id: string;
  amount: number;
}

export interface PriceRow {
  influencer_id: string;
  price: number;
}

export async function listByBrand(
  brandId: string,
  filter: ListFilter,
  range: { from: number; to: number },
): Promise<{ rows: unknown[]; count: number }> {
  let q = adminClient
    .from('campaigns')
    .select(CAMPAIGN_SELECT, { count: 'exact' })
    .eq('brand_id', brandId);
  if (filter.status) q = q.eq('status', filter.status);
  if (filter.genre) q = q.overlaps('niches', Array.isArray(filter.genre) ? filter.genre : [filter.genre]);
  if (filter.platform) {
    q = q.overlaps('platforms', Array.isArray(filter.platform) ? filter.platform : [filter.platform]);
  }
  const { data, count, error } = await q
    .order('created_at', { ascending: false })
    .range(range.from, range.to);
  if (error) throw error;
  return { rows: data ?? [], count: count ?? 0 };
}

export async function findById(id: string): Promise<unknown | null> {
  const { data, error } = await adminClient
    .from('campaigns')
    .select(CAMPAIGN_SELECT)
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data;
}

export async function insert(row: Record<string, unknown>): Promise<unknown | null> {
  const { data, error } = await adminClient
    .from('campaigns')
    .insert(row)
    .select(CAMPAIGN_SELECT)
    .single();
  if (error || !data) return null;
  return data;
}

export async function updateOwned(
  id: string,
  brandId: string,
  patch: Record<string, unknown>,
): Promise<unknown | null> {
  const { data, error } = await adminClient
    .from('campaigns')
    .update(patch)
    .eq('id', id)
    .eq('brand_id', brandId)
    .select(CAMPAIGN_SELECT)
    .single();
  if (error || !data) return null;
  return data;
}

export async function deleteOwned(id: string, brandId: string): Promise<boolean> {
  // Cascades delete campaign_creators via FK constraint.
  const { error } = await adminClient
    .from('campaigns')
    .delete()
    .eq('id', id)
    .eq('brand_id', brandId);
  return !error;
}

export async function listCampaignTransactions(campaignId: string, brandId: string): Promise<AmountRow[]> {
  const { data } = await adminClient
    .from('transactions')
    .select('influencer_id, amount')
    .eq('campaign_id', campaignId)
    .eq('brand_id', brandId);
  return (data ?? []) as AmountRow[];
}

export async function listCampaignCartItems(campaignId: string, brandId: string): Promise<PriceRow[]> {
  const { data } = await adminClient
    .from('cart_items')
    .select('influencer_id, price')
    .eq('campaign_id', campaignId)
    .eq('brand_id', brandId);
  return (data ?? []) as PriceRow[];
}

export async function listInfluencerProfiles(ids: string[]): Promise<Record<string, unknown>[]> {
  const { data, error } = await adminClient
    .from('influencer_profiles')
    .select('*, profiles(name, avatar_url), influencer_pricing(platform, content_type, price)')
    .in('id', ids);
  if (error) throw error;
  return (data ?? []) as Record<string, unknown>[];
}
