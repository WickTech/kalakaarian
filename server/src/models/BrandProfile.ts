import mongoose, { Document, Schema } from 'mongoose';
import { IBrandProfile } from '../types';

interface IBrandProfileDocument extends IBrandProfile, Document {}

const brandProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyName: { type: String, required: true },
    industry: { type: String, required: true, index: true },
    website: String,
    logo: String,
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

brandProfileSchema.index({ userId: 1, industry: 1 });

export default mongoose.model<IBrandProfileDocument>('BrandProfile', brandProfileSchema);
