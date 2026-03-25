import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'PROPOSAL' | 'CAMPAIGN' | 'MESSAGE' | 'PAYMENT' | 'SYSTEM';
  title: string;
  message: string;
  read?: boolean;
  data?: any;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['PROPOSAL', 'CAMPAIGN', 'MESSAGE', 'PAYMENT', 'SYSTEM'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
