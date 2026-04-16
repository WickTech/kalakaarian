import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaignVideo {
  influencerId: Schema.Types.ObjectId;
  videoUrl: string;
  platform: 'instagram' | 'youtube' | 'file' | 'drive';
  status: 'pending' | 'approved' | 'revision';
  feedback?: string;
  uploadedAt: Date;
}

interface ICampaignWorkflowDocument extends Document {
  campaignId: Schema.Types.ObjectId;
  selectedCreators: Schema.Types.ObjectId[];
  shooting: boolean;
  shootingAt?: Date;
  uploaded: boolean;
  uploadedAt?: Date;
  paymentDone: boolean;
  paymentAt?: Date;
  videos: ICampaignVideo[];
  notes: string;
}

const campaignWorkflowSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true, unique: true },
    selectedCreators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    shooting: { type: Boolean, default: false },
    shootingAt: { type: Date },
    uploaded: { type: Boolean, default: false },
    uploadedAt: { type: Date },
    paymentDone: { type: Boolean, default: false },
    paymentAt: { type: Date },
    videos: [{
      influencerId: { type: Schema.Types.ObjectId, ref: 'User' },
      videoUrl: String,
      platform: { type: String, enum: ['instagram', 'youtube', 'file', 'drive'] },
      status: { type: String, enum: ['pending', 'approved', 'revision'], default: 'pending' },
      feedback: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

campaignWorkflowSchema.index({ campaignId: 1 }, { unique: true });

export default mongoose.model<ICampaignWorkflowDocument>('CampaignWorkflow', campaignWorkflowSchema);