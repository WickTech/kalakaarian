import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { sendAdminAlertEmail } from '../services/emailService';

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const { confirmation } = req.body;
    if (confirmation !== 'DELETE') {
      res.status(400).json({ message: 'Type DELETE to confirm account deletion' }); return;
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(req.user.userId);
    if (deleteError) throw deleteError;

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const signOutAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { error } = await adminClient.auth.admin.signOut(req.user.userId, 'global');
    if (error) throw error;
    res.json({ message: 'Signed out from all devices' });
  } catch (error) {
    console.error('Sign out all error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const ALLOWED_NOTIF_KEYS = new Set(['campaigns', 'proposals', 'messages', 'payments', 'marketing']);
const ALLOWED_VISIBILITY = new Set(['public', 'brands_only', 'private']);
const ALLOWED_BRAND_VISIBILITY = new Set(['public', 'private']);

export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { userId, role } = req.user;

    const { data: profile } = await adminClient
      .from('profiles')
      .select('notification_prefs')
      .eq('id', userId)
      .single();

    const table = role === 'brand' ? 'brand_profiles' : 'influencer_profiles';
    const privacySelect = role === 'brand'
      ? 'marketplace_visible, profile_visibility'
      : 'is_discoverable, marketplace_visible, presence_visible, profile_visibility';

    const { data: roleProfile } = await adminClient
      .from(table)
      .select(privacySelect)
      .eq('id', userId)
      .single();

    res.json({
      notifications: profile?.notification_prefs ?? {},
      privacy: roleProfile ?? {},
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { userId, role } = req.user;
    const { notifications, privacy } = req.body as {
      notifications?: Record<string, boolean>;
      privacy?: Record<string, unknown>;
    };

    if (notifications) {
      const safe: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(notifications)) {
        if (ALLOWED_NOTIF_KEYS.has(k) && typeof v === 'boolean') safe[k] = v;
      }
      const { data: cur } = await adminClient.from('profiles').select('notification_prefs').eq('id', userId).single();
      const merged = { ...(cur?.notification_prefs ?? {}), ...safe };
      await adminClient.from('profiles').update({ notification_prefs: merged }).eq('id', userId);
    }

    if (privacy) {
      const table = role === 'brand' ? 'brand_profiles' : 'influencer_profiles';
      const update: Record<string, unknown> = {};

      if (typeof privacy.marketplace_visible === 'boolean') update.marketplace_visible = privacy.marketplace_visible;

      if (role === 'influencer') {
        if (typeof privacy.is_discoverable === 'boolean') update.is_discoverable = privacy.is_discoverable;
        if (typeof privacy.presence_visible === 'boolean') update.presence_visible = privacy.presence_visible;
        if (typeof privacy.profile_visibility === 'string' && ALLOWED_VISIBILITY.has(privacy.profile_visibility as string)) {
          update.profile_visibility = privacy.profile_visibility;
        }
      }
      if (role === 'brand') {
        if (typeof privacy.profile_visibility === 'string' && ALLOWED_BRAND_VISIBILITY.has(privacy.profile_visibility as string)) {
          update.profile_visibility = privacy.profile_visibility;
        }
      }

      if (Object.keys(update).length > 0) {
        await adminClient.from(table).update(update).eq('id', userId);
      }
    }

    res.json({ message: 'Preferences updated' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const requestDataExport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { userId } = req.user;

    // Rate-limit: one pending request at a time
    const { data: existing } = await adminClient
      .from('data_export_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .limit(1);

    if (existing && existing.length > 0) {
      res.status(429).json({ message: 'A data export request is already pending' });
      return;
    }

    await adminClient.from('data_export_requests').insert({ user_id: userId });

    const { data: profileRow } = await adminClient
      .from('profiles')
      .select('name, email')
      .eq('id', userId)
      .single();

    const name = (profileRow as { name?: string } | null)?.name ?? 'User';
    const email = (profileRow as { email?: string } | null)?.email ?? '';

    sendAdminAlertEmail(
      'Data Export Request',
      `User ${name} (${email}, ID: ${userId}) requested a data export.`,
    ).catch(() => {/* non-fatal */});

    res.json({ message: 'Data export requested. You will receive an email within 30 days.' });
  } catch (error) {
    console.error('Request data export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
