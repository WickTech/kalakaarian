import axios from 'axios';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { buildOAuthState, verifyOAuthState } from '../utils/oauthState';
import { upsertPlatformAccount, getActiveAccount } from '../services/platformAccountService';
import { syncInstagram } from '../services/instagramSyncService';

const APP_ID = process.env.INSTAGRAM_APP_ID;
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const CALLBACK_URL = process.env.INSTAGRAM_CALLBACK_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kalakaarian.com';
const FB_API = 'https://graph.facebook.com/v20.0';

const SCOPES = [
  'instagram_basic',
  'pages_show_list',
  'instagram_manage_insights',
  'pages_read_engagement',
];

export async function getInstagramAuthUrl(req: AuthRequest, res: Response): Promise<void> {
  if (!APP_ID || !APP_SECRET || !CALLBACK_URL) {
    res.status(503).json({ message: 'Instagram OAuth not configured' });
    return;
  }
  if (req.user?.role !== 'influencer') {
    res.status(403).json({ message: 'Influencer accounts only' });
    return;
  }
  const state = buildOAuthState(req.user.userId, APP_SECRET);
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: CALLBACK_URL,
    scope: SCOPES.join(','),
    response_type: 'code',
    state,
  });
  res.json({ url: `https://www.facebook.com/v20.0/dialog/oauth?${params}` });
}

export async function handleInstagramCallback(req: Request, res: Response): Promise<void> {
  const { code, state, error } = req.query as Record<string, string>;
  const fail = `${FRONTEND_URL}/influencer/dashboard?tab=analytics&ig_error=true`;
  if (error || !code || !state) { res.redirect(fail); return; }

  const userId = verifyOAuthState(state, APP_SECRET);
  if (!userId) { res.redirect(fail); return; }

  try {
    const tokenRes = await axios.post(`${FB_API}/oauth/access_token`, null, {
      params: { client_id: APP_ID, client_secret: APP_SECRET, redirect_uri: CALLBACK_URL, code },
    });
    const shortToken: string = tokenRes.data.access_token;

    const longRes = await axios.get(`${FB_API}/oauth/access_token`, {
      params: { grant_type: 'fb_exchange_token', client_id: APP_ID, client_secret: APP_SECRET, fb_exchange_token: shortToken },
    });
    const longToken: string = longRes.data.access_token;
    const expiresIn: number = longRes.data.expires_in || 5184000;

    const pagesRes = await axios.get(`${FB_API}/me/accounts`, { params: { access_token: longToken } });
    const pages: Array<{ id: string; access_token: string }> = pagesRes.data.data || [];
    if (!pages.length) { res.redirect(fail); return; }

    let igUserId: string | null = null;
    let pageToken: string | null = null;
    let igUsername: string | null = null;
    for (const page of pages) {
      const { data: pageData } = await axios.get(`${FB_API}/${page.id}`, {
        params: { fields: 'instagram_business_account', access_token: page.access_token },
      });
      if (pageData.instagram_business_account?.id) {
        igUserId = pageData.instagram_business_account.id;
        pageToken = page.access_token;
        break;
      }
    }
    if (!igUserId || !pageToken) { res.redirect(fail); return; }

    try {
      const { data: igProfile } = await axios.get(`${FB_API}/${igUserId}`, {
        params: { fields: 'username', access_token: pageToken },
      });
      igUsername = igProfile.username ?? null;
    } catch { /* non-fatal */ }

    const account = await upsertPlatformAccount({
      influencerId: userId,
      platform: 'instagram',
      platformUserId: igUserId,
      platformUsername: igUsername,
      platformProfileUrl: igUsername ? `https://instagram.com/${igUsername}` : null,
      accessToken: pageToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      scopes: SCOPES,
    });

    // Best-effort initial sync; ignore errors here so user still lands on dashboard
    syncInstagram(account).catch((e) => console.error('Initial IG sync failed:', e?.message ?? e));

    res.redirect(`${FRONTEND_URL}/influencer/dashboard?tab=analytics&ig_connected=true`);
  } catch (err) {
    console.error('Instagram OAuth callback error:', err);
    res.redirect(fail);
  }
}

export async function getInstagramConnectionStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const account = await getActiveAccount(req.user!.userId, 'instagram');
    res.json({
      connected: !!account,
      expiresAt: account?.token_expires_at ?? null,
      username: account?.platform_username ?? null,
      lastSyncedAt: account?.last_synced_at ?? null,
      lastSyncStatus: account?.last_sync_status ?? null,
    });
  } catch {
    res.status(500).json({ message: 'Error fetching Instagram status' });
  }
}
