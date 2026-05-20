import * as repo from './oauthRepository';
import { updateUserMetadata } from './authRepository';
import type { AuthError, OnboardingInput } from './types';

// Business logic for the Google OAuth concern. No Express types here.

const ALLOWED_GENDERS = ['male', 'female', 'non_binary', 'prefer_not_to_say'];
const VALID_TIERS = ['nano', 'micro', 'macro', 'celeb'];

export type GoogleLoginResult =
  | AuthError
  | {
      kind: 'ok';
      user: Record<string, unknown>;
      token: string;
      isNewUser: boolean;
      needsOnboarding: boolean;
    };

// For new users this creates a stub `profiles` row with onboarding_completed
// =false. It does NOT create role-specific rows — the client must call
// completeOnboarding for that.
export async function googleLogin(
  idToken: string | undefined,
  requestedRole: string | undefined,
): Promise<GoogleLoginResult> {
  if (!idToken) return { kind: 'error', status: 400, message: 'Google ID token is required' };

  const { data, error } = await repo.signInWithIdToken(idToken);
  if (error || !data.session || !data.user) {
    return { kind: 'error', status: 400, message: error?.message ?? 'Google login failed' };
  }

  const userId = data.user.id;
  const existing = await repo.findProfileBasic(userId);
  const isNewUser = !existing;

  if (isNewUser) {
    const userRole = requestedRole === 'influencer' ? 'influencer' : 'brand';
    const googleEmail = data.user.email ?? '';
    const googleName =
      data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? '';
    await repo.insertStubProfile({
      id: userId, role: userRole, name: googleName, email: googleEmail,
      avatar_url: data.user.user_metadata?.avatar_url ?? null, onboarding_completed: false,
    });
    await updateUserMetadata(userId, { role: userRole, name: googleName, is_admin: false });
  }

  const profile = await repo.getGoogleProfile(userId);
  const isSuperAdmin = profile?.is_super_admin ?? false;
  if (isSuperAdmin !== (data.user.user_metadata?.is_super_admin ?? false)) {
    await updateUserMetadata(userId, { ...data.user.user_metadata, is_super_admin: isSuperAdmin });
  }

  return {
    kind: 'ok',
    user: {
      id: profile?.id, email: profile?.email, name: profile?.name, role: profile?.role,
      isAdmin: isSuperAdmin || (data.user.user_metadata?.is_admin ?? false),
      isSuperAdmin, onboardingCompleted: profile?.onboarding_completed ?? true,
    },
    token: data.session.access_token,
    isNewUser,
    needsOnboarding: profile?.onboarding_completed === false,
  };
}

export type OnboardingResult = AuthError | { kind: 'ok'; user: Record<string, unknown> };

// Creates the role-specific profile row (brand_profiles / influencer_profiles)
// and flips onboarding_completed to true.
export async function completeOnboarding(
  userId: string,
  input: OnboardingInput,
): Promise<OnboardingResult> {
  const { role } = input;
  if (role !== 'brand' && role !== 'influencer') {
    return { kind: 'error', status: 400, message: 'Role must be brand or influencer' };
  }

  const profile = await repo.getOnboardingProfile(userId);
  if (!profile) return { kind: 'error', status: 404, message: 'Profile not found' };
  if (profile.onboarding_completed) {
    return { kind: 'error', status: 400, message: 'Onboarding already completed' };
  }

  // Keep profiles.role authoritative — update if changed.
  if (profile.role !== role) {
    await repo.updateProfile(userId, { role });
    await updateUserMetadata(userId, { role, name: profile.name, is_admin: false });
  }

  // Persist shared profile fields (phone, username, avatar) for both roles.
  const profileUpdate: Record<string, unknown> = {};
  if (typeof input.phone === 'string' && input.phone.trim()) profileUpdate.phone = input.phone.trim();
  if (typeof input.username === 'string' && input.username.trim()) {
    profileUpdate.username = input.username.trim().toLowerCase();
  }
  if (typeof input.profileImageUrl === 'string' && input.profileImageUrl.trim()) {
    profileUpdate.avatar_url = input.profileImageUrl.trim();
  }
  if (Object.keys(profileUpdate).length > 0) {
    const { code } = await repo.updateProfile(userId, profileUpdate);
    if (code === '23505') return { kind: 'error', status: 400, message: 'Username already taken' };
  }

  if (role === 'brand') {
    await repo.upsertBrandProfile({
      id: userId, company_name: input.companyName || profile.name || '', industry: input.industry || '',
    });
  } else {
    const safeTier = VALID_TIERS.includes(input.tier ?? '') ? input.tier : 'micro';
    const safeGender = ALLOWED_GENDERS.includes(input.gender ?? '') ? input.gender : null;
    const influencerRow: Record<string, unknown> = {
      id: userId, bio: input.bio || '', city: input.city || '',
      niches: Array.isArray(input.niches) ? input.niches : [],
      platforms: Array.isArray(input.platform) ? input.platform : [],
      tier: safeTier, gender: safeGender,
    };
    if (typeof input.state === 'string' && input.state.trim()) influencerRow.state = input.state.trim();
    if (typeof input.instagramHandle === 'string') {
      influencerRow.instagram_handle = input.instagramHandle.replace(/^@/, '').trim() || null;
    }
    if (typeof input.youtubeHandle === 'string') {
      influencerRow.youtube_handle = input.youtubeHandle.replace(/^@/, '').trim() || null;
    }
    await repo.upsertInfluencerProfile(influencerRow);

    // Only persist rows with positive prices — zero/empty entries are skipped
    // so the 6-month commercials lock kicks in only once rates are actually set.
    const p = input.pricing || {};
    const pricingRows = [
      { content_type: 'reel', price: Number(p.reel ?? p.reelRate) || 0 },
      { content_type: 'story', price: Number(p.story ?? p.storyRate) || 0 },
      { content_type: 'video', price: Number(p.video ?? p.longVideoRate) || 0 },
      { content_type: 'shorts', price: Number(p.shorts ?? p.post ?? p.shortsRate) || 0 },
    ]
      .filter((r) => r.price > 0)
      .map((r) => ({ influencer_id: userId, platform: 'general', ...r }));
    if (pricingRows.length > 0) await repo.upsertPricing(pricingRows);
  }

  await repo.setOnboardingComplete(userId);

  const updated = await repo.getGoogleProfile(userId);
  const isSuperAdmin = updated?.is_super_admin ?? false;
  return {
    kind: 'ok',
    user: {
      id: updated?.id, email: updated?.email, name: updated?.name, role: updated?.role,
      isAdmin: isSuperAdmin, isSuperAdmin, onboardingCompleted: true,
    },
  };
}
