import mongoose, { Document, Schema } from 'mongoose';
import { IInfluencerProfile } from '../types';

interface IInfluencerProfileDocument extends IInfluencerProfile, Document {}

const influencerProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bio: { type: String, default: '' },
    city: { type: String, required: true },
    genre: [{ type: String }],
    platform: [{ type: String, enum: ['instagram', 'youtube', 'tiktok', 'twitter'] }],
    tier: { type: String, enum: ['nano', 'micro', 'mid', 'macro', 'mega'], required: true },
    followers: {
      instagram: Number,
      youtube: Number,
      tiktok: Number,
      twitter: Number,
    },
    pricing: {
      story: Number,
      reel: Number,
      video: Number,
      post: Number,
    },
    portfolio: [{ type: String }],
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IInfluencerProfileDocument>('InfluencerProfile', influencerProfileSchema);
