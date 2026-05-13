import { Response, Request } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { userId, role } = req.user;

    const { data: user } = await adminClient.from('profiles').select('id, email, username, name, role, phone, avatar_url').eq('id', userId).single();
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(userId);
    const isAdmin = authUser?.user_metadata?.is_admin ?? false;

    const table = role === 'brand' ? 'brand_profiles' : 'influencer_profiles';
    const { data: profile } = await adminClient.from(table).select('*').eq('id', userId).single();

    res.json({ user: { ...user, isAdmin }, profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { userId, role } = req.user;
    const { name, companyName, industry, website, logo, description, bio, city, niches, platform, tier, pricing, portfolio } = req.body;

    if (name) {
      await adminClient.from('profiles').update({ name }).eq('id', userId);
      await adminClient.auth.admin.updateUserById(userId, { user_metadata: { name } });
    }

    if (role === 'brand') {
      if (req.body.phone !== undefined) {
        await adminClient.from('profiles').update({ phone: req.body.phone }).eq('id', userId);
      }
      if (req.body.email !== undefined) {
        await adminClient.auth.admin.updateUserById(userId, { email: req.body.email });
        await adminClient.from('profiles').update({ email: req.body.email }).eq('id', userId);
      }
      const update: Record<string, unknown> = {};
      if (companyName) update.company_name = companyName;
      if (industry !== undefined) update.industry = industry;
      if (website !== undefined) update.website = website;
      if (logo !== undefined) update.logo_url = logo;
      if (description !== undefined) update.description = description;
      if (Object.keys(update).length > 0) {
        await adminClient.from('brand_profiles').update(update).eq('id', userId);
      }
    } else if (role === 'influencer') {
      const update: Record<string, unknown> = {};
      if (bio !== undefined) update.bio = bio;
      if (city) update.city = city;
      if (niches) update.niches = niches;
      if (platform) update.platforms = platform;
      if (tier) update.tier = tier;
      if (portfolio) update.portfolio = portfolio;
      if (Object.keys(update).length > 0) {
        await adminClient.from('influencer_profiles').update(update).eq('id', userId);
      }

      if (pricing) {
        const rows = ['reel', 'story', 'video', 'post']
          .filter(t => pricing[t] != null)
          .map(t => ({ influencer_id: userId, platform: 'general', content_type: t, price: pricing[t] }));
        if (rows.length > 0) {
          await adminClient.from('influencer_pricing').upsert(rows, { onConflict: 'influencer_id,platform,content_type' });
        }
      }
    }

    const { data: user } = await adminClient.from('profiles').select('id, email, username, name, role').eq('id', userId).single();
    const table = role === 'brand' ? 'brand_profiles' : 'influencer_profiles';
    const { data: profile } = await adminClient.from(table).select('*').eq('id', userId).single();
    res.json({ user, profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ message: 'New password must be at least 8 characters' }); return;
    }
    if (!currentPassword) {
      res.status(400).json({ message: 'Current password is required' }); return;
    }
    const { data: profileRow } = await adminClient.from('profiles').select('email').eq('id', userId).single();
    if (!profileRow?.email) {
      res.status(400).json({ message: 'Cannot update password — no email on account' }); return;
    }
    const { error: verifyError } = await adminClient.auth.signInWithPassword({
      email: profileRow.email,
      password: currentPassword,
    });
    if (verifyError) { res.status(400).json({ message: 'Current password is incorrect' }); return; }
    const { error } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) { res.status(400).json({ message: error.message }); return; }
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
