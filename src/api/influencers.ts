import { api } from "./axios";
import { Influencer } from "@/lib/store";

export interface InfluencerFilters {
  platform?: "instagram" | "youtube";
  tier?: "nano" | "micro" | "macro" | "celebrity";
  genre?: string;
  city?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface InfluencersResponse {
  influencers: Influencer[];
  total: number;
  page: number;
  limit: number;
}

export interface InfluencerDetailResponse {
  influencer: Influencer;
}

export const influencersAPI = {
  getAll: async (
    filters?: InfluencerFilters,
    page = 1,
    limit = 20
  ): Promise<InfluencersResponse> => {
    const response = await api.get<InfluencersResponse>("/influencers", {
      params: { ...filters, page, limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<InfluencerDetailResponse> => {
    const response = await api.get<InfluencerDetailResponse>(`/influencers/${id}`);
    return response.data;
  },

  getFeatured: async (limit = 10): Promise<{ influencers: Influencer[] }> => {
    const response = await api.get<{ influencers: Influencer[] }>("/influencers/featured", {
      params: { limit },
    });
    return response.data;
  },

  getByCategory: async (category: string): Promise<InfluencersResponse> => {
    const response = await api.get<InfluencersResponse>(`/influencers/category/${category}`);
    return response.data;
  },

  search: async (query: string): Promise<{ influencers: Influencer[] }> => {
    const response = await api.get<{ influencers: Influencer[] }>("/influencers/search", {
      params: { q: query },
    });
    return response.data;
  },

  getStats: async (id: string): Promise<{ stats: InfluencerStats }> => {
    const response = await api.get<{ stats: InfluencerStats }>(`/influencers/${id}/stats`);
    return response.data;
  },
};

export interface InfluencerStats {
  avgEngagement: number;
  totalCampaigns: number;
  successRate: number;
  avgROI: number;
}
