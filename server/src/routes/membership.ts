import { Router, Response, Request } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';
import { sendMembershipInvoice } from '../services/emailService';
import {
  createOrder,
  verifySignature,
  verifyWebhookSignature,
  TIER_PRICES_PAISE,
} from '../services/razorpayService';

const router = Router();

router.post('/order', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { tier } = req.body;
    const userId = req.user?.userId;
    if (!userId || !tier || !TIER_PRICES_PAISE[tier]) { res.status(400).json({ message: 'Invalid tier' }); return; }
    const order = await createOrder(TIER_PRICES_PAISE[tier], `membership-${userId}-${tier}`, { userId, tier });
    if (!order) { res.json({ orderId: null, amount: 0, currency: 'INR', keyId: null }); return; }
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch { res.status(500).json({ message: 'Error creating order' }); }
});

const activateMembership = async (userId: string, tier: string, paymentId: string) => {
  const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: membership } = await adminClient.from('memberships').insert({
    user_id: userId,
    tier,
    status: 'active',
    starts_at: new Date().toISOString(),
    ends_at: endsAt,
    auto_renew: true,
    payment_id: paymentId,
  }).select().single();

  const { data: profile } = await adminClient.from('profiles').select('email, name').eq('id', userId).single();
  if (profile?.email) {
    sendMembershipInvoice(profile.email, profile.name, tier, new Date(endsAt)).catch((e) =>
      console.error('Invoice email failed:', e)
    );
  }
  return membership;
};

router.post('/purchase', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { tier, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }
    if (razorpayOrderId && !verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      res.status(400).json({ message: 'Payment verification failed' }); return;
    }
    const membership = await activateMembership(userId, tier, razorpayPaymentId || 'dev:bypass');
    res.json(membership);
  } catch { res.status(500).json({ message: 'Error purchasing membership' }); }
});

router.get('/status', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { data } = await adminClient.from('memberships')
      .select('*').eq('user_id', req.user!.userId).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).single();
    res.json(data || { tier: 'regular' });
  } catch { res.status(500).json({ message: 'Error fetching membership status' }); }
});

router.put('/cancel', auth, async (req: AuthRequest, res: Response) => {
  try {
    await adminClient.from('memberships').update({ auto_renew: false })
      .eq('user_id', req.user!.userId).eq('status', 'active');
    res.json({ message: 'Auto-renew cancelled' });
  } catch { res.status(500).json({ message: 'Error cancelling membership' }); }
});

router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['x-razorpay-signature'] as string | undefined;
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
  if (!sig || !verifyWebhookSignature(rawBody, sig)) { res.status(400).json({ message: 'Invalid signature' }); return; }

  let event: Record<string, unknown>;
  try { event = JSON.parse(rawBody); } catch { res.status(400).json({ message: 'Invalid JSON' }); return; }

  if (event.event === 'payment.captured') {
    const payment = (event as any).payload?.payment?.entity;
    const userId: string | undefined = payment?.notes?.userId;
    const tier: string | undefined = payment?.notes?.tier;
    if (userId && tier && TIER_PRICES_PAISE[tier]) {
      try {
        await activateMembership(userId, tier, payment.id);
      } catch (e) {
        console.error('Webhook membership activation failed:', e);
        res.status(500).json({ message: 'Activation failed' }); return;
      }
    }
  }

  res.json({ received: true });
});

export default router;
