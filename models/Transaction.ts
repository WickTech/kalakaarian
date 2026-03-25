import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  campaignId: Types.ObjectId;
  amount?: number;
  status?: 'HELD' | 'RELEASED' | 'REFUNDED';
  paymentIntent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    amount: { type: Number },
    status: {
      type: String,
      enum: ['HELD', 'RELEASED', 'REFUNDED'],
      default: 'HELD',
    },
    paymentIntent: { type: String },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
