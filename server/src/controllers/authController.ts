import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import InfluencerProfile from '../models/InfluencerProfile';
import BrandProfile from '../models/BrandProfile';
import { generateToken } from '../utils/jwt';
import { sendLoginOTP } from './otpController';
import { sendWelcomeEmail } from '../services/emailService';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface GoogleUserInfo { id: string; email: string; name: string; picture?: string }

const getGoogleUserInfo = async (code: string): Promise<GoogleUserInfo> => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: GOOGLE_CLIENT_ID!, client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: GOOGLE_CALLBACK_URL!, grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json() as { access_token: string };
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  return userRes.json() as Promise<GoogleUserInfo>;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, phone, password, name, role, companyName, industry, city, niches, platform, tier, bio, socialHandles, profileImage, pricing } = req.body;

    if (!email && !phone && !username) {
      res.status(400).json({ message: 'Email, phone, or username is required' }); return;
    }
    if (!password || !name || !role) {
      res.status(400).json({ message: 'Password, name, and role are required' }); return;
    }
    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' }); return;
    }
    if (email && await User.findOne({ email })) {
      res.status(400).json({ message: 'User with this email already exists' }); return;
    }
    if (username && await User.findOne({ username })) {
      res.status(400).json({ message: 'Username already taken' }); return;
    }
    if (phone && await User.findOne({ phone: phone.replace(/\D/g, '') })) {
      res.status(400).json({ message: 'User with this phone already exists' }); return;
    }

    const user = await User.create({
      email, username,
      phone: phone ? phone.replace(/\D/g, '') : undefined,
      password: await bcrypt.hash(password, 10),
      name, role,
      phoneVerified: phone ? false : undefined,
    });

    if (role === 'brand') {
      await BrandProfile.create({ userId: user._id, companyName: companyName || name, industry: industry || '' });
    } else if (role === 'influencer') {
      // Normalise pricing: client may send reelRate/storyRate/longVideoRate/shortsRate
      // or the canonical reel/story/video/post — support both
      const p = pricing || {};
      const normalisedPricing = {
        reel:  p.reel  ?? p.reelRate       ?? undefined,
        story: p.story ?? p.storyRate      ?? undefined,
        video: p.video ?? p.longVideoRate  ?? undefined,
        post:  p.post  ?? p.shortsRate     ?? undefined,
      };
      await InfluencerProfile.create({
        userId: user._id, bio: bio || '', city: city || '',
        niches: niches || [], platform: platform || [], tier: tier || 'micro',
        socialHandles: socialHandles || {}, profileImage: profileImage || undefined,
        pricing: normalisedPricing,
      });
    }

    const token = generateToken(user._id.toString(), user.role);

    if (user.email) {
      sendWelcomeEmail(user.email, user.name, user.role).catch((e) =>
        console.error('Welcome email failed:', e)
      );
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: { _id: user._id, id: user._id, email: user.email, username: user.username, phone: user.phone, name: user.name, role: user.role },
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
      const user = await User.findOne({ phone: normalizedPhone });
      if (!user) { res.status(400).json({ message: 'User not found with this phone' }); return; }
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

    const user = email ? await User.findOne({ email }) : await User.findOne({ username });
    if (!user) { res.status(400).json({ message: 'Invalid credentials' }); return; }
    if (!user.password) { res.status(400).json({ message: 'Please login with Google or OTP' }); return; }

    if (!await bcrypt.compare(password, user.password)) {
      res.status(400).json({ message: 'Invalid credentials' }); return;
    }

    const token = generateToken(user._id.toString(), user.role);
    res.json({
      message: 'Login successful',
      user: { _id: user._id, id: user._id, email: user.email, username: user.username, name: user.name, role: user.role },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token: jwtToken, code, role, companyName, industry, city, genre, platform, tier } = req.body;

    let googleUser: GoogleUserInfo;

    if (jwtToken) {
      const ticket = await googleClient.verifyIdToken({ idToken: jwtToken, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload) { res.status(400).json({ message: 'Invalid Google token' }); return; }
      if (!payload.email_verified) { res.status(400).json({ message: 'Google email not verified' }); return; }
      googleUser = { id: payload.sub!, email: payload.email!, name: payload.name!, picture: payload.picture };
    } else if (code) {
      googleUser = await getGoogleUserInfo(code);
    } else {
      res.status(400).json({ message: 'Token or code is required' }); return;
    }

    let user = await User.findOne({ email: googleUser.email });
    if (user && !user.googleId) { user.googleId = googleUser.id; await user.save(); }

    if (!user) {
      user = await User.create({ email: googleUser.email, name: googleUser.name, googleId: googleUser.id, role: role || 'brand' });
      if (role === 'brand') {
        await BrandProfile.create({ userId: user._id, companyName: companyName || googleUser.name, industry: industry || '' });
      } else if (role === 'influencer') {
        // `genre` is accepted from old clients for backward compat but stored as `niches`
        await InfluencerProfile.create({ userId: user._id, bio: '', city: city || '', niches: genre || [], platform: platform || [], tier: tier || 'micro' });
      }
    }

    const token = generateToken(user._id.toString(), user.role);
    res.json({
      message: 'Google login successful',
      user: { _id: user._id, id: user._id, email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
