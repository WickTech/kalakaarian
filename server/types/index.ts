export interface IUser {
  _id: string;
  email: string;
  password: string;
  role: 'brand' | 'influencer';
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInfluencerProfile {
  _id: string;
  userId: string;
  bio: string;
  city: string;
  genre: string[];
  platform: ('instagram' | 'youtube' | 'tiktok' | 'twitter')[];
  tier: 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
  followers: {
    instagram?: number;
    youtube?: number;
    tiktok?: number;
    twitter?: number;
  };
  pricing: {
    story?: number;
    reel?: number;
    video?: number;
    post?: number;
  };
  portfolio: string[];
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBrandProfile {
  _id: string;
  userId: string;
  companyName: string;
  industry: string;
  website?: string;
  logo?: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICampaign {
  _id: string;
  brandId: string;
  title: string;
  description: string;
  genre: string[];
  platform: string[];
  budget: number;
  deadline: Date;
  requirements: string;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface IProposal {
  _id: string;
  campaignId: string;
  influencerId: string;
  message: string;
  price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  influencerId: string;
  campaignId?: string;
  price: number;
  addedAt: Date;
}

export interface ICart {
  _id: string;
  userId: string;
  items: ICartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  _id: string;
  brandId: string;
  influencerId: string;
  campaignId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Express.Request {
  user?: {
    userId: string;
    role: string;
  };
}
