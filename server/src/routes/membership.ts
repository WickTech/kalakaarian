import { Router, Response, Request } from 'express';
import Membership from '../models/Membership';
import User from '../models/User';
import { auth, AuthRequest } from '../middleware/auth';
import { checkAndGrantGoldReward } from '../services/referralRewards';
import { sendMembershipInvoice } from '../services/emailService';
import {
  createOrder,
  verifySignature,
  verifyWebhookSignature,
  TIER_PRICES_PAISE,
} from '../services/razorpayService';

const router = Router();

// Step 1: create Razorpay order before checkout
router.post('/order', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { tier } = req.body;
    const userId = req.user?.userId;
    if (!userId || !tier || !TIER_PRICES_PAISE[tier]) {
      res.status(400).json({ message: 'Invalid tier' });
      return;
    }
    const order = await createOrder(
      TIER_PRICES_PAISE[tier],
      `membership-${userId}-${tier}`,
      { userId: String(userId), tier }
    );
    if (!order) {
      // Razorpay not configured — allow free activation in dev
      res.json({ orderId: null, amount: 0, currency: 'INR', keyId: null });
      return;
    }
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating order' });
  }
});

// Step 2: verify payment and activate membership
router.post('/purchase', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { tier, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    // If Razorpay is configured, signature must verify. Skip check in dev (orderId is null).
    if (razorpayOrderId && !verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      res.status(400).json({ message: 'Payment verification failed' });
      return;
    }

    const membership = await Membership.findOneAndUpdate(
      { influencerId: userId },
      {
        influencerId: userId,
        tier,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        paymentId: razorpayPaymentId || 'dev:bypass',
      },
      { upsert: true, new: true }
    );

    if (tier === 'gold') {
      checkAndGrantGoldReward(userId).catch((e) =>
        console.error('Referral Gold reward check failed:', e)
      );
    }

    const user = await User.findById(userId).select('email name');
    if (user?.email) {
      sendMembershipInvoice(user.email, user.name, tier, membership.endDate).catch((e) =>
        console.error('Invoice email failed:', e)
      );
    }

    res.json(membership);
  } catch (error) {
    res.status(500).json({ message: 'Error purchasing membership' });
  }
});

router.get('/status', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const membership = await Membership.findOne({ influencerId: userId });
    res.json(membership || { tier: 'regular' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching membership status' });
  }
});

router.put('/cancel', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    await Membership.findOneAndUpdate({ influencerId: userId }, { autoRenew: false });
    res.json({ message: 'Auto-renew cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling membership' });
  }
});

// Razorpay webhook — no auth, raw body preserved by app.ts middleware ordering
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['x-razorpay-signature'] as string | undefined;
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);

  if (!sig || !verifyWebhookSignature(rawBody, sig)) {
    res.status(400).json({ message: 'Invalid signature' });
    return;
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    res.status(400).json({ message: 'Invalid JSON' });
    return;
  }

  if (event.event === 'payment.captured') {
    const payment = (event as any).payload?.payment?.entity;
    const userId: string | undefined = payment?.notes?.userId;
    const tier: string | undefined = payment?.notes?.tier;

    if (userId && tier && TIER_PRICES_PAISE[tier]) {
      try {
        const membership = await Membership.findOneAndUpdate(
          { influencerId: userId },
          {
            influencerId: userId,
            tier,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            autoRenew: true,
            paymentId: payment.id,
          },
          { upsert: true, new: true }
        );
        if (tier === 'gold') {
          checkAndGrantGoldReward(userId).catch((e) =>
            console.error('Referral Gold reward check failed (webhook):', e)
          );
        }
        const user = await User.findById(userId).select('email name');
        if (user?.email) {
          sendMembershipInvoice(user.email, user.name, tier, membership.endDate).catch((e) =>
            console.error('Invoice email failed (webhook):', e)
          );
        }
      } catch (e) {
        console.error('Webhook membership activation failed:', e);
        res.status(500).json({ message: 'Activation failed' });
        return;
      }
    }
  }

  res.json({ received: true });
});

export default router;
