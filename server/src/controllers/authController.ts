import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import InfluencerProfile from '../models/InfluencerProfile';
import BrandProfile from '../models/BrandProfile';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

interface GoogleTokens {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

const getGoogleUserInfo = async (code: string): Promise<GoogleUserInfo> => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: GOOGLE_CALLBACK_URL!,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenResponse.json() as GoogleTokens;

  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  return userResponse.json() as Promise<GoogleUserInfo>;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role, companyName, industry, city, genre, platform, tier } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
    });

    if (role === 'brand') {
      await BrandProfile.create({
        userId: user._id,
        companyName: companyName || name,
        industry: industry || '',
      });
    } else if (role === 'influencer') {
      await InfluencerProfile.create({
        userId: user._id,
        city: city || '',
        genre: genre || [],
        platform: platform || [],
        tier: tier || 'micro',
      });
    }

    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    if (!user.password) {
      res.status(400).json({ message: 'Please login with Google' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
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

    // Handle JWT credential from Google OAuth (frontend uses this)
    if (jwtToken) {
      // Decode JWT to get user info (no verification needed for basic info)
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
      
      googleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    } else if (code) {
      // Handle OAuth authorization code
      googleUser = await getGoogleUserInfo(code);
    } else {
      res.status(400).json({ message: 'Token or code is required' });
      return;
    }

    let user = await User.findOne({ email: googleUser.email });

    if (user && !user.googleId) {
      user.googleId = googleUser.id;
      await user.save();
    }

    if (!user) {
      if (!role) {
        res.status(400).json({ message: 'Role is required for new users' });
        return;
      }

      user = await User.create({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.id,
        role,
      });

      if (role === 'brand') {
        await BrandProfile.create({
          userId: user._id,
          companyName: companyName || googleUser.name,
          industry: industry || '',
        });
      } else if (role === 'influencer') {
        await InfluencerProfile.create({
          userId: user._id,
          city: city || '',
          genre: genre || [],
          platform: platform || [],
          tier: tier || 'micro',
        });
      }
    }

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      message: 'Google login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let profile = null;
    if (user.role === 'brand') {
      profile = await BrandProfile.findOne({ userId: user._id });
    } else if (user.role === 'influencer') {
      profile = await InfluencerProfile.findOne({ userId: user._id });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { name, companyName, industry, bio, city, genre, platform, tier, followers, pricing, portfolio } = req.body;

    if (name) user.name = name;
    await user.save();

    if (user.role === 'brand') {
      const updateData: any = {};
      if (companyName) updateData.companyName = companyName;
      if (industry) updateData.industry = industry;
      if (req.body.website) updateData.website = req.body.website;
      if (req.body.logo) updateData.logo = req.body.logo;
      if (req.body.description) updateData.description = req.body.description;

      await BrandProfile.findOneAndUpdate({ userId: user._id }, updateData, { new: true });
    } else if (user.role === 'influencer') {
      const updateData: any = {};
      if (bio !== undefined) updateData.bio = bio;
      if (city) updateData.city = city;
      if (genre) updateData.genre = genre;
      if (platform) updateData.platform = platform;
      if (tier) updateData.tier = tier;
      if (followers) updateData.followers = followers;
      if (pricing) updateData.pricing = pricing;
      if (portfolio) updateData.portfolio = portfolio;

      await InfluencerProfile.findOneAndUpdate({ userId: user._id }, updateData, { new: true });
    }

    const updatedUser = await User.findById(user._id).select('-password');
    let profile = null;
    if (user.role === 'brand') {
      profile = await BrandProfile.findOne({ userId: user._id });
    } else if (user.role === 'influencer') {
      profile = await InfluencerProfile.findOne({ userId: user._id });
    }

    res.json({
      user: updatedUser,
      profile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
