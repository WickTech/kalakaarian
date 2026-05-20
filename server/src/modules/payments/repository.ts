import { adminClient } from '../../config/supabase';

// All Supabase access for the payments domain lives here.

// influencer_id FK → profiles(id), not influencer_profiles.
const CART_SELECT =
  '*, profiles!cart_items_influencer_id_fkey(id, name), campaigns!cart_items_campaign_id_fkey(id, title)';

const INVOICE_SELECT = `
  id, brand_id, influencer_id, amount, status, payment_method, transaction_id,
  invoice_number, created_at,
  campaigns:campaign_id(title),
  brand:brand_id(name, email),
  creator:influencer_id(name, email)
`;

// ---- cart_items ------------------------------------------------------------

export async function getCartItems(brandId: string): Promise<any[]> {
  const { data } = await adminClient
    .from('cart_items')
    .select(CART_SELECT)
    .eq('brand_id', brandId)
    .order('added_at', { ascending: false });
  return data ?? [];
}

export async function insertCartItem(
  row: Record<string, unknown>,
): Promise<{ ok: boolean; code?: string }> {
  const { error } = await adminClient.from('cart_items').insert(row);
  return { ok: !error, code: (error as { code?: string } | null)?.code };
}

export async function deleteCartItem(brandId: string, influencerId: string): Promise<void> {
  await adminClient
    .from('cart_items')
    .delete()
    .eq('brand_id', brandId)
    .eq('influencer_id', influencerId);
}

export async function deleteCart(brandId: string): Promise<void> {
  await adminClient.from('cart_items').delete().eq('brand_id', brandId);
}

// Clears a brand's cart, scoped to a campaign when one is given.
export async function deleteCartScoped(brandId: string, campaignId: string | null): Promise<void> {
  const del = adminClient.from('cart_items').delete().eq('brand_id', brandId);
  await (campaignId ? del.eq('campaign_id', campaignId) : del);
}

export async function updateCartItem(
  brandId: string,
  influencerId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await adminClient
    .from('cart_items')
    .update(patch)
    .eq('brand_id', brandId)
    .eq('influencer_id', influencerId);
}

// ---- campaigns / cart_orders ----------------------------------------------

export async function updateCampaignDescription(
  campaignId: string,
  brandId: string,
  description: string,
): Promise<void> {
  await adminClient
    .from('campaigns')
    .update({ description })
    .eq('id', campaignId)
    .eq('brand_id', brandId);
}

export async function insertCartOrder(row: Record<string, unknown>): Promise<void> {
  await adminClient.from('cart_orders').insert(row);
}

export async function getCartOrderByRazorpayId(razorpayOrderId: string): Promise<any | null> {
  const { data } = await adminClient
    .from('cart_orders')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .single();
  return data;
}

export async function markCartOrderPaid(id: string, paymentId: string): Promise<void> {
  await adminClient
    .from('cart_orders')
    .update({ status: 'paid', razorpay_payment_id: paymentId, updated_at: new Date().toISOString() })
    .eq('id', id);
}

// ---- transactions / workflow ----------------------------------------------

export async function insertTransaction(row: Record<string, unknown>): Promise<void> {
  const { error } = await adminClient.from('transactions').insert(row);
  if (error) console.error('finalizeCartPayment transaction insert failed:', error);
}

export async function findCampaignCreator(
  influencerId: string,
  campaignId: string,
): Promise<{ id: string; workflow_stage: string } | null> {
  const { data } = await adminClient
    .from('campaign_creators')
    .select('id, workflow_stage')
    .eq('influencer_id', influencerId)
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function insertCampaignCreator(
  row: Record<string, unknown>,
): Promise<{ id: string; workflow_stage: string } | null> {
  const { data, error } = await adminClient
    .from('campaign_creators')
    .insert(row)
    .select('id, workflow_stage')
    .single();
  if (error) {
    console.error('finalizeCartPayment campaign_creators insert failed:', error);
    return null;
  }
  return data;
}

export async function transitionWorkflowStage(params: Record<string, unknown>): Promise<void> {
  await adminClient.rpc('transition_workflow_stage', params);
}

export async function getCampaignWorkflow(
  campaignId: string,
): Promise<{ id: string; selected_creators: string[] | null } | null> {
  const { data } = await adminClient
    .from('campaign_workflow')
    .select('id, selected_creators')
    .eq('campaign_id', campaignId)
    .maybeSingle();
  return data;
}

export async function updateWorkflowSelectedCreators(id: string, creators: string[]): Promise<void> {
  await adminClient.from('campaign_workflow').update({ selected_creators: creators }).eq('id', id);
}

export async function insertCampaignWorkflow(campaignId: string, creators: string[]): Promise<void> {
  await adminClient
    .from('campaign_workflow')
    .insert({ campaign_id: campaignId, selected_creators: creators });
}

// ---- invoices --------------------------------------------------------------

export async function getInvoiceTransaction(transactionId: string): Promise<any | null> {
  const { data, error } = await adminClient
    .from('transactions')
    .select(INVOICE_SELECT)
    .eq('id', transactionId)
    .single();
  if (error || !data) return null;
  return data;
}
