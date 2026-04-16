import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaignFile {
  campaignId: Schema.Types.ObjectId;
  fileUrl: string;
  fileType: 'brief' | 'contract' | 'other';
  fileName: string;
  uploadedBy: Schema.Types.ObjectId;
  uploadedAt: Date;
}

interface ICampaignFileDocument extends ICampaignFile, Document {}

const campaignFileSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, enum: ['brief', 'contract', 'other'], default: 'brief' },
    fileName: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

campaignFileSchema.index({ campaignId: 1 });

export default mongoose.model<ICampaignFileDocument>('CampaignFile', campaignFileSchema);