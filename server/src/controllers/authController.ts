import { Request, Response } from 'express';
import { adminClient } from '../config/supabase';
import { sendLoginOTP } from './otpController';
import { sendWelcomeEmail } from '../services/emailService';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email, username, phone, password, name, role,
      companyName, industry, city, niches, platform, tier, bio, pricing,
    } = req.body;

    if (!email && !phone) {
      res.status(400).json({ message: 'Email or phone is required' }); return;
    }
    if (!password || !name || !role) {
      res.status(400).json({ message: 'Password, name, and role are required' }); return;
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

    await adminClient.from('profiles').insert({
      id: userId,
      role,
      name,
      email: email || null,
      phone: normalizedPhone || null,
      username: username || null,
    });

    if (role === 'brand') {
      await adminClient.from('brand_profiles').insert({
        id: userId,
        company_name: companyName || name,
        industry: industry || '',
      });
    } else if (role === 'influencer') {
      await adminClient.from('influencer_profiles').insert({
        id: userId,
        bio: bio || '',
        city: city || '',
        niches: niches || [],
        platforms: platform || [],
        tier: tier || 'micro',
      });

      const p = pricing || {};
      const pricingRows = [
        { content_type: 'reel',  price: p.reel  ?? p.reelRate },
        { content_type: 'story', price: p.story ?? p.storyRate },
        { content_type: 'video', price: p.video ?? p.longVideoRate },
        { content_type: 'post',  price: p.post  ?? p.shortsRate },
      ].filter(r => r.price != null);

      if (pricingRows.length > 0) {
        await adminClient.from('influencer_pricing').insert(
          pricingRows.map(r => ({ influencer_id: userId, platform: 'general', ...r }))
        );
      }
    }

    let token = '';
    if (email) {
      const { data: signIn } = await adminClient.auth.signInWithPassword({ email, password });
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

    const { data, error } = await adminClient.auth.signInWithPassword({ email: loginEmail, password });
    if (error || !data.session) {
      res.status(400).json({ message: 'Invalid credentials' }); return;
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, email, username, name, role')
      .eq('id', data.user.id)
      .single();

    res.json({
      message: 'Login successful',
      user: { ...profile, isAdmin: data.user.user_metadata?.is_admin ?? false },
      token: data.session.access_token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token: idToken, role, companyName, industry, city, genre, platform, tier } = req.body;
    if (!idToken) { res.status(400).json({ message: 'Google ID token is required' }); return; }

    const { data, error } = await adminClient.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error || !data.session || !data.user) {
      res.status(400).json({ message: error?.message ?? 'Google login failed' }); return;
    }

    const userId = data.user.id;

    // Create profile rows if first login
    const { data: existing } = await adminClient.from('profiles').select('id').eq('id', userId).single();
    if (!existing) {
      const userRole = role || 'brand';
      const googleEmail = data.user.email ?? '';
      const googleName = data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? '';

      await adminClient.from('profiles').insert({
        id: userId,
        role: userRole,
        name: googleName,
        email: googleEmail,
        avatar_url: data.user.user_metadata?.avatar_url ?? null,
      });
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { role: userRole, name: googleName, is_admin: false },
      });

      if (userRole === 'brand') {
        await adminClient.from('brand_profiles').insert({
          id: userId,
          company_name: companyName || googleName,
          industry: industry || '',
        });
      } else {
        await adminClient.from('influencer_profiles').insert({
          id: userId,
          bio: '',
          city: city || '',
          niches: genre || [],
          platforms: platform || [],
          tier: tier || 'micro',
        });
      }
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', userId)
      .single();

    res.json({
      message: 'Google login successful',
      user: { ...profile, isAdmin: data.user.user_metadata?.is_admin ?? false },
      token: data.session.access_token,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
