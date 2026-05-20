import * as repo from './repository';
import type { InvoiceTxnRow } from './types';

// Business logic for invoices — fetch the transaction and authorize the viewer.
// PDF rendering is presentation and lives in the controller.

export type InvoiceResult =
  | { kind: 'not_found' }
  | { kind: 'forbidden' }
  | { kind: 'ok'; txn: InvoiceTxnRow };

export async function getInvoiceTransaction(
  transactionId: string,
  userId: string,
): Promise<InvoiceResult> {
  const data = await repo.getInvoiceTransaction(transactionId);
  if (!data) return { kind: 'not_found' };

  const txn = data as unknown as InvoiceTxnRow;
  // Only the paying brand or the paid creator may view the invoice.
  if (txn.brand_id !== userId && txn.influencer_id !== userId) return { kind: 'forbidden' };
  return { kind: 'ok', txn };
}
