import mongoose, { Document, Schema } from 'mongoose';
import { ICampaign } from '../types';

interface ICampaignDocument extends ICampaign, Document {}

const campaignSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    deliverables: { type: String, default: '' },
    genre: [{ type: String, index: true }],
    platform: [{ type: String }],
    budget: { type: Number, required: true },
    deadline: { type: Date, required: true, index: true },
    requirements: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'open', 'in_progress', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true }
);

campaignSchema.index({ brandId: 1, status: 1 });
campaignSchema.index({ status: 1, deadline: 1 });
campaignSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<ICampaignDocument>('Campaign', campaignSchema);
