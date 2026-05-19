import { Request, Response } from 'express';
import { adminClient, createAuthClient } from '../config/supabase';
import { sendLoginOTP } from './otpController';
import { sendWelcomeEmail } from '../services/emailService';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email, username, phone, password, name, role,
      companyName, industry, city, state, niches, platform, tier, bio, pricing,
      gender, termsAccepted, socialHandles, profileImage,
    } = req.body;

    if (!email && !phone) {
      res.status(400).json({ message: 'Email or phone is required' }); return;
    }
    if (!password || !name || !role) {
      res.status(400).json({ message: 'Password, name, and role are required' }); return;
    }
    if (!termsAccepted) {
      res.status(400).json({ message: 'You must accept the Terms & Conditions to register' }); return;
    }
    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' }); return;
    }

    const normalizedPhone = phone ? phone.replace(/\D/g, '') : undefined;

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email || undefined,
      phone: normalizedPhone,
      password,
      email_confirm: true,
      phone_confirm: !!normalizedPhone,
      user_metadata: { role, name, is_admin: false },
    });

    if (authError || !authData.user) {
      const msg = authError?.message ?? 'Registration failed';
      res.status(400).json({ message: msg }); return;
    }

    const userId = authData.user.id;

    const normalizedUsername = typeof username === 'string' && username.trim()
      ? username.trim().toLowerCase()
      : null;
    const avatarUrlForProfile = typeof profileImage === 'string' && profileImage.trim() && !profileImage.startsWith('data:')
      ? profileImage.trim()
      : null;

    const rollback = async (stage: string, err: unknown) => {
      console.error(`Register insert failed at ${stage}:`, err);
      await adminClient.auth.admin.deleteUser(userId).catch(e => console.error('Rollback deleteUser failed:', e));
    };

    const { error: profileErr } = await adminClient.from('profiles').insert({
      id: userId,
      role,
      name,
      email: email || null,
      phone: normalizedPhone || null,
      username: normalizedUsername,
      avatar_url: avatarUrlForProfile,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      onboarding_completed: true,
    });
    if (profileErr) {
      await rollback('profiles', profileErr);
      const code = (profileErr as { code?: string }).code;
      const msg = code === '23505' ? 'Username or email already taken' : 'Failed to create profile';
      res.status(400).json({ message: msg }); return;
    }

    if (role === 'brand') {
      const { error: bErr } = await adminClient.from('brand_profiles').insert({
        id: userId,
        company_name: companyName || name,
        industry: industry || '',
      });
      if (bErr) {
        await rollback('brand_profiles', bErr);
        res.status(400).json({ message: 'Failed to create brand profile' }); return;
      }
    } else if (role === 'influencer') {
      const ALLOWED_GENDERS = ['male', 'female', 'non_binary', 'prefer_not_to_say'];
      const igHandle = typeof socialHandles?.instagram === 'string' ? socialHandles.instagram.trim() : '';
      const ytHandle = typeof socialHandles?.youtube === 'string' ? socialHandles.youtube.trim() : '';
      const { error: iErr } = await adminClient.from('influencer_profiles').insert({
        id: userId,
        bio: bio || '',
        city: city || '',
        state: state || '',
        niches: niches || [],
        platforms: platform || [],
        tier: tier || 'micro',
        gender: ALLOWED_GENDERS.includes(gender) ? gender : null,
        instagram_handle: igHandle || null,
        youtube_handle: ytHandle || null,
      });
      if (iErr) {
        await rollback('influencer_profiles', iErr);
        res.status(400).json({ message: 'Failed to create influencer profile' }); return;
      }

      const p = pricing || {};
      const pricingRows = [
        { content_type: 'reel',   price: p.reel   ?? p.reelRate },
        { content_type: 'story',  price: p.story  ?? p.storyRate },
        { content_type: 'video',  price: p.video  ?? p.longVideoRate },
        { content_type: 'shorts', price: p.shorts ?? p.shortsRate },
      ].filter(r => r.price != null && Number(r.price) > 0)
       .map(r => ({ ...r, price: Number(r.price) }));

      if (pricingRows.length > 0) {
        const { error: pErr } = await adminClient.from('influencer_pricing').insert(
          pricingRows.map(r => ({ influencer_id: userId, platform: 'general', ...r }))
        );
        if (pErr) console.error('Pricing insert failed (non-fatal):', pErr);
      }
    }

    let token = '';
    if (email) {
      // Ephemeral client — keeps adminClient session clean across warm lambdas.
      const { data: signIn } = await createAuthClient().auth.signInWithPassword({ email, password });
      token = signIn?.session?.access_token ?? '';
    }

    if (email) {
      sendWelcomeEmail(email, name, role).catch((e) => console.error('Welcome email failed:', e));
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: userId, email: email || null, username: username || null, phone: normalizedPhone || null, name, role },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password, phone, isPhoneLogin } = req.body;

    if (isPhoneLogin && phone) {
      const normalizedPhone = phone.replace(/\D/g, '');
      const { data: profileRow } = await adminClient
        .from('profiles')
        .select('id')
        .eq('phone', normalizedPhone)
        .single();
      if (!profileRow) { res.status(400).json({ message: 'User not found with this phone' }); return; }
      await sendLoginOTP(normalizedPhone);
      res.json({
        message: 'OTP sent for login',
        phone: normalizedPhone.slice(-4).padStart(normalizedPhone.length, '*'),
        isNewUser: false,
      });
      return;
    }

    if (!email && !username) { res.status(400).json({ message: 'Email or username is required' }); return; }
    if (!password) { res.status(400).json({ message: 'Password is required' }); return; }

    let loginEmail = email;
    if (!loginEmail && username) {
      const { data: row } = await adminClient.from('profiles').select('email').eq('username', username).single();
      if (!row?.email) { res.status(400).json({ message: 'Invalid credentials' }); return; }
      loginEmail = row.email;
    }

    const { data, error } = await createAuthClient().auth.signInWithPassword({ email: loginEmail, password });
    if (error || !data.session) {
      res.status(400).json({ message: 'Invalid credentials' }); return;
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, email, username, name, role, is_super_admin')
      .eq('id', data.user.id)
      .single();

    const isSuperAdmin = profile?.is_super_admin ?? false;
    // Sync is_super_admin into user_metadata so JWT reflects it on subsequent requests
    if (isSuperAdmin !== (data.user.user_metadata?.is_super_admin ?? false)) {
      await adminClient.auth.admin.updateUserById(data.user.id, {
        user_metadata: { ...data.user.user_metadata, is_super_admin: isSuperAdmin },
      });
    }

    res.json({
      message: 'Login successful',
      user: {
        ...profile,
        isAdmin: isSuperAdmin || (data.user.user_metadata?.is_admin ?? false),
        isSuperAdmin,
      },
      token: data.session.access_token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

