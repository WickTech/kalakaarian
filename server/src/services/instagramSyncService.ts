import axios from 'axios';
import { PlatformAccount, getDecryptedTokens, markSyncResult } from './platformAccountService';
import { writeMetrics, appendHistory, WritableMetrics } from './platformMetricsService';
import { computeAuthenticityScore } from './authenticityScoreService';

const FB_API = 'https://graph.facebook.com/v20.0';

interface IGMedia {
  id: string;
  permalink?: string;
  thumbnail_url?: string;
  media_url?: string;
  caption?: string;
  like_count?: number;
  comments_count?: number;
  timestamp?: string;
  media_type?: string;
}

interface AudienceBucket {
  name: string;
  value: number;
}

function parseAudienceInsight(data: unknown): Record<string, number> | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0] as { values?: Array<{ value?: Record<string, number> }> };
  const value = first?.values?.[0]?.value;
  if (!value || typeof value !== 'object') return null;
  // Normalize to shares (0-1)
  const total = Object.values(value).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value)) out[k] = Number((v / total).toFixed(4));
  return out;
}

function parseTotalInsight(data: unknown): number | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0] as { values?: Array<{ value?: number }> };
  return first?.values?.[0]?.value ?? null;
}

export async function syncInstagram(account: PlatformAccount): Promise<void> {
  const { accessToken } = await getDecryptedTokens(account.id);
  const igUserId = account.platform_user_id;

  try {
    // 1. Profile + counts
    const { data: profile } = await axios.get(`${FB_API}/${igUserId}`, {
      params: { fields: 'followers_count,follows_count,media_count,username', access_token: accessToken },
    });

    // 2. Recent media (engagement averaging)
    const { data: mediaRes } = await axios.get(`${FB_API}/${igUserId}/media`, {
      params: {
        fields: 'id,permalink,thumbnail_url,media_url,caption,like_count,comments_count,timestamp,media_type',
        limit: 20,
        access_token: accessToken,
      },
    });
    const media: IGMedia[] = mediaRes?.data ?? [];
    const recent = media.slice(0, 10);
    const totalLikes = recent.reduce((sum, m) => sum + (m.like_count ?? 0), 0);
    const totalComments = recent.reduce((sum, m) => sum + (m.comments_count ?? 0), 0);
    const avgLikes = recent.length > 0 ? Math.round(totalLikes / recent.length) : null;
    const avgComments = recent.length > 0 ? Math.round(totalComments / recent.length) : null;
    const followers = profile.followers_count ?? 0;
    const engagementRate = followers > 0 && recent.length > 0
      ? Number((((totalLikes + totalComments) / recent.length / followers) * 100).toFixed(2))
      : null;

    // 3. Insights (best-effort — requires instagram_manage_insights scope)
    let reach28d: number | null = null;
    let impressions28d: number | null = null;
    let audienceGenderAge: Record<string, number> | null = null;
    let audienceCountry: Record<string, number> | null = null;

    try {
      const { data: rIns } = await axios.get(`${FB_API}/${igUserId}/insights`, {
        params: { metric: 'reach,impressions', period: 'days_28', access_token: accessToken },
      });
      const ins = rIns?.data ?? [];
      reach28d = parseTotalInsight(ins.filter((d: { name: string }) => d.name === 'reach'));
      impressions28d = parseTotalInsight(ins.filter((d: { name: string }) => d.name === 'impressions'));
    } catch (e) {
      // Insights scope may not be granted yet
    }

    try {
      const { data: aIns } = await axios.get(`${FB_API}/${igUserId}/insights`, {
        params: { metric: 'audience_gender_age,audience_country', period: 'lifetime', access_token: accessToken },
      });
      const ins = aIns?.data ?? [];
      audienceGenderAge = parseAudienceInsight(ins.filter((d: { name: string }) => d.name === 'audience_gender_age'));
      audienceCountry = parseAudienceInsight(ins.filter((d: { name: string }) => d.name === 'audience_country'));
    } catch (e) {
      // Same — silently skip
    }

    const topMedia = recent.slice(0, 5).map((m) => ({
      id: m.id,
      url: m.permalink ?? null,
      thumbnail: m.thumbnail_url || m.media_url || null,
      likes: m.like_count ?? 0,
      comments: m.comments_count ?? 0,
      timestamp: m.timestamp ?? null,
    }));

    const authenticityScore = computeAuthenticityScore({
      followers,
      reach28d,
      avgLikes,
      avgComments,
      audienceCountry,
      audienceGenderAge,
    });

    const metrics: WritableMetrics = {
      followers,
      following: profile.follows_count ?? null,
      posts_count: profile.media_count ?? null,
      reach_28d: reach28d,
      impressions_28d: impressions28d,
      avg_likes: avgLikes,
      avg_comments: avgComments,
      engagement_rate: engagementRate,
      audience_gender_age: audienceGenderAge,
      audience_country: audienceCountry,
      top_media: topMedia,
      authenticity_score: authenticityScore,
    };

    await writeMetrics(account.id, metrics);
    await appendHistory(account.id, followers, engagementRate, reach28d);
    await markSyncResult(account.id, 'ok');
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { error?: { code?: number; type?: string } } }, message?: string };
    const isExpired = axiosErr?.response?.data?.error?.code === 190 || axiosErr?.response?.data?.error?.type === 'OAuthException';
    await markSyncResult(account.id, isExpired ? 'token_expired' : 'failed', axiosErr?.message ?? 'Instagram sync failed');
    throw err;
  }
}
