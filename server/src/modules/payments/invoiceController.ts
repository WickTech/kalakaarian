import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { AuthRequest } from '../../middleware/auth';
import * as service from './invoiceService';
import type { InvoiceTxnRow } from './types';

const PLATFORM_NAME = 'Kalakaarian';
const PLATFORM_ADDRESS = 'Kalakaarian Platform · India';

// Streams the transaction invoice as a PDF. PDF rendering is presentation, so
// it stays in the controller; data + authorization come from the service.
export const getInvoicePdf = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await service.getInvoiceTransaction(req.params.transactionId, req.user!.userId);
  if (result.kind === 'not_found') {
    res.status(404).json({ message: 'Transaction not found' });
    return;
  }
  if (result.kind === 'forbidden') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  renderInvoicePdf(res, result.txn);
};

function renderInvoicePdf(res: Response, txn: InvoiceTxnRow): void {
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
}
