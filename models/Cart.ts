import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICartItem {
  influencerId: Types.ObjectId;
  addedAt: Date;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  total?: number;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  influencerId: { type: Schema.Types.ObjectId, ref: 'InfluencerProfile', required: true },
  addedAt: { type: Date, default: Date.now },
});

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    items: [CartItemSchema],
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Cart = mongoose.model<ICart>('Cart', CartSchema);
