import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRequirements {
  minFollowers?: number;
  maxBudget?: number;
  genres?: string[];
  platforms?: string[];
}

export interface ICampaign extends Document {
  brandId: Types.ObjectId;
  title: string;
  description?: string;
  budget?: number;
  deadline?: Date;
  status?: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  deliverables?: string[];
  requirements?: IRequirements;
  proposalCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const RequirementsSchema = new Schema<IRequirements>({
  minFollowers: { type: Number },
  maxBudget: { type: Number },
  genres: [{ type: String }],
  platforms: [{ type: String }],
});

const CampaignSchema = new Schema<ICampaign>(
  {
    brandId: { type: Schema.Types.ObjectId, ref: 'BrandProfile', required: true },
    title: { type: String, required: true },
    description: { type: String },
    budget: { type: Number },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ['DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'DRAFT',
    },
    deliverables: [{ type: String }],
    requirements: { type: RequirementsSchema },
    proposalCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
