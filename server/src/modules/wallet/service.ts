import * as repo from './repository';
import { withdrawSchema } from './validators';
import { sendWithdrawalRequestEmail } from '../../services/emailService';
import type { BrandTxFilter } from './types';

// Business logic for the wallet domain. No Express types here.

export async function getBrandTransactions(brandId: string, filter: BrandTxFilter) {
  const rows = await repo.listBrandTransactions(brandId, filter);
  return rows.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    status: t.status,
    invoiceNumber: t.invoice_number,
    createdAt: t.created_at,
    paymentMethod: t.payment_method,
    transactionId: t.transaction_id,
    campaignId: t.campaign_id,
    campaignTitle: t.campaigns?.title ?? null,
    influencerId: t.influencer_id,
    influencerName: t.profiles?.name ?? null,
  }));
}

export async function getBrandTransactionFilters(brandId: string) {
  const rows = await repo.listBrandFilterRows(brandId);
  const campaignMap = new Map<string, string>();
  const creatorMap = new Map<string, string>();
  for (const r of rows) {
    if (r.campaigns?.id) campaignMap.set(r.campaigns.id, r.campaigns.title);
    if (r.profiles?.id) creatorMap.set(r.profiles.id, r.profiles.name);
  }
  return {
    campaigns: [...campaignMap].map(([id, title]) => ({ id, title })),
    creators: [...creatorMap].map(([id, name]) => ({ id, name })),
  };
}

export async function getWalletTransactions(userId: string) {
  const rows = await repo.listInfluencerTransactions(userId);
  return rows.map((t) => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    status: t.status,
    createdAt: t.created_at,
    campaignTitle: t.campaigns?.title ?? null,
  }));
}

export type WithdrawResult =
  | { kind: 'invalid'; message: string }
  | { kind: 'ok'; message: string };

export async function requestWithdrawal(userId: string, body: unknown): Promise<WithdrawResult> {
  const parsed = withdrawSchema.safeParse(body);
  if (!parsed.success) {
    return { kind: 'invalid', message: parsed.error.issues[0]?.message ?? 'Invalid request' };
  }
  const { amount, upiId } = parsed.data;

  const profile = await repo.getProfileContact(userId);
  await repo.insertWithdrawal(userId, amount, upiId);
  await sendWithdrawalRequestEmail(profile.name || 'Influencer', profile.email || '', amount, upiId);

  return { kind: 'ok', message: 'Withdrawal request submitted. Processed within 5–7 business days.' };
}
