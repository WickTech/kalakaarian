import { adminClient } from '../../config/supabase';
import type {
  BrandTxFilter,
  BrandTransactionRow,
  BrandFilterRow,
  WalletTransactionRow,
} from './types';

// All Supabase access for the wallet domain lives here.

const VALID_STATUS = new Set(['pending', 'completed', 'failed', 'refunded']);

export async function listBrandTransactions(
  brandId: string,
  filter: BrandTxFilter,
): Promise<BrandTransactionRow[]> {
  let query = adminClient
    .from('transactions')
    .select(`
      id, amount, status, invoice_number, created_at,
      payment_method, transaction_id, campaign_id, influencer_id,
      campaigns:campaign_id(id, title),
      profiles:influencer_id(id, name)
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Number(filter.limit) || 100, 200));

  if (filter.creatorId) query = query.eq('influencer_id', filter.creatorId);
  if (filter.campaignId) query = query.eq('campaign_id', filter.campaignId);
  if (filter.status && VALID_STATUS.has(filter.status)) query = query.eq('status', filter.status);
  if (filter.from) query = query.gte('created_at', filter.from);
  if (filter.to) query = query.lte('created_at', filter.to);

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as BrandTransactionRow[] | null) ?? [];
}

export async function listBrandFilterRows(brandId: string): Promise<BrandFilterRow[]> {
  const { data, error } = await adminClient
    .from('transactions')
    .select('campaign_id, influencer_id, campaigns:campaign_id(id, title), profiles:influencer_id(id, name)')
    .eq('brand_id', brandId)
    .limit(500);
  if (error) throw error;
  return (data as unknown as BrandFilterRow[] | null) ?? [];
}

export async function listInfluencerTransactions(userId: string): Promise<WalletTransactionRow[]> {
  const { data, error } = await adminClient
    .from('transactions')
    .select('id, amount, type, status, created_at, campaign_id, campaigns(title)')
    .eq('influencer_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as unknown as WalletTransactionRow[] | null) ?? [];
}

export async function getProfileContact(
  userId: string,
): Promise<{ name?: string; email?: string }> {
  const { data, error } = await adminClient
    .from('profiles')
    .select('name, email')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return (data as { name?: string; email?: string } | null) ?? {};
}

export async function insertWithdrawal(
  userId: string,
  amount: number,
  upiId: string,
): Promise<void> {
  const { error } = await adminClient
    .from('withdrawal_requests')
    .insert({ influencer_id: userId, amount, upi_id: upiId });
  if (error) throw error;
}
