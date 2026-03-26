import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../types';

interface IUserDocument extends IUser, Document {}

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true, index: true },
    role: { type: String, enum: ['brand', 'influencer'], required: true, index: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUserDocument>('User', userSchema);
