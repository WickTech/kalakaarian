import axios from 'axios';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { buildOAuthState, verifyOAuthState } from '../utils/oauthState';
import { upsertPlatformAccount, getActiveAccount } from '../services/platformAccountService';
import { syncYouTube } from '../services/youtubeSyncService';

const CLIENT_ID = process.env.YOUTUBE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
const CALLBACK_URL = process.env.YOUTUBE_OAUTH_CALLBACK_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kalakaarian.com';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'openid',
];

export async function getYouTubeAuthUrl(req: AuthRequest, res: Response): Promise<void> {
  if (!CLIENT_ID || !CLIENT_SECRET || !CALLBACK_URL) {
    res.status(503).json({ message: 'YouTube OAuth not configured' });
    return;
  }
  if (req.user?.role !== 'influencer') {
    res.status(403).json({ message: 'Influencer accounts only' });
    return;
  }
  const state = buildOAuthState(req.user.userId, CLIENT_SECRET);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
}

export async function handleYouTubeCallback(req: Request, res: Response): Promise<void> {
  const { code, state, error } = req.query as Record<string, string>;
  const fail = `${FRONTEND_URL}/influencer/dashboard?tab=analytics&yt_error=true`;
  if (error || !code || !state) { res.redirect(fail); return; }

  const userId = verifyOAuthState(state, CLIENT_SECRET);
  if (!userId) { res.redirect(fail); return; }

  try {
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        redirect_uri: CALLBACK_URL!,
        grant_type: 'authorization_code',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    if (!refresh_token) {
      // User had previously consented; Google won't re-issue refresh token.
      // We require it; redirect to fail with hint to revoke and reconnect.
      res.redirect(`${fail}&reason=missing_refresh`);
      return;
    }

    // Resolve channel
    const { data: chData } = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet', mine: true },
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const channel = chData?.items?.[0];
    if (!channel?.id) { res.redirect(fail); return; }

    const account = await upsertPlatformAccount({
      influencerId: userId,
      platform: 'youtube',
      platformUserId: channel.id,
      platformUsername: channel.snippet?.title ?? null,
      platformProfileUrl: `https://youtube.com/channel/${channel.id}`,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: new Date(Date.now() + expires_in * 1000).toISOString(),
      scopes: SCOPES,
    });

    syncYouTube(account).catch((e) => console.error('Initial YT sync failed:', e?.message ?? e));

    res.redirect(`${FRONTEND_URL}/influencer/dashboard?tab=analytics&yt_connected=true`);
  } catch (err) {
    console.error('YouTube OAuth callback error:', err);
    res.redirect(fail);
  }
}

export async function getYouTubeConnectionStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const account = await getActiveAccount(req.user!.userId, 'youtube');
    res.json({
      connected: !!account,
      expiresAt: account?.token_expires_at ?? null,
      username: account?.platform_username ?? null,
      lastSyncedAt: account?.last_synced_at ?? null,
      lastSyncStatus: account?.last_sync_status ?? null,
    });
  } catch {
    res.status(500).json({ message: 'Error fetching YouTube status' });
  }
}
