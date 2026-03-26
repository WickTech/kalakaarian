import mongoose, { Document, Schema } from 'mongoose';
import { IProposal } from '../types';

interface IProposalDocument extends IProposal, Document {}

const proposalSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    influencerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    bidAmount: { type: Number, required: true },
    timeline: { type: String },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'negotiating'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

proposalSchema.index({ campaignId: 1, influencerId: 1 }, { unique: true });
proposalSchema.index({ influencerId: 1, status: 1 });

export default mongoose.model<IProposalDocument>('Proposal', proposalSchema);
