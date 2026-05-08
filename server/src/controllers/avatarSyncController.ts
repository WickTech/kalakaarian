import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminClient } from '../config/supabase';
import { syncInstagramAvatar } from '../services/instagramAvatarService';

export const syncAllInstagramAvatars = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await adminClient
      .from('influencer_profiles')
      .select('id, instagram_handle')
      .not('instagram_handle', 'is', null);
    if (error) throw error;

    const results: Array<{ id: string; handle: string; ok: boolean }> = [];
    for (const row of (data ?? [])) {
      if (!row.instagram_handle) continue;
      const { avatarUrl } = await syncInstagramAvatar(row.id, row.instagram_handle as string);
      results.push({ id: row.id, handle: row.instagram_handle as string, ok: !!avatarUrl });
    }

    res.json({ synced: results.length, results });
  } catch (err) {
    console.error('Sync avatars error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
