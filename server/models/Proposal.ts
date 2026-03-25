import mongoose, { Document, Schema } from 'mongoose';
import { IProposal } from '../types';

interface IProposalDocument extends IProposal, Document {}

const proposalSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    influencerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'negotiating'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProposalDocument>('Proposal', proposalSchema);
