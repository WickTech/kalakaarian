import Razorpay from 'razorpay';
import crypto from 'crypto';

let client: Razorpay | null = null;

function getClient(): Razorpay | null {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return null;
  if (!client) client = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  return client;
}

export const createOrder = async (
  amountPaise: number,
  receipt: string,
  notes?: Record<string, string>
): Promise<{ id: string; amount: number; currency: string } | null> => {
  const r = getClient();
  if (!r) return null;
  const order = await r.orders.create({ amount: amountPaise, currency: 'INR', receipt, notes });
  return { id: order.id, amount: Number(order.amount), currency: order.currency };
};

export const verifySignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return expected === signature;
};

export const verifyWebhookSignature = (body: string, signature: string): boolean => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
};

export const TIER_PRICES_PAISE: Record<string, number> = {
  silver: 49900,
  gold: 99900,
};
