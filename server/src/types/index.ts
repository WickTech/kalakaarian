import mongoose from 'mongoose';

export interface IUser {
  email?: string;
  username?: string;
  phone?: string;
  phoneVerified?: boolean;
  password?: string;
  googleId?: string;
  role: 'brand' | 'influencer';
  name: string;
  isPhoneLogin?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInfluencerProfile {
  userId: mongoose.Types.ObjectId;
  bio: string;
  city: string;
  niches: string[];
  socialHandles: {
    instagram?: string;
    youtube?: string;
  };
  profileImage?: string;
  platform: ('instagram' | 'youtube')[];
  tier: 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
  pricing: {
    story?: number;
    reel?: number;
    video?: number;
    post?: number;
  };
  portfolio: string[];
  verified: boolean;
  instagramPosts: {
    postId: string;
    url: string;
    thumbnail: string;
    caption: string;
  }[];
  youtubeVideos: {
    videoId: string;
    url: string;
    thumbnail: string;
    title: string;
    views: number;
    publishedAt: Date;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBrandProfile {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  industry: string;
  website?: string;
  logo?: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICampaign {
  brandId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  deliverables: string;
  genre: string[];
  platform: string[];
  budget: number;
  deadline: Date;
  requirements: string;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProposal {
  campaignId: mongoose.Types.ObjectId;
  influencerId: mongoose.Types.ObjectId;
  message: string;
  bidAmount: number;
  timeline?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICartItem {
  influencerId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  price: number;
  addedAt: Date;
}

export interface ICart {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITransaction {
  brandId: mongoose.Types.ObjectId;
  influencerId: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthRequest extends Express.Request {
  user?: {
    userId: string;
    role: string;
  };
}
