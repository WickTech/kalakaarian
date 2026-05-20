import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './oauthService';

// Thin HTTP handlers for the Google OAuth concern.

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, role } = req.body;
    const result = await service.googleLogin(token, role);
    if (result.kind === 'error') {
      res.status(result.status).json({ message: result.message });
      return;
    }
    res.json({
      message: 'Google login successful',
      user: result.user,
      token: result.token,
      isNewUser: result.isNewUser,
      needsOnboarding: result.needsOnboarding,
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const completeGoogleOnboarding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const result = await service.completeOnboarding(req.user.userId, req.body);
    if (result.kind === 'error') {
      res.status(result.status).json({ message: result.message });
      return;
    }
    res.json({ message: 'Onboarding completed', user: result.user });
  } catch (err) {
    console.error('completeGoogleOnboarding error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
