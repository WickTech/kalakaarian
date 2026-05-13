import { adminClient } from '../config/supabase';

export interface PlatformMetrics {
  account_id: string;
  followers: number | null;
  following: number | null;
  posts_count: number | null;
  reach_28d: number | null;
  impressions_28d: number | null;
  avg_likes: number | null;
  avg_comments: number | null;
  engagement_rate: number | null;
  audience_gender_age: Record<string, number> | null;
  audience_country: Record<string, number> | null;
  top_media: Array<Record<string, unknown>> | null;
  authenticity_score: number | null;
  fetched_at: string;
}

export type WritableMetrics = Omit<PlatformMetrics, 'account_id' | 'fetched_at'>;

export async function writeMetrics(accountId: string, metrics: WritableMetrics): Promise<void> {
  const row = { account_id: accountId, ...metrics, fetched_at: new Date().toISOString() };
  const { error } = await adminClient
    .from('creator_platform_metrics')
    .upsert(row, { onConflict: 'account_id' });
  if (error) throw error;
}

export async function getMetrics(accountId: string): Promise<PlatformMetrics | null> {
  const { data } = await adminClient
    .from('creator_platform_metrics')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle();
  return data ?? null;
}

export async function appendHistory(
  accountId: string,
  followers: number | null,
  engagementRate: number | null,
  reach28d: number | null,
): Promise<void> {
  const captured_at = new Date().toISOString().slice(0, 10);
  await adminClient
    .from('creator_platform_metric_history')
    .upsert(
      { account_id: accountId, captured_at, followers, engagement_rate: engagementRate, reach_28d: reach28d },
      { onConflict: 'account_id,captured_at' }
    );
}

export interface HistoryPoint {
  captured_at: string;
  followers: number | null;
  engagement_rate: number | null;
  reach_28d: number | null;
}

export async function getHistory(accountId: string, days = 90): Promise<HistoryPoint[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const { data } = await adminClient
    .from('creator_platform_metric_history')
    .select('captured_at, followers, engagement_rate, reach_28d')
    .eq('account_id', accountId)
    .gte('captured_at', since)
    .order('captured_at', { ascending: true });
  return (data ?? []) as HistoryPoint[];
}
