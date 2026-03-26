const API_BASE_URL = import.meta.env.VITE_API_URL || "https://kalakaarian-production.up.railway.app";

export interface User {
  _id: string;
  email: string;
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
  niche: string;
  budget: number;
  deadline: string;
  status: "DRAFT" | "OPEN" | "IN_PROGRESS" | "COMPLETED";
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
  name: string;
  bio: string;
  niches: string[];
  instagramHandle?: string;
  youtubeHandle?: string;
  tiktokHandle?: string;
  twitterHandle?: string;
  followers: {
    instagram: number;
    youtube: number;
    tiktok?: number;
    twitter?: number;
    total: number;
  };
}

export interface UpdateInfluencerProfileData {
  name?: string;
  bio?: string;
  niches?: string[];
  instagramHandle?: string;
  youtubeHandle?: string;
  tiktokHandle?: string;
  twitterHandle?: string;
  followers?: {
    instagram?: number;
    youtube?: number;
    tiktok?: number;
    twitter?: number;
  };
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
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  offeredAmount: number;
  message?: string;
  timeline?: string;
  createdAt: string;
}

export interface SubmitProposalData {
  campaignId: string;
  offeredAmount: number;
  message: string;
  timeline: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: "brand" | "influencer";
  brandName?: string;
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
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (data: RegisterData): Promise<LoginResponse> => {
    return request<LoginResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getCurrentUser: async (): Promise<User> => {
    return request<User>("/api/auth/me");
  },

  getBrandProfile: async (): Promise<BrandProfile> => {
    return request<BrandProfile>("/api/brand/profile");
  },

  getCampaigns: async (): Promise<Campaign[]> => {
    return request<Campaign[]>("/api/brand/campaigns");
  },

  createCampaign: async (data: Partial<Campaign>): Promise<Campaign> => {
    return request<Campaign>("/api/brand/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getInfluencerProfile: async (): Promise<InfluencerProfile> => {
    return request<InfluencerProfile>("/api/influencer/profile");
  },

  getProposals: async (): Promise<Proposal[]> => {
    return request<Proposal[]>("/api/influencer/proposals");
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

  submitProposal: async (data: SubmitProposalData): Promise<Proposal> => {
    return request<Proposal>("/api/influencer/proposals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMyProposalForCampaign: async (campaignId: string): Promise<Proposal | null> => {
    return request<Proposal>(`/api/influencer/proposals/campaign/${campaignId}`);
  },

  updateInfluencerProfile: async (data: UpdateInfluencerProfileData): Promise<InfluencerProfile> => {
    return request<InfluencerProfile>("/api/influencer/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  updateBrandProfile: async (data: UpdateBrandProfileData): Promise<BrandProfile> => {
    return request<BrandProfile>("/api/brand/profile", {
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
};

export { ApiError };
