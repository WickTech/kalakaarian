const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_BASE_URL = RAW_API_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");

export interface User {
  id: string;
  email?: string;
  username?: string;
  phone?: string;
  role: "brand" | "influencer";
  name?: string;
  brandName?: string;
}

export interface BrandProfile {
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  industry: string;
  description?: string;
  website?: string;
  logo?: string;
}

export interface Campaign {
  id: string;
  brandId: string;
  title: string;
  description: string;
  genre: string;
  budget: number;
  deadline: string;
  status: "open" | "closed" | "archived";
  createdAt: string;
  deliverables?: string;
  platform?: string;
  brandName?: string;
}

export interface CampaignFilters {
  niche?: string;
  minBudget?: number;
  maxBudget?: number;
}

export interface InfluencerProfile {
  _id?: string;
  id?: string;
  name?: string;
  bio?: string;
  niches?: string[];
  city?: string;
  tier?: 'nano' | 'micro' | 'macro' | 'mega';
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  platform?: string[];
  socialHandles?: {
    instagram?: string;
    youtube?: string;
  };
  profileImage?: string;
  verified?: boolean;
  isOnline?: boolean;
  lastSeenAt?: string;
  followerCount?: number;
  instagramPosts?: Array<{ url: string; thumbnail?: string; caption?: string }>;
  youtubeVideos?: Array<{ url: string; thumbnail?: string; title?: string }>;
}

export interface UpdateInfluencerProfileData {
  name?: string;
  bio?: string;
  city?: string;
  niches?: string[];
  platform?: string[];
  tier?: string;
  socialHandles?: {
    instagram?: string;
    youtube?: string;
  };
  engagementRate?: number;
  instagramPosts?: Array<{ url: string; thumbnail?: string; caption?: string }>;
  youtubeVideos?: Array<{ url: string; thumbnail?: string; title?: string }>;
}

export interface UpdateBrandProfileData {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  industry?: string;
  website?: string;
  description?: string;
}

export interface Proposal {
  _id: string;
  campaignId: string;
  influencerId: string;
  campaignTitle: string;
  influencerName: string;
  status: "submitted" | "accepted" | "rejected";
  bidAmount: number;
  message?: string;
  createdAt: string;
}

export interface InfluencerSearchFilters {
  tier?: string;
  genre?: string;
  platform?: string;
  city?: string;
  minFollowers?: number;
  maxFollowers?: number;
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
}

export interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}
export interface Message {
  _id: string;
  senderId: string;
  receiverId?: string;
  content: string;
  read: boolean;
  createdAt: string;
}
export interface Conversation {
  _id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount?: number;
}
export interface BrandAnalytics {
  campaigns: { total: number; open: number; inProgress: number; completed: number };
  proposals: { total: number; accepted: number; pending: number; rejected: number };
  spend: number;
}
export interface InfluencerAnalytics {
  totalProposals: number;
  acceptedProposals: number;
  totalEarnings?: number;
  completedCampaigns?: number;
  views?: number;
}
export interface CartItem {
  influencerId: string | InfluencerProfile;
  price: number;
  campaignId?: string;
}
export interface Cart {
  _id?: string;
  userId?: string;
  items: CartItem[];
}
export interface VideoItem {
  _id: string;
  url: string;
  platform: string;
  thumbnail?: string;
  title?: string;
  campaignId?: string;
  createdAt?: string;
}
export interface CampaignFile {
  _id: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
}
export interface CampaignWorkflow {
  campaignId: string;
  stage: string;
  videos?: Array<{ url: string; status: string; feedback?: string }>;
  updatedAt?: string;
}
export interface AppNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
}
export interface SocialStats {
  instagram?: { followers: number; following: number; posts: number; engagementRate?: number };
  youtube?: { subscribers: number; videos: number; totalViews?: number };
}
export interface SocialPost {
  url: string;
  thumbnail?: string;
  caption?: string;
  title?: string;
  likes?: number;
  views?: number;
}
export interface WhatsAppStatus {
  enabled: boolean;
  preferences?: { campaigns: boolean; proposals: boolean; messages: boolean; payments?: boolean };
}

export interface RegisterData {
  email?: string;
  username?: string;
  phone?: string;
  password: string;
  name: string;
  role: "brand" | "influencer";
  companyName?: string;
  industry?: string;
  city?: string;
  niches?: string[];
  platform?: string[];
  tier?: string;
  bio?: string;
  socialHandles?: {
    instagram?: string;
    youtube?: string;
  };
  profileImage?: string;
  pricing?: {
    reelRate?: number;
    storyRate?: number;
    longVideoRate?: number;
    shortsRate?: number;
    reel?: number;
    story?: number;
    video?: number;
    post?: number;
  };
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("kalakariaan_token");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "An error occurred" }));
    throw new ApiError(response.status, errorData.message || "Request failed");
  }

  return response.json();
}

