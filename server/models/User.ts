import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../types';

interface IUserDocument extends IUser, Document {}

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['brand', 'influencer'], required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUserDocument>('User', userSchema);
