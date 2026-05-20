// Domain types for the wallet module.

export interface BrandTxFilter {
  creatorId?: string;
  campaignId?: string;
  from?: string;
  to?: string;
  status?: string;
  limit?: string;
}

export interface BrandTransactionRow {
  id: string;
  amount: number | string;
  status: string;
  invoice_number: string | null;
  created_at: string;
  payment_method: string | null;
  transaction_id: string | null;
  campaign_id: string;
  influencer_id: string;
  campaigns: { id: string; title: string } | null;
  profiles: { id: string; name: string } | null;
}

export interface BrandFilterRow {
  campaigns: { id: string; title: string } | null;
  profiles: { id: string; name: string } | null;
}

export interface WalletTransactionRow {
  id: unknown;
  amount: unknown;
  type: unknown;
  status: unknown;
  created_at: unknown;
  campaign_id: unknown;
  campaigns: { title?: string } | null;
}

export interface WithdrawInput {
  amount: number;
  upiId: string;
}
