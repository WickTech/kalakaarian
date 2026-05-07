import { Response, Request } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { PLATFORM_FEE_RATE } from '../utils/pricing';
import { createOrder, verifyWebhookSignature } from '../services/razorpayService';

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
    const { campaignId, campaignDescription } = req.body || {};

    if (campaignId && campaignDescription) {
      await adminClient.from('campaigns')
        .update({ description: campaignDescription })
        .eq('id', campaignId)
        .eq('brand_id', req.user.userId);
    }

    const { data } = await getCartItems(req.user.userId);
    const items = data ?? [];
    if (items.length === 0) { res.status(400).json({ message: 'Cart is empty' }); return; }

    const subtotalRupees = items.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
    const feeRupees = Math.round(subtotalRupees * PLATFORM_FEE_RATE);
    const totalPaise = Math.round((subtotalRupees + feeRupees) * 100);

    const order = await createOrder(totalPaise, `cart-${req.user.userId}-${Date.now()}`, {
      userId: req.user.userId,
      campaignId: campaignId || '',
    });
    if (!order) {
      res.json({ orderId: null, amount: totalPaise, currency: 'INR', keyId: null });
      return;
    }

    // Persist cart snapshot so the webhook can process it without re-querying the cart
    const snapshot = items.map((item: any) => ({
      influencer_id: item.influencer_id,
      price: item.price,
    }));
    await adminClient.from('cart_orders').insert({
      brand_id: req.user.userId,
      razorpay_order_id: order.id,
      amount_paise: totalPaise,
      campaign_id: campaignId || null,
      cart_snapshot: snapshot,
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Cart checkout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const handleCartWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['x-razorpay-signature'] as string | undefined;
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
  if (!sig || !verifyWebhookSignature(rawBody, sig)) {
    res.status(400).json({ message: 'Invalid signature' }); return;
  }

  let event: Record<string, unknown>;
  try { event = JSON.parse(rawBody); }
  catch { res.status(400).json({ message: 'Invalid JSON' }); return; }

  if (event.event !== 'payment.captured') {
    res.json({ received: true }); return;
  }

  const payment = (event as any).payload?.payment?.entity;
  const razorpayOrderId: string | undefined = payment?.order_id;
  const paymentId: string | undefined = payment?.id;
  if (!razorpayOrderId || !paymentId) { res.json({ received: true }); return; }

  const { data: cartOrder } = await adminClient
    .from('cart_orders').select('*')
    .eq('razorpay_order_id', razorpayOrderId).single();

  if (!cartOrder || cartOrder.status === 'paid') {
    res.json({ received: true }); return; // idempotent
  }

  const snapshot: Array<{ influencer_id: string; price: number }> = cartOrder.cart_snapshot ?? [];

  for (const item of snapshot) {
    await adminClient.from('transactions').insert({
      brand_id: cartOrder.brand_id,
      influencer_id: item.influencer_id,
      campaign_id: cartOrder.campaign_id,
      amount: item.price,
      status: 'completed',
      payment_method: 'razorpay',
      transaction_id: paymentId,
    });

    if (cartOrder.campaign_id) {
      const { data: proposal } = await adminClient.from('proposals')
        .select('id, workflow_stage')
        .eq('influencer_id', item.influencer_id)
        .eq('campaign_id', cartOrder.campaign_id)
        .in('workflow_stage', ['approved', 'payment_pending'])
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle();

      if (proposal) {
        const rpcBase = {
          p_proposal_id: proposal.id,
          p_actor_id: null as unknown as string,
          p_actor_role: 'system',
          p_details: { transaction_ref: paymentId, razorpay_order_id: razorpayOrderId } as Record<string, unknown>,
          p_auto_approve_hours: 72,
        };
        if (proposal.workflow_stage === 'approved') {
          await adminClient.rpc('transition_workflow_stage', {
            ...rpcBase, p_expected_stage: 'approved', p_to_stage: 'payment_pending', p_action: 'mark_payment_pending',
          });
        }
        await adminClient.rpc('transition_workflow_stage', {
          ...rpcBase, p_expected_stage: 'payment_pending', p_to_stage: 'payment_released', p_action: 'release_payment',
        });
      }
    }
  }

  await adminClient.from('cart_orders').update({
    status: 'paid', razorpay_payment_id: paymentId, updated_at: new Date().toISOString(),
  }).eq('id', cartOrder.id);

  const cartDelete = adminClient.from('cart_items').delete().eq('brand_id', cartOrder.brand_id);
  await (cartOrder.campaign_id ? cartDelete.eq('campaign_id', cartOrder.campaign_id) : cartDelete);

  res.json({ received: true });
};
