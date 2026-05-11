import crypto from 'crypto';
import axios from 'axios';
import { Request, Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

const APP_ID = process.env.INSTAGRAM_APP_ID;
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const CALLBACK_URL = process.env.INSTAGRAM_CALLBACK_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kalakaarian.com';
const FB_API = 'https://graph.facebook.com/v20.0';

function buildState(userId: string): string {
  const payload = Buffer.from(`${userId}:${Date.now()}`).toString('base64url');
  const sig = crypto.createHmac('sha256', APP_SECRET!).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyState(state: string): string | null {
  const dot = state.lastIndexOf('.');
  if (dot === -1) return null;
  const payload = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = crypto.createHmac('sha256', APP_SECRET!).update(payload).digest('hex');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const decoded = Buffer.from(payload, 'base64url').toString();
  const colonIdx = decoded.lastIndexOf(':');
  if (colonIdx === -1) return null;
  const userId = decoded.slice(0, colonIdx);
  const ts = parseInt(decoded.slice(colonIdx + 1), 10);
  if (!userId || isNaN(ts) || Date.now() - ts > 15 * 60 * 1000) return null;
  return userId;
}

export async function getInstagramAuthUrl(req: AuthRequest, res: Response): Promise<void> {
  if (!APP_ID || !APP_SECRET || !CALLBACK_URL) {
    res.status(503).json({ message: 'Instagram OAuth not configured' });
    return;
  }
  if (req.user?.role !== 'influencer') {
    res.status(403).json({ message: 'Influencer accounts only' });
    return;
  }
  const state = buildState(req.user.userId);
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: CALLBACK_URL,
    scope: 'instagram_basic,pages_show_list',
    response_type: 'code',
    state,
  });
  res.json({ url: `https://www.facebook.com/v20.0/dialog/oauth?${params}` });
}

export async function handleInstagramCallback(req: Request, res: Response): Promise<void> {
  const { code, state, error } = req.query as Record<string, string>;
  const fail = `${FRONTEND_URL}/influencer/dashboard?tab=analytics&ig_error=true`;
  if (error || !code || !state) { res.redirect(fail); return; }

  const userId = verifyState(state);
  if (!userId) { res.redirect(fail); return; }

  try {
    // Exchange code for short-lived user token
    const tokenRes = await axios.post(`${FB_API}/oauth/access_token`, null, {
      params: { client_id: APP_ID, client_secret: APP_SECRET, redirect_uri: CALLBACK_URL, code },
    });
    const shortToken: string = tokenRes.data.access_token;

    // Exchange for long-lived token (60 days)
    const longRes = await axios.get(`${FB_API}/oauth/access_token`, {
      params: { grant_type: 'fb_exchange_token', client_id: APP_ID, client_secret: APP_SECRET, fb_exchange_token: shortToken },
    });
    const longToken: string = longRes.data.access_token;
    const expiresIn: number = longRes.data.expires_in || 5184000;

    // Find Facebook page linked to an Instagram Business account
    const pagesRes = await axios.get(`${FB_API}/me/accounts`, { params: { access_token: longToken } });
    const pages: Array<{ id: string; access_token: string }> = pagesRes.data.data || [];
    if (!pages.length) { res.redirect(fail); return; }

    let igUserId: string | null = null;
    let pageToken: string | null = null;
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

    // Fetch real follower count immediately
    const { data: igData } = await axios.get(`${FB_API}/${igUserId}`, {
      params: { fields: 'followers_count,follows_count,media_count,username', access_token: pageToken },
    });
    const followerCount: number = igData.followers_count || 0;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    await adminClient.from('influencer_profiles').update({
      instagram_access_token: pageToken,
      instagram_ig_user_id: igUserId,
      instagram_token_expires_at: expiresAt,
      followers_count: followerCount,
    }).eq('id', userId);

    res.redirect(`${FRONTEND_URL}/influencer/dashboard?tab=analytics&ig_connected=true`);
  } catch (err) {
    console.error('Instagram OAuth callback error:', err);
    res.redirect(fail);
  }
}

export async function getInstagramConnectionStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { data } = await adminClient.from('influencer_profiles')
      .select('instagram_ig_user_id, instagram_token_expires_at, followers_count')
      .eq('id', req.user!.userId).single();
    res.json({
      connected: !!data?.instagram_ig_user_id,
      expiresAt: data?.instagram_token_expires_at || null,
      followerCount: data?.followers_count || null,
    });
  } catch {
    res.status(500).json({ message: 'Error fetching Instagram status' });
  }
}

export async function disconnectInstagram(req: AuthRequest, res: Response): Promise<void> {
  try {
    await adminClient.from('influencer_profiles').update({
      instagram_access_token: null,
      instagram_ig_user_id: null,
      instagram_token_expires_at: null,
    }).eq('id', req.user!.userId);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Error disconnecting Instagram' });
  }
}
