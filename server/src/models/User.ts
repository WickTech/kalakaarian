import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../types';

interface IUserDocument extends IUser, Document {}

const userSchema = new Schema(
  {
    email: { type: String, unique: true, sparse: true, index: true },
    username: { type: String, unique: true, sparse: true, index: true },
    phone: { type: String, unique: true, sparse: true, index: true },
    phoneVerified: { type: Boolean, default: false },
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true, index: true },
    role: { type: String, enum: ['brand', 'influencer'], required: true, index: true },
    isAdmin: { type: Boolean, default: false },
    name: { type: String, required: true },
    isPhoneLogin: { type: Boolean, default: false },
    whatsappNotifications: {
      enabled: { type: Boolean, default: false },
      campaigns: { type: Boolean, default: true },
      proposals: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUserDocument>('User', userSchema);
