import { adminClient } from '../../config/supabase';

// DAO for the post-checkout campaign-lifecycle concern: stamping the delivery
// window, notifying selected creators, and writing workflow activity. Kept
// separate from repository.ts (cart/order/transaction DAO) by concern.

const DELIVERY_WINDOW_MS = 48 * 60 * 60 * 1000;

// Title + brand name for the "you've been selected" creator notification.
export async function getCampaignBasics(
  campaignId: string,
): Promise<{ title: string; brand_name: string | null } | null> {
  const { data } = await adminClient
    .from('campaigns')
    .select('title, profiles!campaigns_brand_id_fkey(name)')
    .eq('id', campaignId)
    .maybeSingle();
  if (!data) return null;
  const brand = (data as { profiles?: { name?: string } | null }).profiles;
  return { title: (data as { title: string }).title, brand_name: brand?.name ?? null };
}

// Stamps the delivery window on first checkout only (delivery_started_at NULL
// guard makes a repeat/partial checkout a no-op).
export async function startCampaignDelivery(campaignId: string): Promise<void> {
  const now = new Date();
  const due = new Date(now.getTime() + DELIVERY_WINDOW_MS);
  const { error } = await adminClient
    .from('campaigns')
    .update({ delivery_started_at: now.toISOString(), delivery_due_at: due.toISOString() })
    .eq('id', campaignId)
    .is('delivery_started_at', null);
  if (error) console.error('startCampaignDelivery update failed:', error);
}

// Bulk-inserts creator notifications. Failure is logged, never thrown — a
// missed notification must not roll back a completed payment.
export async function insertNotifications(rows: Record<string, unknown>[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await adminClient.from('notifications').insert(rows);
  if (error) console.error('finalizeCartPayment notification insert failed:', error);
}

export async function insertActivityLog(row: Record<string, unknown>): Promise<void> {
  const { error } = await adminClient.from('campaign_creator_activity_log').insert(row);
  if (error) console.error('finalizeCartPayment activity log insert failed:', error);
}
