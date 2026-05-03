import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { PLATFORM_FEE_RATE } from '../utils/pricing';
import { createOrder } from '../services/razorpayService';

const CART_SELECT = '*, influencer_profiles!cart_items_influencer_id_fkey(id, profiles!influencer_profiles_id_fkey(name, email)), campaigns!cart_items_campaign_id_fkey(id, title)';

const getCartItems = async (brandId: string) =>
  adminClient.from('cart_items').select(CART_SELECT).eq('brand_id', brandId).order('added_at', { ascending: false });

const toCartResponse = (items: any[]) => ({
  items,
  totalAmount: items.reduce((sum: number, item: any) => sum + (item.price || 0), 0),
});

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { data } = await getCartItems(req.user.userId);
    res.json({ cart: toCartResponse(data ?? []) });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { influencerId, campaignId, price } = req.body;

    const { error } = await adminClient.from('cart_items').insert({
      brand_id: req.user.userId,
      influencer_id: influencerId,
      campaign_id: campaignId || null,
      price: price || 0,
      added_at: new Date().toISOString(),
    });
    if (error) {
      if (error.code === '23505') { res.status(400).json({ message: 'Influencer already in cart' }); return; }
      throw error;
    }

    const { data } = await getCartItems(req.user.userId);
    res.json({ cart: toCartResponse(data ?? []) });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    await adminClient.from('cart_items')
      .delete()
      .eq('brand_id', req.user.userId)
      .eq('influencer_id', req.params.influencerId);
    const { data } = await getCartItems(req.user.userId);
    res.json({ cart: toCartResponse(data ?? []) });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    await adminClient.from('cart_items').delete().eq('brand_id', req.user.userId);
    res.json({ message: 'Cart cleared successfully', cart: { items: [], totalAmount: 0 } });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { influencerId } = req.params;
    const { campaignId, price } = req.body;
    const update: Record<string, unknown> = {};
    if (campaignId !== undefined) update.campaign_id = campaignId;
    if (price !== undefined) update.price = price;

    await adminClient.from('cart_items')
      .update(update)
      .eq('brand_id', req.user.userId)
      .eq('influencer_id', influencerId);
    const { data } = await getCartItems(req.user.userId);
    res.json({ cart: toCartResponse(data ?? []) });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const checkout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { data } = await getCartItems(req.user.userId);
    const items = data ?? [];
    if (items.length === 0) { res.status(400).json({ message: 'Cart is empty' }); return; }

    const subtotalRupees = items.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
    const feeRupees = Math.round(subtotalRupees * PLATFORM_FEE_RATE);
    const totalPaise = Math.round((subtotalRupees + feeRupees) * 100);

    const order = await createOrder(totalPaise, `cart-${req.user.userId}-${Date.now()}`, { userId: req.user.userId });
    if (!order) {
      res.json({ orderId: null, amount: totalPaise, currency: 'INR', keyId: null });
      return;
    }
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Cart checkout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
