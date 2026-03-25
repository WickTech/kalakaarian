import { Request, Response } from 'express';
import Campaign from '../models/Campaign';
import Proposal from '../models/Proposal';
import { AuthRequest } from '../middleware/auth';

export const getCampaigns = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: List campaigns (brand sees own, influencer sees applicable)
  // 1. Get userId from auth middleware
  // 2. If brand: return own campaigns
  // 3. If influencer: return open campaigns matching profile
  // 4. Support filters and pagination
  res.status(501).json({ message: 'Not implemented' });
};

export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
  // TODO: Get single campaign by ID
  // 1. Get campaignId from params
  // 2. Find campaign with brand details
  // 3. Return campaign data
  res.status(501).json({ message: 'Not implemented' });
};

export const createCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: Create new campaign (brand only)
  // 1. Get userId from auth middleware
  // 2. Verify user is brand
  // 3. Validate request body
  // 4. Create campaign
  // 5. Return created campaign
  res.status(501).json({ message: 'Not implemented' });
};

export const updateCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: Update campaign (brand only, own campaigns)
  // 1. Get campaignId from params and userId from auth
  // 2. Verify ownership
  // 3. Update campaign fields
  // 4. Return updated campaign
  res.status(501).json({ message: 'Not implemented' });
};

export const deleteCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: Delete campaign (brand only, own campaigns)
  // 1. Get campaignId from params and userId from auth
  // 2. Verify ownership
  // 3. Delete campaign and associated proposals
  // 4. Return success
  res.status(501).json({ message: 'Not implemented' });
};

export const submitProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: Submit proposal to campaign (influencer only)
  // 1. Get campaignId from params and userId from auth
  // 2. Verify user is influencer
  // 3. Verify campaign exists and is open
  // 4. Check for existing proposal
  // 5. Create proposal
  // 6. Return created proposal
  res.status(501).json({ message: 'Not implemented' });
};

export const getProposals = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: Get proposals for campaign (brand) or influencer's proposals
  // 1. Get userId from auth middleware
  // 2. Get campaignId from query if brand
  // 3. Return appropriate proposals
  res.status(501).json({ message: 'Not implemented' });
};

export const updateProposalStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: Accept/reject proposal (brand only)
  // 1. Get proposalId from params and userId from auth
  // 2. Verify ownership of campaign
  // 3. Update proposal status
  // 4. If accepted, update campaign status
  // 5. Return updated proposal
  res.status(501).json({ message: 'Not implemented' });
};
