import * as repo from './authRepository';
import { sendLoginOTP } from './otpService';
import { bus } from '../../events/bus';
import type { RegisterInput, LoginInput, AuthError } from './types';

// Business logic for the register/login concern. No Express types here.

const ALLOWED_GENDERS = ['male', 'female', 'non_binary', 'prefer_not_to_say'];

export type RegisterResult =
  | AuthError
  | {
      kind: 'ok';
      user: { id: string; email: string | null; username: string | null; phone: string | null; name: string; role: string };
      token: string;
    };

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const { email, username, phone, password, name, role } = input;

  if (!email && !phone) return { kind: 'error', status: 400, message: 'Email or phone is required' };
  if (!password || !name || !role) {
    return { kind: 'error', status: 400, message: 'Password, name, and role are required' };
  }
  if (!input.termsAccepted) {
    return { kind: 'error', status: 400, message: 'You must accept the Terms & Conditions to register' };
  }
  if (password.length < 8) {
    return { kind: 'error', status: 400, message: 'Password must be at least 8 characters' };
  }

  const normalizedPhone = phone ? phone.replace(/\D/g, '') : undefined;

  const { data: authData, error: authError } = await repo.createAuthUser({
    email, phone: normalizedPhone, password,
    userMetadata: { role, name, is_admin: false },
  });
  if (authError || !authData.user) {
    return { kind: 'error', status: 400, message: authError?.message ?? 'Registration failed' };
  }
  const userId = authData.user.id;

  const normalizedUsername =
    typeof username === 'string' && username.trim() ? username.trim().toLowerCase() : null;
  const avatarUrlForProfile =
    typeof input.profileImage === 'string' && input.profileImage.trim() && !input.profileImage.startsWith('data:')
      ? input.profileImage.trim()
      : null;

  const rollback = async (stage: string, err: unknown) => {
    console.error(`Register insert failed at ${stage}:`, err);
    await repo.deleteAuthUser(userId);
  };

  const profileRes = await repo.insertProfile({
    id: userId, role, name, email: email || null, phone: normalizedPhone || null,
    username: normalizedUsername, avatar_url: avatarUrlForProfile,
    terms_accepted: true, terms_accepted_at: new Date().toISOString(), onboarding_completed: true,
  });
  if (!profileRes.ok) {
    await rollback('profiles', profileRes.code);
    const msg = profileRes.code === '23505' ? 'Username or email already taken' : 'Failed to create profile';
    return { kind: 'error', status: 400, message: msg };
  }

  if (role === 'brand') {
    const ok = await repo.insertBrandProfile({
      id: userId, company_name: input.companyName || name, industry: input.industry || '',
      website: typeof input.website === 'string' && input.website.trim() ? input.website.trim() : null,
    });
    if (!ok) {
      await rollback('brand_profiles', 'insert failed');
      return { kind: 'error', status: 400, message: 'Failed to create brand profile' };
    }
  } else if (role === 'influencer') {
    const igHandle = typeof input.socialHandles?.instagram === 'string' ? input.socialHandles.instagram.trim() : '';
    const ytHandle = typeof input.socialHandles?.youtube === 'string' ? input.socialHandles.youtube.trim() : '';
    const ok = await repo.insertInfluencerProfile({
      id: userId, bio: input.bio || '', city: input.city || '', state: input.state || '',
      niches: input.niches || [], platforms: input.platform || [], tier: input.tier || 'micro',
      gender: ALLOWED_GENDERS.includes(input.gender ?? '') ? input.gender : null,
      instagram_handle: igHandle || null, youtube_handle: ytHandle || null,
    });
    if (!ok) {
      await rollback('influencer_profiles', 'insert failed');
      return { kind: 'error', status: 400, message: 'Failed to create influencer profile' };
    }

    const p = input.pricing || {};
    const pricingRows = [
      { content_type: 'reel', price: p.reel ?? p.reelRate },
      { content_type: 'story', price: p.story ?? p.storyRate },
      { content_type: 'video', price: p.video ?? p.longVideoRate },
      { content_type: 'shorts', price: p.shorts ?? p.shortsRate },
    ]
      .filter((r) => r.price != null && Number(r.price) > 0)
      .map((r) => ({ influencer_id: userId, platform: 'general', content_type: r.content_type, price: Number(r.price) }));
    if (pricingRows.length > 0) await repo.insertPricing(pricingRows);
  }

  let token = '';
  if (email) {
    const { data: signIn } = await repo.signInWithPassword(email, password);
    token = signIn?.session?.access_token ?? '';
  }

  // Domain event — a listener enqueues the welcome-email job (events/listeners.ts).
  bus.emit('user.registered', { userId, email: email || null, name, role });

  return {
    kind: 'ok',
    user: { id: userId, email: email || null, username: username || null, phone: normalizedPhone || null, name, role },
    token,
  };
}

export type LoginResult =
  | AuthError
  | { kind: 'otp'; phone: string }
  | { kind: 'ok'; user: Record<string, unknown>; token: string };

export async function login(input: LoginInput): Promise<LoginResult> {
  const { email, username, password, phone, isPhoneLogin } = input;

  if (isPhoneLogin && phone) {
    const normalizedPhone = phone.replace(/\D/g, '');
    const profileRow = await repo.findProfileIdByPhone(normalizedPhone);
    if (!profileRow) {
      return { kind: 'error', status: 400, message: 'User not found with this phone' };
    }
    await sendLoginOTP(normalizedPhone);
    return { kind: 'otp', phone: normalizedPhone.slice(-4).padStart(normalizedPhone.length, '*') };
  }

  if (!email && !username) {
    return { kind: 'error', status: 400, message: 'Email or username is required' };
  }
  if (!password) return { kind: 'error', status: 400, message: 'Password is required' };

  let loginEmail = email;
  if (!loginEmail && username) {
    const row = await repo.findEmailByUsername(username);
    if (!row?.email) return { kind: 'error', status: 400, message: 'Invalid credentials' };
    loginEmail = row.email;
  }

  const { data, error } = await repo.signInWithPassword(loginEmail as string, password);
  if (error || !data.session || !data.user) {
    return { kind: 'error', status: 400, message: 'Invalid credentials' };
  }

  const profile = await repo.getLoginProfile(data.user.id);
  const isSuperAdmin = profile?.is_super_admin ?? false;
  // Sync is_super_admin into user_metadata so the JWT reflects it next request.
  if (isSuperAdmin !== (data.user.user_metadata?.is_super_admin ?? false)) {
    await repo.updateUserMetadata(data.user.id, {
      ...data.user.user_metadata, is_super_admin: isSuperAdmin,
    });
  }

  return {
    kind: 'ok',
    user: { ...profile, isAdmin: isSuperAdmin || (data.user.user_metadata?.is_admin ?? false), isSuperAdmin },
    token: data.session.access_token,
  };
}
