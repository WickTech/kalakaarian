import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './service';
import type { ListCampaignsQuery } from './types';

// Thin HTTP handlers: authorize, adapt the request, delegate to the service,
// and shape the response. No business logic or DB access here.

export const getCampaigns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (req.user.role !== 'brand') {
      res.status(403).json({ message: 'Brands only' });
      return;
    }
    const result = await service.listCampaigns(
      req.user.userId,
      req.query as unknown as ListCampaignsQuery,
    );
    res.json(result);
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
  try {
    const campaign = await service.getCampaign(req.params.id);
    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }
    res.json({ campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can create campaigns' });
      return;
    }
    const campaign = await service.createCampaign(req.user.userId, req.body);
    if (!campaign) {
      res.status(500).json({ message: 'Failed to create campaign' });
      return;
    }
    res.status(201).json({ campaign });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can update campaigns' });
      return;
    }
    const campaign = await service.updateCampaign(req.params.id, req.user.userId, req.body);
    if (!campaign) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }
    res.json({ campaign });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can delete campaigns' });
      return;
    }
    const ok = await service.deleteCampaign(req.params.id, req.user.userId);
    if (!ok) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCampaignInfluencers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const influencers = await service.getCampaignInfluencers(req.params.id, req.user.userId);
    res.json({ influencers });
  } catch (err) {
    console.error('getCampaignInfluencers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRecommendedCreators = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const creators = await service.recommendCreatorsForCampaign(req.params.id);
    if (!creators) {
      res.status(404).json({ message: 'Campaign not found' });
      return;
    }
    res.json({ creators });
  } catch (err) {
    console.error('getRecommendedCreators error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
