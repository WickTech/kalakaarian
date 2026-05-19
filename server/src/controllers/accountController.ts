import { Response } from 'express';
import { adminClient, createAuthClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { sendAdminAlertEmail } from '../services/emailService';

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const { confirmation, password } = req.body;
    if (confirmation !== 'delete') {
      res.status(400).json({ message: 'Type delete to confirm account deletion' }); return;
    }

    // Check if user has email/password provider — if so, require password verification
    const { data: authUserData } = await adminClient.auth.admin.getUserById(req.user.userId);
    const hasEmailProvider = authUserData?.user?.identities?.some(
      (i: { provider: string }) => i.provider === 'email'
    );

    if (hasEmailProvider) {
      if (!password || typeof password !== 'string') {
        res.status(400).json({ message: 'Password is required to delete your account' }); return;
      }
      const { data: profileRow } = await adminClient
        .from('profiles').select('email').eq('id', req.user.userId).single();
      if (!profileRow?.email) {
        res.status(400).json({ message: 'Cannot verify identity — no email on account' }); return;
      }
      const { error: verifyError } = await createAuthClient().auth.signInWithPassword({
        email: profileRow.email,
        password,
      });
      if (verifyError) { res.status(401).json({ message: 'Incorrect password' }); return; }
    }

    const userId = req.user.userId;
    const role = req.user.role;

    // conversations.participant_ids is a UUID array — no FK cascade, delete explicitly
    const { data: convRows } = await adminClient
      .from('conversations')
      .select('id')
      .contains('participant_ids', [userId]);
    if (convRows && convRows.length > 0) {
      const ids = convRows.map((r: { id: string }) => r.id);
      await adminClient.from('messages').delete().in('conversation_id', ids);
      await adminClient.from('conversations').delete().in('id', ids);
    }

    // Explicitly delete role profile rows (belt-and-suspenders on top of CASCADE)
    if (role === 'influencer') {
      await adminClient.from('influencer_profiles').delete().eq('id', userId);
    } else if (role === 'brand') {
      await adminClient.from('brand_profiles').delete().eq('id', userId);
    }
    await adminClient.from('profiles').delete().eq('id', userId);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
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

const ALLOWED_AVATAR_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

export const updateAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { imageBase64, mimeType } = req.body as { imageBase64?: string; mimeType?: string };
    if (!imageBase64 || !mimeType) {
      res.status(400).json({ message: 'imageBase64 and mimeType are required' }); return;
    }
    if (!ALLOWED_AVATAR_MIME.has(mimeType)) {
      res.status(400).json({ message: 'Unsupported image type. Use PNG, JPEG, or WebP.' }); return;
    }
    const data = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const buf = Buffer.from(data, 'base64');
    if (buf.length === 0) { res.status(400).json({ message: 'Empty image' }); return; }
    if (buf.length > MAX_AVATAR_BYTES) {
      res.status(400).json({ message: 'Image exceeds 2MB limit' }); return;
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const key = `profile/${req.user.userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await adminClient.storage
      .from('avatars')
      .upload(key, buf, { contentType: mimeType, upsert: true });
    if (upErr) { res.status(500).json({ message: 'Upload failed' }); return; }

    const { data: pub } = adminClient.storage.from('avatars').getPublicUrl(key);
    const avatarUrl = pub.publicUrl;
    await adminClient.from('profiles').update({ avatar_url: avatarUrl }).eq('id', req.user.userId);
    res.json({ avatarUrl });
  } catch (error) {
    console.error('updateAvatar error:', error);
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
