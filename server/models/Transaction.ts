import mongoose, { Document, Schema } from 'mongoose';
import { ITransaction } from '../types';

interface ITransactionDocument extends ITransaction, Document {}

const transactionSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    influencerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: String,
    transactionId: String,
  },
  { timestamps: true }
);

export default mongoose.model<ITransactionDocument>('Transaction', transactionSchema);
