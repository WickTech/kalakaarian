import mongoose, { Document, Schema } from 'mongoose';
import { ICart, ICartItem } from '../types';

interface ICartDocument extends ICart, Document {}

const cartItemSchema = new Schema<ICartItem>(
  {
    influencerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    price: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICartDocument>('Cart', cartSchema);
