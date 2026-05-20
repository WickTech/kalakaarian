// Domain types for the payments module.

export type CartSnapshotItem = { influencer_id: string; price: number };

export interface AddToCartInput {
  influencerId: string;
  campaignId?: string;
  price?: number;
}

export interface UpdateCartInput {
  campaignId?: string;
  price?: number;
}

export interface CheckoutInput {
  campaignId?: string;
  campaignDescription?: string;
}

export interface CartResponse {
  items: unknown[];
  totalAmount: number;
}

export interface InvoiceTxnRow {
  id: string;
  brand_id: string;
  influencer_id: string;
  amount: number | string;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  invoice_number: string | null;
  created_at: string;
  campaigns: { title: string } | null;
  brand: { name: string; email: string } | null;
  creator: { name: string; email: string } | null;
}
