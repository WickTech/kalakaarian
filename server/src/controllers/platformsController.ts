import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  PlatformKind,
  getActiveAccount,
  listForUser,
  softDeleteAccount,
} from '../services/platformAccountService';
import { getMetrics, getHistory } from '../services/platformMetricsService';
import { syncInstagram } from '../services/instagramSyncService';
import { syncYouTube } from '../services/youtubeSyncService';

const PLATFORMS: PlatformKind[] = ['instagram', 'youtube'];

function isValidPlatform(p: unknown): p is PlatformKind {
  return typeof p === 'string' && (PLATFORMS as string[]).includes(p);
}

export async function getConnectedPlatforms(req: AuthRequest, res: Response): Promise<void> {
  try {
    const accounts = await listForUser(req.user!.userId);
    const byPlatform: Record<string, unknown> = {};
    for (const p of PLATFORMS) {
      const acc = accounts.find((a) => a.platform === p);
      byPlatform[p] = acc
        ? {
            connected: true,
            username: acc.platform_username,
            profileUrl: acc.platform_profile_url,
            tokenExpiresAt: acc.token_expires_at,
            lastSyncedAt: acc.last_synced_at,
            lastSyncStatus: acc.last_sync_status,
          }
        : { connected: false };
    }
    res.json(byPlatform);
  } catch (err) {
    console.error('getConnectedPlatforms error:', err);
    res.status(500).json({ message: 'Error fetching platforms' });
  }
}

export async function getPlatformMetrics(req: AuthRequest, res: Response): Promise<void> {
  const { platform } = req.params;
  if (!isValidPlatform(platform)) { res.status(400).json({ message: 'Unknown platform' }); return; }
  try {
    const account = await getActiveAccount(req.user!.userId, platform);
    if (!account) { res.json({ connected: false, metrics: null, history: [] }); return; }
    const [metrics, history] = await Promise.all([
      getMetrics(account.id),
      getHistory(account.id, 90),
    ]);
    res.json({
      connected: true,
      account: {
        username: account.platform_username,
        profileUrl: account.platform_profile_url,
        lastSyncedAt: account.last_synced_at,
        lastSyncStatus: account.last_sync_status,
      },
      metrics,
      history,
    });
  } catch (err) {
    console.error('getPlatformMetrics error:', err);
    res.status(500).json({ message: 'Error fetching metrics' });
  }
}

export async function triggerPlatformSync(req: AuthRequest, res: Response): Promise<void> {
  const { platform } = req.params;
  if (!isValidPlatform(platform)) { res.status(400).json({ message: 'Unknown platform' }); return; }
  try {
    const account = await getActiveAccount(req.user!.userId, platform);
    if (!account) { res.status(404).json({ message: 'Platform not connected' }); return; }
    if (platform === 'instagram') await syncInstagram(account);
    else await syncYouTube(account);
    res.json({ ok: true });
  } catch (err) {
    const e = err as { message?: string };
    console.error(`Sync ${platform} error:`, e?.message);
    res.status(502).json({ ok: false, message: 'Sync failed — try reconnecting' });
  }
}

export async function disconnectPlatform(req: AuthRequest, res: Response): Promise<void> {
  const { platform } = req.params;
  if (!isValidPlatform(platform)) { res.status(400).json({ message: 'Unknown platform' }); return; }
  try {
    await softDeleteAccount(req.user!.userId, platform);
    res.json({ ok: true });
  } catch (err) {
    console.error('disconnectPlatform error:', err);
    res.status(500).json({ message: 'Error disconnecting platform' });
  }
}
