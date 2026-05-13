import axios from 'axios';
import { PlatformAccount, getDecryptedTokens, markSyncResult, updateAccessToken } from './platformAccountService';
import { writeMetrics, appendHistory, WritableMetrics } from './platformMetricsService';
import { computeAuthenticityScore } from './authenticityScoreService';

const CLIENT_ID = process.env.YOUTUBE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;

async function refreshAccessTokenIfNeeded(account: PlatformAccount): Promise<string> {
  const { accessToken, refreshToken } = await getDecryptedTokens(account.id);
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  const fiveMinFromNow = Date.now() + 5 * 60 * 1000;
  if (expiresAt > fiveMinFromNow) return accessToken;
  if (!refreshToken || !CLIENT_ID || !CLIENT_SECRET) throw new Error('YouTube refresh not configured');

  const { data } = await axios.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const newAccess: string = data.access_token;
  const expiresIn: number = data.expires_in ?? 3600;
  const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  await updateAccessToken(account.id, newAccess, newExpiresAt);
  return newAccess;
}

interface ChannelStats {
  subscribers: number; videos: number; totalViews: number; uploadsPlaylist: string | null;
}

async function fetchChannelStats(accessToken: string): Promise<ChannelStats> {
  const { data } = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
    params: { part: 'statistics,contentDetails', mine: true },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const item = data?.items?.[0];
  return {
    subscribers: parseInt(item?.statistics?.subscriberCount ?? '0', 10),
    videos: parseInt(item?.statistics?.videoCount ?? '0', 10),
    totalViews: parseInt(item?.statistics?.viewCount ?? '0', 10),
    uploadsPlaylist: item?.contentDetails?.relatedPlaylists?.uploads ?? null,
  };
}

interface RecentVideoSummary {
  topMedia: Array<Record<string, unknown>>;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  count: number;
}

async function fetchRecentVideos(accessToken: string, uploadsPlaylist: string | null): Promise<RecentVideoSummary> {
  const empty: RecentVideoSummary = { topMedia: [], totalLikes: 0, totalComments: 0, totalViews: 0, count: 0 };
  if (!uploadsPlaylist) return empty;
  const { data: playlist } = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
    params: { part: 'contentDetails,snippet', playlistId: uploadsPlaylist, maxResults: 10 },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const videoIds = (playlist?.items ?? []).map((i: { contentDetails: { videoId: string } }) => i.contentDetails.videoId).filter(Boolean);
  if (!videoIds.length) return empty;

  const { data: vidsData } = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: { part: 'snippet,statistics', id: videoIds.join(',') },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const vids = (vidsData?.items ?? []) as Array<{ id: string; snippet: { title: string; thumbnails?: { medium?: { url: string } }; publishedAt: string }; statistics?: { viewCount?: string; likeCount?: string; commentCount?: string } }>;
  let totalLikes = 0, totalComments = 0, totalViews = 0;
  const topMedia = vids.map((v) => {
    const views = parseInt(v.statistics?.viewCount ?? '0', 10);
    const likes = parseInt(v.statistics?.likeCount ?? '0', 10);
    const comments = parseInt(v.statistics?.commentCount ?? '0', 10);
    totalLikes += likes; totalComments += comments; totalViews += views;
    return {
      id: v.id,
      url: `https://youtube.com/watch?v=${v.id}`,
      thumbnail: v.snippet?.thumbnails?.medium?.url ?? null,
      title: v.snippet?.title ?? null,
      views, likes, comments,
      timestamp: v.snippet?.publishedAt ?? null,
    };
  });
  return { topMedia: topMedia.slice(0, 5), totalLikes, totalComments, totalViews, count: vids.length };
}

interface YTAnalyticsBucket {
  audienceCountry: Record<string, number> | null;
  audienceGenderAge: Record<string, number> | null;
  reach28d: number | null;
}

async function fetchYTAnalytics(accessToken: string): Promise<YTAnalyticsBucket> {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 28 * 86400_000).toISOString().slice(0, 10);
  const base = 'https://youtubeanalytics.googleapis.com/v2/reports';
  const headers = { Authorization: `Bearer ${accessToken}` };

  let reach28d: number | null = null;
  let audienceCountry: Record<string, number> | null = null;
  let audienceGenderAge: Record<string, number> | null = null;

  try {
    const { data } = await axios.get(base, { params: { ids: 'channel==MINE', startDate: start, endDate: end, metrics: 'views' }, headers });
    reach28d = data?.rows?.[0]?.[0] ?? null;
  } catch { /* ignore */ }

  try {
    const { data } = await axios.get(base, { params: { ids: 'channel==MINE', startDate: start, endDate: end, dimensions: 'country', metrics: 'views', sort: '-views', maxResults: 25 }, headers });
    const rows = (data?.rows ?? []) as Array<[string, number]>;
    const total = rows.reduce((a, [, v]) => a + v, 0);
    if (total > 0) {
      audienceCountry = {};
      for (const [code, v] of rows) audienceCountry[code] = Number((v / total).toFixed(4));
    }
  } catch { /* ignore */ }

  try {
    const { data } = await axios.get(base, { params: { ids: 'channel==MINE', startDate: start, endDate: end, dimensions: 'ageGroup,gender', metrics: 'viewerPercentage' }, headers });
    const rows = (data?.rows ?? []) as Array<[string, string, number]>;
    if (rows.length > 0) {
      audienceGenderAge = {};
      for (const [age, gender, pct] of rows) audienceGenderAge[`${gender}.${age}`] = Number((pct / 100).toFixed(4));
    }
  } catch { /* ignore */ }

  return { audienceCountry, audienceGenderAge, reach28d };
}

export async function syncYouTube(account: PlatformAccount): Promise<void> {
  try {
    const accessToken = await refreshAccessTokenIfNeeded(account);
    const stats = await fetchChannelStats(accessToken);
    const recent = await fetchRecentVideos(accessToken, stats.uploadsPlaylist);
    const analytics = await fetchYTAnalytics(accessToken);

    const followers = stats.subscribers;
    const avgLikes = recent.count > 0 ? Math.round(recent.totalLikes / recent.count) : null;
    const avgComments = recent.count > 0 ? Math.round(recent.totalComments / recent.count) : null;
    const engagementRate = followers > 0 && recent.count > 0
      ? Number((((recent.totalLikes + recent.totalComments) / recent.count / followers) * 100).toFixed(2))
      : null;

    const authenticityScore = computeAuthenticityScore({
      followers,
      reach28d: analytics.reach28d,
      avgLikes,
      avgComments,
      audienceCountry: analytics.audienceCountry,
      audienceGenderAge: analytics.audienceGenderAge,
    });

    const metrics: WritableMetrics = {
      followers,
      following: null,
      posts_count: stats.videos,
      reach_28d: analytics.reach28d,
      impressions_28d: null,
      avg_likes: avgLikes,
      avg_comments: avgComments,
      engagement_rate: engagementRate,
      audience_gender_age: analytics.audienceGenderAge,
      audience_country: analytics.audienceCountry,
      top_media: recent.topMedia,
      authenticity_score: authenticityScore,
    };

    await writeMetrics(account.id, metrics);
    await appendHistory(account.id, followers, engagementRate, analytics.reach28d);
    await markSyncResult(account.id, 'ok');
  } catch (err: unknown) {
    const e = err as { response?: { status?: number }, message?: string };
    const isExpired = e?.response?.status === 401;
    await markSyncResult(account.id, isExpired ? 'token_expired' : 'failed', e?.message ?? 'YouTube sync failed');
    throw err;
  }
}
