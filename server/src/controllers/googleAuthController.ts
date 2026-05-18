import { Request, Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

const ALLOWED_GENDERS = ['male', 'female', 'non_binary', 'prefer_not_to_say'];
const VALID_TIERS = ['nano', 'micro', 'macro', 'celeb'];

/**
 * Google OAuth login. For new users, creates a stub `profiles` row with
 * onboarding_completed=false. Does NOT create role-specific (brand/influencer)
 * rows — the client must call /api/auth/complete-onboarding to do that.
 *
 * For existing users, returns the current profile + token unchanged.
 */
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token: idToken, role: requestedRole } = req.body;
    if (!idToken) {
      res.status(400).json({ message: 'Google ID token is required' });
      return;
    }

    const { data, error } = await adminClient.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error || !data.session || !data.user) {
      res.status(400).json({ message: error?.message ?? 'Google login failed' });
      return;
    }

    const userId = data.user.id;
    const { data: existing } = await adminClient
      .from('profiles')
      .select('id, onboarding_completed')
      .eq('id', userId)
      .single();

    const isNewUser = !existing;

    if (isNewUser) {
      // Default role from client toggle — but onboarding completion is what
      // actually unlocks the app, and that requires a server-verified second step.
      const userRole = requestedRole === 'influencer' ? 'influencer' : 'brand';
      const googleEmail = data.user.email ?? '';
      const googleName =
        data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? '';

      await adminClient.from('profiles').insert({
        id: userId,
        role: userRole,
        name: googleName,
        email: googleEmail,
        avatar_url: data.user.user_metadata?.avatar_url ?? null,
        onboarding_completed: false,
      });
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { role: userRole, name: googleName, is_admin: false },
      });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, email, name, role, is_super_admin, onboarding_completed')
      .eq('id', userId)
      .single();

    const isSuperAdmin = profile?.is_super_admin ?? false;
    if (isSuperAdmin !== (data.user.user_metadata?.is_super_admin ?? false)) {
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { ...data.user.user_metadata, is_super_admin: isSuperAdmin },
      });
    }

    const needsOnboarding = profile?.onboarding_completed === false;

    res.json({
      message: 'Google login successful',
      user: {
        id: profile?.id,
        email: profile?.email,
        name: profile?.name,
        role: profile?.role,
        isAdmin: isSuperAdmin || (data.user.user_metadata?.is_admin ?? false),
        isSuperAdmin,
        onboardingCompleted: profile?.onboarding_completed ?? true,
      },
      token: data.session.access_token,
      isNewUser,
      needsOnboarding,
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Completes Google OAuth onboarding. Auth-required. Creates the role-specific
 * profile row (brand_profiles or influencer_profiles) and flips
 * onboarding_completed to true.
 */
export const completeGoogleOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const userId = req.user.userId;
    const {
      role, companyName, industry, city, state, niches,
      platform, tier, gender, bio, pricing,
      phone, username, profileImageUrl,
      instagramHandle, youtubeHandle,
    } = req.body;

    if (role !== 'brand' && role !== 'influencer') {
      res.status(400).json({ message: 'Role must be brand or influencer' });
      return;
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role, name, onboarding_completed')
      .eq('id', userId)
      .single();
    if (!profile) { res.status(404).json({ message: 'Profile not found' }); return; }
    if (profile.onboarding_completed) {
      res.status(400).json({ message: 'Onboarding already completed' });
      return;
    }

    // Keep profiles.role authoritative — update if changed
    if (profile.role !== role) {
      await adminClient.from('profiles').update({ role }).eq('id', userId);
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { role, name: profile.name, is_admin: false },
      });
    }

    // Persist shared profile fields (phone, username, avatar) for both roles
    const profileUpdate: Record<string, unknown> = {};
    if (typeof phone === 'string' && phone.trim()) profileUpdate.phone = phone.trim();
    if (typeof username === 'string' && username.trim()) profileUpdate.username = username.trim().toLowerCase();
    if (typeof profileImageUrl === 'string' && profileImageUrl.trim()) profileUpdate.avatar_url = profileImageUrl.trim();
    if (Object.keys(profileUpdate).length > 0) {
      const { error: pe } = await adminClient.from('profiles').update(profileUpdate).eq('id', userId);
      if (pe && (pe as { code?: string }).code === '23505') {
        res.status(400).json({ message: 'Username already taken' });
        return;
      }
    }

    if (role === 'brand') {
      await adminClient.from('brand_profiles').upsert({
        id: userId,
        company_name: companyName || profile.name || '',
        industry: industry || '',
      });
    } else {
      const safeTier = VALID_TIERS.includes(tier) ? tier : 'micro';
      const safeGender = ALLOWED_GENDERS.includes(gender) ? gender : null;
      const influencerRow: Record<string, unknown> = {
        id: userId,
        bio: bio || '',
        city: city || '',
        niches: Array.isArray(niches) ? niches : [],
        platforms: Array.isArray(platform) ? platform : [],
        tier: safeTier,
        gender: safeGender,
      };
      if (typeof state === 'string' && state.trim()) influencerRow.state = state.trim();
      if (typeof instagramHandle === 'string') influencerRow.instagram_handle = instagramHandle.replace(/^@/, '').trim() || null;
      if (typeof youtubeHandle === 'string') influencerRow.youtube_handle = youtubeHandle.replace(/^@/, '').trim() || null;
      await adminClient.from('influencer_profiles').upsert(influencerRow);

      const p = pricing || {};
      // Only persist rows with positive prices — zero/empty entries are skipped
      // so the 6-month commercials lock kicks in only when the creator has
      // actually set their rates.
      const pricingRows = [
        { content_type: 'reel',   price: Number(p.reel  ?? p.reelRate) || 0 },
        { content_type: 'story',  price: Number(p.story ?? p.storyRate) || 0 },
        { content_type: 'video',  price: Number(p.video ?? p.longVideoRate) || 0 },
        { content_type: 'shorts', price: Number(p.shorts ?? p.post ?? p.shortsRate) || 0 },
      ].filter(r => r.price > 0);
      if (pricingRows.length > 0) {
        const { error: prErr } = await adminClient.from('influencer_pricing').upsert(
          pricingRows.map(r => ({ influencer_id: userId, platform: 'general', ...r })),
          { onConflict: 'influencer_id,platform,content_type' },
        );
        if (prErr) console.error('pricing upsert failed:', prErr);
      }
    }

    await adminClient
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);

    const { data: updated } = await adminClient
      .from('profiles')
      .select('id, email, name, role, is_super_admin, onboarding_completed')
      .eq('id', userId)
      .single();

    const isSuperAdmin = updated?.is_super_admin ?? false;
    res.json({
      message: 'Onboarding completed',
      user: {
        id: updated?.id,
        email: updated?.email,
        name: updated?.name,
        role: updated?.role,
        isAdmin: isSuperAdmin,
        isSuperAdmin,
        onboardingCompleted: true,
      },
    });
  } catch (err) {
    console.error('completeGoogleOnboarding error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
