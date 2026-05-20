import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './service';
import type { InfluencerListQuery } from './types';

// Thin HTTP handlers: authorize, adapt the request, delegate to the service,
// and shape the response. No business logic or DB access here.

export const getTierCounts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tierCounts = await service.getTierCounts();
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(tierCounts);
  } catch (error) {
    console.error('Get tier counts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInfluencers = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await service.listInfluencers(req.query as unknown as InfluencerListQuery);
    res.set('Cache-Control', 'no-store');
    res.json(result);
  } catch (error) {
    console.error('Get influencers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchInfluencers = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await service.listInfluencers(req.query as unknown as InfluencerListQuery);
    res.json(result);
  } catch (error) {
    console.error('Search influencers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInfluencerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const viewerId = (req as AuthRequest).user?.userId;
    const influencer = await service.getInfluencerById(req.params.id, viewerId);
    if (!influencer) { res.status(404).json({ message: 'Influencer not found' }); return; }
    res.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=120');
    res.json({ influencer });
  } catch (error) {
    console.error('Get influencer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOwnProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can view their own profile' }); return;
    }
    const influencer = await service.getOwnProfile(req.user.userId);
    if (!influencer) { res.status(404).json({ message: 'Influencer profile not found' }); return; }
    res.json({ influencer });
  } catch (error) {
    console.error('Get own profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateInfluencerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can update their profile' }); return;
    }
    const result = await service.updateProfile(req.user.userId, req.body);
    if (result.kind === 'conflict') {
      res.status(400).json({ message: 'Username already taken' }); return;
    }
    if (result.kind === 'locked') {
      res.status(403).json({
        message: 'Commercials are locked for the first 6 months after registration',
        unlockAt: result.unlockAt,
      });
      return;
    }
    res.json({ profile: result.profile });
  } catch (error) {
    console.error('Update influencer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePresence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can update presence' }); return;
    }
    await service.updatePresence(req.user.userId, !!req.body.isOnline);
    res.json({ message: 'Presence updated' });
  } catch (error) {
    console.error('Update presence error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfileImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { imageUrl } = req.body;
    if (!imageUrl) { res.status(400).json({ message: 'imageUrl required' }); return; }
    await service.updateProfileImage(req.user.userId, imageUrl);
    res.json({ message: 'Profile image updated', imageUrl });
  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateGallery = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can update gallery' }); return;
    }
    const { imageUrls } = req.body as { imageUrls?: unknown };
    if (!Array.isArray(imageUrls) || !imageUrls.every((u) => typeof u === 'string')) {
      res.status(400).json({ message: 'imageUrls must be an array of strings' }); return;
    }
    if (imageUrls.length > 12) {
      res.status(400).json({ message: 'Maximum 12 gallery images' }); return;
    }
    await service.updateGallery(req.user.userId, imageUrls);
    res.json({ message: 'Gallery updated', galleryImages: imageUrls });
  } catch (error) {
    console.error('Update gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const connectSocial = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'influencer') {
      res.status(403).json({ message: 'Only influencers can connect social accounts' }); return;
    }
    const { platform, handle } = req.body;
    if (!platform || !handle) { res.status(400).json({ message: 'Platform and handle required' }); return; }
    const { error } = await service.connectSocial(req.user.userId, platform, handle);
    if (error) { res.status(400).json({ message: error }); return; }
    res.json({ message: `${platform} connected` });
  } catch (error) {
    console.error('Connect social error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
