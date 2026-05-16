import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

type TxnRow = {
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
};

const PLATFORM_NAME = 'Kalakaarian';
const PLATFORM_ADDRESS = 'Kalakaarian Platform · India';

export const getInvoicePdf = async (req: AuthRequest, res: Response): Promise<void> => {
  const { transactionId } = req.params;
  const userId = req.user!.userId;

  const { data, error } = await adminClient
    .from('transactions')
    .select(`
      id, brand_id, influencer_id, amount, status, payment_method, transaction_id,
      invoice_number, created_at,
      campaigns:campaign_id(title),
      brand:brand_id(name, email),
      creator:influencer_id(name, email)
    `)
    .eq('id', transactionId)
    .single();

  if (error || !data) { res.status(404).json({ message: 'Transaction not found' }); return; }

  const txn = data as unknown as TxnRow;
  if (txn.brand_id !== userId && txn.influencer_id !== userId) {
    res.status(403).json({ message: 'Forbidden' }); return;
  }

  const amount = Number(txn.amount);
  const invoiceNo = txn.invoice_number ?? `TMP-${txn.id.slice(0, 8)}`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoiceNo}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  doc.fontSize(22).text(PLATFORM_NAME, { align: 'left' });
  doc.fontSize(9).fillColor('#666').text(PLATFORM_ADDRESS);
  doc.moveDown(1.5);

  doc.fillColor('#000').fontSize(16).text('TAX INVOICE', { align: 'right' });
  doc.fontSize(10).fillColor('#444')
     .text(`Invoice #: ${invoiceNo}`, { align: 'right' })
     .text(`Date: ${new Date(txn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, { align: 'right' })
     .text(`Status: ${txn.status.toUpperCase()}`, { align: 'right' });
  doc.moveDown(2);

  doc.fillColor('#000').fontSize(11).text('Billed To', { underline: true });
  doc.fontSize(10).fillColor('#333')
     .text(txn.brand?.name || '—')
     .text(txn.brand?.email || '');
  doc.moveDown();

  doc.fillColor('#000').fontSize(11).text('Paid To (Creator)', { underline: true });
  doc.fontSize(10).fillColor('#333')
     .text(txn.creator?.name || '—')
     .text(txn.creator?.email || '');
  doc.moveDown(2);

  const tableTop = doc.y;
  doc.fontSize(10).fillColor('#000');
  doc.text('Description', 50, tableTop);
  doc.text('Amount (INR)', 0, tableTop, { align: 'right' });
  doc.moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).strokeColor('#ccc').stroke();
  doc.moveDown(0.8);

  doc.fillColor('#333').fontSize(10)
     .text(`Campaign: ${txn.campaigns?.title || '—'}`, 50, doc.y, { continued: false });
  const lineY = doc.y - 12;
  doc.text(`₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 50, lineY, { align: 'right' });
  doc.moveDown(2);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#000').text('Total', 350, doc.y, { continued: true });
  doc.text(`₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, { align: 'right' });
  doc.moveDown(3);

  if (txn.transaction_id) {
    doc.fontSize(9).fillColor('#666')
       .text(`Payment method: ${txn.payment_method || '—'}`)
       .text(`Razorpay reference: ${txn.transaction_id}`);
  }
  doc.moveDown(2);
  doc.fontSize(8).fillColor('#999')
     .text('This is a system-generated invoice and does not require a signature.', { align: 'center' });

  doc.end();
};
