import * as repo from './repository';
import { finalizeCartPayment } from './paymentFinalizer';
import { PLATFORM_FEE_RATE } from '../../utils/pricing';
import { createOrder, verifyWebhookSignature } from '../../services/razorpayService';
import type {
  AddToCartInput, UpdateCartInput, CheckoutInput, CartResponse, CartSnapshotItem,
} from './types';

// Business logic for the cart / checkout / webhook concern.

const toCartResponse = (items: any[]): CartResponse => ({
  items,
  totalAmount: items.reduce((sum: number, item: any) => sum + (item.price || 0), 0),
});

export async function getCart(brandId: string): Promise<CartResponse> {
  return toCartResponse(await repo.getCartItems(brandId));
}

export type AddResult = { kind: 'conflict' } | { kind: 'ok'; cart: CartResponse };

export async function addToCart(brandId: string, input: AddToCartInput): Promise<AddResult> {
  const { ok, code } = await repo.insertCartItem({
    brand_id: brandId,
    influencer_id: input.influencerId,
    campaign_id: input.campaignId || null,
    price: input.price || 0,
    added_at: new Date().toISOString(),
  });
  if (!ok) {
    if (code === '23505') return { kind: 'conflict' };
    throw new Error('Failed to add to cart');
  }
  return { kind: 'ok', cart: await getCart(brandId) };
}

export async function removeFromCart(brandId: string, influencerId: string): Promise<CartResponse> {
  await repo.deleteCartItem(brandId, influencerId);
  return getCart(brandId);
}

export async function clearCart(brandId: string): Promise<void> {
  await repo.deleteCart(brandId);
}

export async function updateCartItem(
  brandId: string, influencerId: string, input: UpdateCartInput,
): Promise<CartResponse> {
  const patch: Record<string, unknown> = {};
  if (input.campaignId !== undefined) patch.campaign_id = input.campaignId;
  if (input.price !== undefined) patch.price = input.price;
  await repo.updateCartItem(brandId, influencerId, patch);
  return getCart(brandId);
}

export type CheckoutResult =
  | { kind: 'empty' }
  | { kind: 'free'; amount: number }
  | { kind: 'order'; orderId: string; amount: number; currency: string; keyId: string | undefined };

export async function checkout(brandId: string, input: CheckoutInput): Promise<CheckoutResult> {
  if (input.campaignId && input.campaignDescription) {
    await repo.updateCampaignDescription(input.campaignId, brandId, input.campaignDescription);
  }

  const items = await repo.getCartItems(brandId);
  if (items.length === 0) return { kind: 'empty' };

  const snapshot: CartSnapshotItem[] = items.map((item: any) => ({
    influencer_id: item.influencer_id,
    price: item.price,
  }));

  const subtotalRupees = items.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
  const feeRupees = Math.round(subtotalRupees * PLATFORM_FEE_RATE);
  const totalPaise = Math.round((subtotalRupees + feeRupees) * 100);

  const order = await createOrder(totalPaise, `cart-${brandId}-${Date.now()}`, {
    userId: brandId,
    campaignId: input.campaignId || '',
  });

  if (!order) {
    // Razorpay not configured: finalize directly so the campaign still gets
    // its creators attached. paymentRef tagged 'free' for audit.
    await finalizeCartPayment(brandId, input.campaignId || null, snapshot, `free-${Date.now()}`, null);
    return { kind: 'free', amount: totalPaise };
  }

  // Persist the cart snapshot so the webhook can process it without re-querying.
  await repo.insertCartOrder({
    brand_id: brandId,
    razorpay_order_id: order.id,
    amount_paise: totalPaise,
    campaign_id: input.campaignId || null,
    cart_snapshot: snapshot,
  });

  return {
    kind: 'order',
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
}

export type WebhookResult =
  | { kind: 'bad'; status: number; message: string }
  | { kind: 'received' };

export async function handleWebhook(
  rawBody: string, signature: string | undefined,
): Promise<WebhookResult> {
  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return { kind: 'bad', status: 400, message: 'Invalid signature' };
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { kind: 'bad', status: 400, message: 'Invalid JSON' };
  }

  if (event.event !== 'payment.captured') return { kind: 'received' };

  const payment = (event as any).payload?.payment?.entity;
  const razorpayOrderId: string | undefined = payment?.order_id;
  const paymentId: string | undefined = payment?.id;
  if (!razorpayOrderId || !paymentId) return { kind: 'received' };

  const cartOrder = await repo.getCartOrderByRazorpayId(razorpayOrderId);
  // Idempotent — already-paid orders are silently acknowledged.
  if (!cartOrder || cartOrder.status === 'paid') return { kind: 'received' };

  const snapshot: CartSnapshotItem[] = cartOrder.cart_snapshot ?? [];
  await finalizeCartPayment(
    cartOrder.brand_id, cartOrder.campaign_id ?? null, snapshot, paymentId, razorpayOrderId,
  );
  await repo.markCartOrderPaid(cartOrder.id, paymentId);

  return { kind: 'received' };
}
