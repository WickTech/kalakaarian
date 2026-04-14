const API_BASE_URL = import.meta.env.VITE_API_URL || "https://kalakaarian-server.vercel.app";

export interface User {
  _id: string;
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
  _id: string;
  brandId: string;
  title: string;
  description: string;
  genre: string;
  budget: number;
  deadline: string;
  status: "draft" | "open" | "in_progress" | "completed" | "cancelled";
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
  _id: string;
  id?: string;
  name?: string;
  bio?: string;
  niches?: string[];
  city?: string;
  tier?: string;
  platform?: string[];
  socialHandles?: {
    instagram?: string;
    youtube?: string;
  };
  profileImage?: string;
  verified?: boolean;
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
  followers?: {
    instagram?: number;
    youtube?: number;
    total?: number;
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
  status: "pending" | "accepted" | "rejected";
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
  const token = localStorage.getItem("token");
  
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
    return request<User>("/api/auth/profile");
  },

  getBrandProfile: async (): Promise<BrandProfile> => {
    return request<BrandProfile>("/api/auth/profile");
  },

  getCampaigns: async (): Promise<Campaign[]> => {
    return request<Campaign[]>("/api/campaigns");
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
    return request<InfluencerProfile>("/api/influencers/profile");
  },

  getProposals: async (): Promise<Proposal[]> => {
    return request<Proposal[]>("/api/proposals/my");
  },

  getOpenCampaigns: async (filters?: CampaignFilters): Promise<Campaign[]> => {
    const params = new URLSearchParams();
    if (filters?.niche) params.append("niche", filters.niche);
    if (filters?.minBudget) params.append("minBudget", filters.minBudget.toString());
    if (filters?.maxBudget) params.append("maxBudget", filters.maxBudget.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<Campaign[]>(`/api/campaigns/open${query}`);
  },

  getCampaignById: async (id: string): Promise<Campaign> => {
    return request<Campaign>(`/api/campaigns/${id}`);
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
    return request<Proposal[]>(`/api/campaigns/${campaignId}/proposals`);
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
      body: JSON.stringify({ jwtToken: googleToken }),
    });
  },

  searchInfluencers: async (filters?: InfluencerSearchFilters): Promise<InfluencerProfile[]> => {
    const params = new URLSearchParams();
    if (filters?.tier) params.append("tier", filters.tier);
    if (filters?.genre) params.append("genre", filters.genre);
    if (filters?.platform) params.append("platform", filters.platform);
    if (filters?.city) params.append("city", filters.city);
    if (filters?.minFollowers) params.append("minFollowers", filters.minFollowers.toString());
    if (filters?.maxFollowers) params.append("maxFollowers", filters.maxFollowers.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<InfluencerProfile[]>(`/api/influencers${query}`);
  },

  getTierCounts: async (): Promise<Record<string, number>> => {
    return request<Record<string, number>>("/api/influencers/tier-counts");
  },

  getInfluencerById: async (id: string): Promise<InfluencerProfile> => {
    return request<InfluencerProfile>(`/api/influencers/${id}`);
  },

  sendMessage: async (receiverId: string, content: string): Promise<any> => {
    return request<any>("/api/messages/send", {
      method: "POST",
      body: JSON.stringify({ receiverId, content }),
    });
  },

  getConversations: async (): Promise<any[]> => {
    return request<any[]>("/api/messages/conversations");
  },

  getMessages: async (conversationId: string): Promise<any> => {
    return request<any>(`/api/messages/conversations/${conversationId}`);
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    return request<void>(`/api/messages/conversations/${conversationId}/read`, {
      method: "PUT",
    });
  },

  getBrandAnalytics: async (): Promise<any> => {
    return request<any>("/api/analytics/brand");
  },

  getInfluencerAnalytics: async (): Promise<any> => {
    return request<any>("/api/analytics/influencer");
  },
};

export { ApiError };
