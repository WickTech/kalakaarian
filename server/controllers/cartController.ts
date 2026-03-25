import { Response } from 'express';
import Cart from '../models/Cart';
import { AuthRequest } from '../middleware/auth';

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: Get user's cart
  // 1. Get userId from auth middleware
  // 2. Find or create cart for user
  // 3. Populate influencer details
  // 4. Return cart with items and total
  res.status(501).json({ message: 'Not implemented' });
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: Add influencer to cart
  // 1. Get userId from auth middleware
  // 2. Validate request body (influencerId, campaignId?, price)
  // 3. Find or create cart
  // 4. Check if influencer already in cart
  // 5. Add item and recalculate total
  // 6. Return updated cart
  res.status(501).json({ message: 'Not implemented' });
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: Remove influencer from cart
  // 1. Get userId from auth middleware
  // 2. Get influencerId from params
  // 3. Find user's cart
  // 4. Remove item and recalculate total
  // 5. Return updated cart
  res.status(501).json({ message: 'Not implemented' });
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: Clear all items from cart
  // 1. Get userId from auth middleware
  // 2. Find user's cart
  // 3. Clear items and reset total
  // 4. Return empty cart
  res.status(501).json({ message: 'Not implemented' });
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  // TODO: Update cart item (e.g., change associated campaign)
  // 1. Get userId from auth middleware
  // 2. Get influencerId from params
  // 3. Find user's cart
  // 4. Update item fields
  // 5. Recalculate total
  // 6. Return updated cart
  res.status(501).json({ message: 'Not implemented' });
};
