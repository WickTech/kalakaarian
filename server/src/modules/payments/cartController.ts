import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './cartService';

// Thin HTTP handlers for the cart / checkout / webhook concern.

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    res.json({ cart: await service.getCart(req.user.userId) });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const result = await service.addToCart(req.user.userId, req.body);
    if (result.kind === 'conflict') {
      res.status(400).json({ message: 'Influencer already in cart' });
      return;
    }
    res.json({ cart: result.cart });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const cart = await service.removeFromCart(req.user.userId, req.params.influencerId);
    res.json({ cart });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    await service.clearCart(req.user.userId);
    res.json({ message: 'Cart cleared successfully', cart: { items: [], totalAmount: 0 } });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const cart = await service.updateCartItem(req.user.userId, req.params.influencerId, req.body);
    res.json({ cart });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const checkout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const result = await service.checkout(req.user.userId, req.body || {});
    if (result.kind === 'empty') {
      res.status(400).json({ message: 'Cart is empty' });
      return;
    }
    if (result.kind === 'free') {
      res.json({ orderId: null, amount: result.amount, currency: 'INR', keyId: null });
      return;
    }
    res.json({
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      keyId: result.keyId,
    });
  } catch (error) {
    console.error('Cart checkout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const handleCartWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  const eventId = req.headers['x-razorpay-event-id'] as string | undefined;
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
  const result = await service.handleWebhook(rawBody, signature, eventId);
  if (result.kind === 'bad') {
    res.status(result.status).json({ message: result.message });
    return;
  }
  res.json({ received: true });
};
