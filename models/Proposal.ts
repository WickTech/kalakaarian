import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProposal extends Document {
  campaignId: Types.ObjectId;
  influencerId: Types.ObjectId;
  bidAmount?: number;
  message?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema = new Schema<IProposal>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    influencerId: { type: Schema.Types.ObjectId, ref: 'InfluencerProfile', required: true },
    bidAmount: { type: Number },
    message: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

export const Proposal = mongoose.model<IProposal>('Proposal', ProposalSchema);
