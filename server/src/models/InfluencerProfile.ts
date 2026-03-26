import mongoose, { Document, Schema } from 'mongoose';
import { IInfluencerProfile } from '../types';

interface IInfluencerProfileDocument extends IInfluencerProfile, Document {}

const influencerProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bio: { type: String, default: '' },
    city: { type: String, required: true, index: true },
    niches: [{ type: String, index: true }],
    socialHandles: {
      instagram: String,
      youtube: String,
      tiktok: String,
      twitter: String,
    },
    followerCount: { type: Number, default: 0, index: true },
    platform: [{ type: String, enum: ['instagram', 'youtube', 'tiktok', 'twitter'] }],
    tier: { type: String, enum: ['nano', 'micro', 'mid', 'macro', 'mega'], required: true, index: true },
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
    verified: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

influencerProfileSchema.index({ niches: 1, tier: 1 });
influencerProfileSchema.index({ followerCount: -1 });

export default mongoose.model<IInfluencerProfileDocument>('InfluencerProfile', influencerProfileSchema);
