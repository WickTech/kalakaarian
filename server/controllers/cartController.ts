import { Response } from 'express';
import { Cart } from '../models/Cart';
import { InfluencerProfile } from '../models/InfluencerProfile';
import { AuthRequest } from '../middleware/auth';

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let cart = await Cart.findOne({ userId }).populate({
      path: 'items.influencerId',
      populate: { path: 'userId', select: 'name avatar' }
    });

    if (!cart) {
      cart = await Cart.create({ userId, items: [], total: 0 });
    }

    res.json({ cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { influencerId } = req.body;

    if (!influencerId) {
      res.status(400).json({ message: 'Influencer ID is required' });
      return;
    }

    const influencer = await InfluencerProfile.findById(influencerId);
    if (!influencer) {
      res.status(404).json({ message: 'Influencer not found' });
      return;
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [], total: 0 });
    }

    const existingItem = cart.items.find(
      item => item.influencerId.toString() === influencerId
    );

    if (existingItem) {
      res.status(400).json({ message: 'Influencer already in cart' });
      return;
    }

    cart.items.push({ influencerId: influencerId as unknown as typeof influencerId & { _id: unknown }, addedAt: new Date() });
    
    if (influencer.price) {
      cart.total = (cart.total || 0) + influencer.price;
    }

    await cart.save();
    await cart.populate({
      path: 'items.influencerId',
      populate: { path: 'userId', select: 'name avatar' }
    });

    res.json({ cart });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { influencerId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    const itemIndex = cart.items.findIndex(
      item => item.influencerId.toString() === influencerId
    );

    if (itemIndex === -1) {
      res.status(404).json({ message: 'Item not found in cart' });
      return;
    }

    const removedItem = cart.items[itemIndex];
    const influencer = await InfluencerProfile.findById(removedItem.influencerId);
    
    if (influencer?.price) {
      cart.total = (cart.total || 0) - influencer.price;
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    res.json({ cart });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await Cart.findOneAndUpdate(
      { userId },
      { items: [], total: 0 },
      { new: true }
    );

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { influencerId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    const itemIndex = cart.items.findIndex(
      item => item.influencerId.toString() === influencerId
    );

    if (itemIndex === -1) {
      res.status(404).json({ message: 'Item not found in cart' });
      return;
    }

    await cart.save();

    res.json({ cart });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
