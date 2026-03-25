import mongoose, { Document, Schema } from 'mongoose';
import { ICampaign } from '../types';

interface ICampaignDocument extends ICampaign, Document {}

const campaignSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    genre: [{ type: String }],
    platform: [{ type: String }],
    budget: { type: Number, required: true },
    deadline: { type: Date, required: true },
    requirements: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'open', 'in_progress', 'completed', 'cancelled'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICampaignDocument>('Campaign', campaignSchema);
