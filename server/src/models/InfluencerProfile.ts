import mongoose, { Document, Schema } from 'mongoose';
import { IInfluencerProfile } from '../types';

interface IInfluencerProfileDocument extends IInfluencerProfile, Document {}

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

const influencerProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bio: { type: String, default: '' },
    city: { type: String, default: '' },
    gender: {
      type: String,
      enum: ['male', 'female', 'non_binary', 'prefer_not_to_say'],
      index: true,
    },
    niches: [{ type: String, index: true }],
    socialHandles: {
      instagram: String,
      youtube: String,
    },
    profileImage: { type: String, default: DEFAULT_AVATAR },
    platform: [{ type: String, enum: ['instagram', 'youtube'] }],
    tier: { type: String, enum: ['nano', 'micro', 'mid', 'macro', 'mega'], default: 'micro', index: true },
    pricing: {
      story: Number,
      reel: Number,
      video: Number,
      post: Number,
    },
    portfolio: [{ type: String }],
    verified: { type: Boolean, default: false, index: true },
    isOnline: { type: Boolean, default: false, index: true },
    lastSeenAt: { type: Date },
    instagramPosts: [{
      postId: String,
      url: String,
      thumbnail: String,
      caption: String,
    }],
    youtubeVideos: [{
      videoId: String,
      url: String,
      thumbnail: String,
      title: String,
      views: Number,
      publishedAt: Date,
    }],
  },
  { timestamps: true }
);

influencerProfileSchema.index({ niches: 1, tier: 1 });

export default mongoose.model<IInfluencerProfileDocument>('InfluencerProfile', influencerProfileSchema);
