import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { logAdminAction } from './adminController';

export const getFeatureFlags = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await adminClient
      .from('feature_flags')
      .select('key, enabled, description, updated_at')
      .order('key');
    if (error) { res.status(500).json({ message: 'Failed to fetch flags' }); return; }
    res.json({ flags: data ?? [] });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateFeatureFlag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { enabled } = req.body as { enabled: boolean };
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ message: 'enabled must be boolean' }); return;
    }
    const { error } = await adminClient.from('feature_flags').upsert({
      key,
      enabled,
      updated_by: req.user!.userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) { res.status(500).json({ message: 'Failed to update flag' }); return; }
    await logAdminAction(req.user!.userId, 'toggle_feature_flag', 'flag', key, { enabled }, req.ip);
    res.json({ message: 'Flag updated', key, enabled });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
