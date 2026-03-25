import mongoose, { Document, Schema } from 'mongoose';
import { IBrandProfile } from '../types';

interface IBrandProfileDocument extends IBrandProfile, Document {}

const brandProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true },
    industry: { type: String, required: true },
    website: String,
    logo: String,
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IBrandProfileDocument>('BrandProfile', brandProfileSchema);
