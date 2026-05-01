// All IDs are UUIDs (string), fields use snake_case matching Supabase schema.

export interface IUser {
  id: string;
  role: 'brand' | 'influencer';
  name: string;
  email?: string | null;
  username?: string | null;
  phone?: string | null;
  phone_verified?: boolean;
  is_phone_login?: boolean;
  is_admin?: boolean;
  avatar_url?: string | null;
  whatsapp_notifications?: {
    enabled: boolean;
    campaigns: boolean;
    proposals: boolean;
    messages: boolean;
    payments: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export interface IInfluencerProfile {
  id: string;               // FK → profiles.id
  bio?: string;
  city?: string;
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  niches: string[];
  platforms: string[];
  instagram_handle?: string | null;
  youtube_handle?: string | null;
  avatar_url?: string | null;
  tier?: 'nano' | 'micro' | 'macro' | 'mega';
  is_online?: boolean;
  is_verified?: boolean;
  last_seen_at?: string | null;
  followers_count?: number;
  engagement_rate?: number | null;
  portfolio?: string[];
  portfolio_url?: string | null;
  instagram_posts?: InstagramPost[];
  youtube_videos?: YoutubeVideo[];
  created_at?: string;
  updated_at?: string;
}

export interface InstagramPost {
  postId: string;
  url: string;
  thumbnail: string;
  caption: string;
}

export interface YoutubeVideo {
  videoId: string;
  url: string;
  thumbnail: string;
  title: string;
  views: number;
  publishedAt: string;
}

export interface IInfluencerPricing {
  id: string;
  influencer_id: string;
  platform: string;
  content_type: 'reel' | 'story' | 'video' | 'post';
  price: number;
  created_at?: string;
}

export interface IBrandProfile {
  id: string;               // FK → profiles.id
  company_name: string;
  industry?: string | null;
  contact_name?: string | null;
  website?: string | null;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ICampaign {
  id: string;
  brand_id: string;
  title: string;
  description?: string | null;
  requirements?: string | null;
  budget?: number | null;
  platforms: string[];
  niches: string[];
  status: 'open' | 'closed' | 'archived';
  deadline?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IProposal {
  id: string;
  campaign_id: string;
  influencer_id: string;
  message?: string | null;
  bid_amount?: number | null;
  status: 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
  created_at?: string;
  updated_at?: string;
}

export interface ICartItem {
  id: string;
  brand_id: string;
  influencer_id: string;
  campaign_id?: string | null;
  price: number;
  added_at?: string;
  created_at?: string;
}

export interface ITransaction {
  id: string;
  brand_id: string;
  influencer_id: string;
  campaign_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string | null;
  transaction_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IMembership {
  id: string;
  user_id: string;
  tier: 'regular' | 'silver' | 'gold';
  status: 'active' | 'expired' | 'cancelled';
  starts_at: string;
  ends_at?: string | null;
  auto_renew: boolean;
  payment_id?: string | null;
  razorpay_subscription_id?: string | null;
  created_at?: string;
}

export interface IMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at?: string;
}

export interface IConversation {
  id: string;
  participant_ids: string[];
  last_message_at?: string | null;
  created_at?: string;
}

export interface INotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  is_read: boolean;
  created_at?: string;
}

export type { AuthRequest } from '../middleware/auth';
