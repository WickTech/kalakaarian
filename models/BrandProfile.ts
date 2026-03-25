import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBrandProfile extends Document {
  userId: Types.ObjectId;
  companyName?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  bio?: string;
  isVerified?: boolean;
}

const BrandProfileSchema = new Schema<IBrandProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    companyName: { type: String },
    industry: { type: String },
    companySize: { type: String },
    website: { type: String },
    bio: { type: String },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const BrandProfile = mongoose.model<IBrandProfile>('BrandProfile', BrandProfileSchema);