export const api = {
  login: async (emailOrUsername: string, password: string): Promise<LoginResponse> => {
    return request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: emailOrUsername, password }),
    });
  },

  loginWithPhone: async (phone: string): Promise<{ message: string; phone: string }> => {
    return request<{ message: string; phone: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, isPhoneLogin: true }),
    });
  },

  verifyPhoneOTP: async (phone: string, otp: string): Promise<LoginResponse> => {
    return request<LoginResponse>("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    });
  },

  sendOTP: async (phone: string): Promise<{ message: string; phone: string }> => {
    return request<{ message: string; phone: string }>("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },

  register: async (data: RegisterData): Promise<LoginResponse> => {
    return request<LoginResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await request<{ user: User; profile: unknown }>("/api/auth/profile");
    return res.user;
  },

  getBrandProfile: async (): Promise<BrandProfile> => {
    const res = await request<{ user: unknown; profile: BrandProfile }>("/api/auth/profile");
    return res.profile;
  },

  getCampaigns: async (): Promise<Campaign[]> => {
    const res = await request<{ campaigns: Campaign[] }>("/api/campaigns");
    return res.campaigns;
  },

  updateCampaign: async (id: string, data: Partial<Campaign>): Promise<Campaign> => {
    return request<Campaign>(`/api/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteCampaign: async (id: string): Promise<void> => {
    return request<void>(`/api/campaigns/${id}`, {
      method: "DELETE",
    });
  },

  createCampaign: async (data: Partial<Campaign>): Promise<Campaign> => {
    return request<Campaign>("/api/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getInfluencerProfile: async (): Promise<InfluencerProfile> => {
    const response = await request<{ influencer: InfluencerProfile }>("/api/influencers/profile");
    return response.influencer;
  },

  getProposals: async (): Promise<Proposal[]> => {
    const res = await request<{ proposals: Proposal[] }>("/api/proposals/my");
    return res.proposals;
  },

  getOpenCampaigns: async (filters?: CampaignFilters): Promise<Campaign[]> => {
    const params = new URLSearchParams();
    if (filters?.niche) params.append("niche", filters.niche);
    if (filters?.minBudget) params.append("minBudget", filters.minBudget.toString());
    if (filters?.maxBudget) params.append("maxBudget", filters.maxBudget.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await request<{ campaigns: Campaign[] }>(`/api/campaigns/open${query}`);
    return res.campaigns;
  },

  getCampaignById: async (id: string): Promise<Campaign> => {
    const res = await request<{ campaign: Campaign }>(`/api/campaigns/${id}`);
    return res.campaign;
  },

  submitProposal: async (campaignId: string, message: string, bidAmount: number): Promise<Proposal> => {
    return request<Proposal>(`/api/campaigns/${campaignId}/proposals`, {
      method: "POST",
      body: JSON.stringify({ message, bidAmount }),
    });
  },

  getMyProposalForCampaign: async (campaignId: string): Promise<Proposal | null> => {
    return request<Proposal>(`/api/campaigns/${campaignId}/proposals/my`);
  },

  getProposalsForCampaign: async (campaignId: string): Promise<Proposal[]> => {
    const res = await request<{ proposals: Proposal[] }>(`/api/campaigns/${campaignId}/proposals`);
    return res.proposals;
  },

  respondToProposal: async (proposalId: string, status: "accepted" | "rejected"): Promise<Proposal> => {
    return request<Proposal>(`/api/proposals/${proposalId}/respond`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  },

  updateInfluencerProfile: async (data: UpdateInfluencerProfileData): Promise<InfluencerProfile> => {
    return request<InfluencerProfile>("/api/influencers/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  updateBrandProfile: async (data: UpdateBrandProfileData): Promise<BrandProfile> => {
    return request<BrandProfile>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  googleLogin: async (googleToken: string): Promise<LoginResponse> => {
    return request<LoginResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ token: googleToken }),
    });
  },

  searchInfluencers: async (filters?: InfluencerSearchFilters): Promise<InfluencerProfile[]> => {
    const params = new URLSearchParams();
    // Always request the server maximum so client-side filters see the full dataset
    params.append("limit", "100");
    if (filters?.tier) params.append("tier", filters.tier);
    if (filters?.genre) params.append("genre", filters.genre);
    if (filters?.platform) params.append("platform", filters.platform);
    if (filters?.city) params.append("city", filters.city);
    if (filters?.minFollowers) params.append("minFollowers", filters.minFollowers.toString());
    if (filters?.maxFollowers) params.append("maxFollowers", filters.maxFollowers.toString());
    if (filters?.gender) params.append("gender", filters.gender);
    const query = `?${params.toString()}`;
    const response = await request<{ influencers: InfluencerProfile[]; pagination: Pagination }>(`/api/influencers${query}`);
    return response.influencers || response as unknown as InfluencerProfile[];
  },

  getTierCounts: async (): Promise<Record<string, number>> => {
    return request<Record<string, number>>("/api/influencers/tier-counts");
  },

  getInfluencerById: async (id: string): Promise<InfluencerProfile> => {
    const response = await request<{ influencer: InfluencerProfile } | InfluencerProfile>(`/api/influencers/${id}`);
    if (response && typeof response === 'object' && 'influencer' in response) {
      return (response as { influencer: InfluencerProfile }).influencer;
    }
    return response;
  },

  sendMessage: async (receiverId: string, content: string): Promise<Message> => {
    return request<Message>("/api/messages/send", {
      method: "POST",
      body: JSON.stringify({ receiverId, content }),
    });
  },

  getConversations: async (): Promise<Conversation[]> => {
    return request<Conversation[]>("/api/messages/conversations");
  },

  getMessages: async (conversationId: string): Promise<{ messages: Message[]; conversation?: Conversation }> => {
    return request<{ messages: Message[]; conversation?: Conversation }>(`/api/messages/conversations/${conversationId}`);
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    return request<void>(`/api/messages/conversations/${conversationId}/read`, {
      method: "PUT",
    });
  },

  getBrandAnalytics: async (): Promise<BrandAnalytics> => {
    return request<BrandAnalytics>("/api/analytics/brand");
  },

  getInfluencerAnalytics: async (): Promise<InfluencerAnalytics> => {
    return request<InfluencerAnalytics>("/api/analytics/influencer");
  },

  // Cart
  getCart: async (): Promise<Cart> => {
    return request<Cart>("/api/cart");
  },

  addToCart: async (influencerId: string, price: number, campaignId?: string): Promise<Cart> => {
    return request<Cart>("/api/cart/add", {
      method: "POST",
      body: JSON.stringify({ influencerId, price, campaignId }),
    });
  },

  removeFromCart: async (influencerId: string): Promise<Cart> => {
    return request<Cart>(`/api/cart/remove/${influencerId}`, {
      method: "DELETE",
    });
  },

  clearCart: async (): Promise<Cart> => {
    return request<Cart>("/api/cart/clear", {
      method: "DELETE",
    });
  },

  cartCheckout: async (): Promise<{ orderId: string | null; amount: number; currency: string; keyId: string | null }> => {
    return request('/api/cart/checkout', { method: 'POST' });
  },

  updateCartItem: async (influencerId: string, campaignId: string, price: number): Promise<Cart> => {
    return request<Cart>(`/api/cart/update/${influencerId}`, {
      method: "PUT",
      body: JSON.stringify({ campaignId, price }),
    });
  },

  getMembershipStatus: async (): Promise<{ tier: string; endDate?: string }> => {
    return request<{ tier: string; endDate?: string }>('/api/membership/status');
  },

  createMembershipOrder: async (tier: string): Promise<{ orderId: string | null; amount: number; currency: string; keyId: string | null }> => {
    return request('/api/membership/order', { method: 'POST', body: JSON.stringify({ tier }) });
  },

  purchaseMembership: async (
    tier: string,
    payment?: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
  ): Promise<{ tier: string; endDate?: string }> => {
    return request<{ tier: string; endDate?: string }>('/api/membership/purchase', {
      method: 'POST',
      body: JSON.stringify({ tier, ...payment }),
    });
  },

  getUploadUrl: async (fileName: string, contentType: string, purpose: 'profile' | 'campaign' | 'video'): Promise<{ uploadUrl: string; fileUrl: string; key: string }> => {
    return request('/api/upload/presign', {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType, purpose }),
    });
  },

  cancelMembership: async (): Promise<void> => {
    return request<void>('/api/membership/cancel', { method: 'PUT' });
  },

  getMyVideos: async (): Promise<VideoItem[]> => {
    return request<VideoItem[]>('/api/videos/my');
  },

  uploadVideo: async (videoUrl: string, platform: string, campaignId?: string): Promise<VideoItem> => {
    return request<VideoItem>('/api/videos', {
      method: 'POST',
      body: JSON.stringify({ videoUrl, platform, campaignId }),
    });
  },

  // Campaign Files
  getCampaignFiles: async (campaignId: string): Promise<CampaignFile[]> => {
    return request<CampaignFile[]>(`/api/campaigns/${campaignId}/files`);
  },

  uploadCampaignFile: async (campaignId: string, fileUrl: string, fileName: string, fileType: string): Promise<CampaignFile> => {
    return request<CampaignFile>(`/api/campaigns/${campaignId}/files`, {
      method: 'POST',
      body: JSON.stringify({ fileUrl, fileName, fileType }),
    });
  },

  deleteCampaignFile: async (campaignId: string, fileId: string): Promise<void> => {
    return request<void>(`/api/campaigns/${campaignId}/files/${fileId}`, {
      method: 'DELETE',
    });
  },

  // Campaign Workflow
  getCampaignWorkflow: async (campaignId: string): Promise<CampaignWorkflow> => {
    return request<CampaignWorkflow>(`/api/campaigns/${campaignId}/workflow`);
  },

  updateWorkflowStage: async (campaignId: string, stage: string): Promise<CampaignWorkflow> => {
    return request<CampaignWorkflow>(`/api/campaigns/${campaignId}/workflow/stage`, {
      method: 'PUT',
      body: JSON.stringify({ stage }),
    });
  },

  updateVideoStatus: async (campaignId: string, videoIndex: number, status: string, feedback?: string): Promise<CampaignWorkflow> => {
    return request<CampaignWorkflow>(`/api/campaigns/${campaignId}/videos/${videoIndex}`, {
      method: 'PUT',
      body: JSON.stringify({ status, feedback }),
    });
  },

  getNotifications: async (): Promise<AppNotification[]> => {
    return request<AppNotification[]>('/api/notifications');
  },

  getUnreadNotificationCount: async (): Promise<{ count: number }> => {
    return request<{ count: number }>('/api/notifications/unread-count');
  },

  markNotificationRead: async (id: string): Promise<void> => {
    return request<void>(`/api/notifications/${id}/read`, { method: 'PUT' });
  },

  markAllNotificationsRead: async (): Promise<void> => {
    return request<void>('/api/notifications/read-all', { method: 'PUT' });
  },

  deleteNotification: async (id: string): Promise<void> => {
    return request<void>(`/api/notifications/${id}`, { method: 'DELETE' });
  },

  updatePresence: async (isOnline: boolean): Promise<void> => {
    return request<void>('/api/influencers/presence', {
      method: 'PUT',
      body: JSON.stringify({ isOnline }),
    });
  },

  connectSocialMedia: async (platform: 'instagram' | 'youtube', handle: string): Promise<{ message: string }> => {
    return request<{ message: string }>('/api/influencers/connect-social', {
      method: 'POST',
      body: JSON.stringify({ platform, handle }),
    });
  },

  // WhatsApp
  getWhatsAppStatus: async (): Promise<WhatsAppStatus> => {
    return request<WhatsAppStatus>('/api/whatsapp/status');
  },

  updateWhatsAppPreferences: async (preferences: {
    enabled?: boolean;
    campaigns?: boolean;
    proposals?: boolean;
    messages?: boolean;
    payments?: boolean;
  }): Promise<void> => {
    return request<void>('/api/whatsapp/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },

  sendWhatsAppTest: async (): Promise<void> => {
    return request<void>('/api/whatsapp/send-test', {
      method: 'POST',
    });
  },

  // Social Stats
  getSocialStats: async (userId: string): Promise<SocialStats> => {
    return request<SocialStats>(`/api/social/stats/${userId}`);
  },

  getInstagramPosts: async (handle: string, limit?: number): Promise<SocialPost[]> => {
    const params = limit ? `?limit=${limit}` : '';
    return request<SocialPost[]>(`/api/social/instagram/${handle}/posts${params}`);
  },

  getYouTubeVideos: async (channelId: string, limit?: number): Promise<SocialPost[]> => {
    const params = limit ? `?limit=${limit}` : '';
    return request<SocialPost[]>(`/api/social/youtube/${channelId}/videos${params}`);
  },

  getInstagramStats: async (handle: string): Promise<SocialStats> => {
    return request<SocialStats>(`/api/social/instagram/stats/${handle}`);
  },

  getYouTubeStats: async (channelId: string): Promise<SocialStats> => {
    return request<SocialStats>(`/api/social/youtube/stats/${channelId}`);
  },

  // Feed
  getFeed: async (params?: { page?: number; limit?: number; tier?: string; genre?: string }): Promise<{
    posts: object[];
    total: number;
    page: number;
    pages: number;
  }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.tier) q.set('tier', params.tier);
    if (params?.genre) q.set('genre', params.genre);
    return request(`/api/feed?${q.toString()}`);
  },

  // Contact
  submitContact: async (data: {
    name: string;
    email?: string;
    phone?: string;
    message: string;
    type?: 'general' | 'callback' | 'business';
  }): Promise<{ message: string }> => {
    return request<{ message: string }>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export { ApiError };
