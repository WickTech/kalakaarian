import { api } from "./axios";
import { Influencer } from "@/lib/store";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  brandId: string;
  brandName: string;
  budget: number;
  deadline: string;
  status: "draft" | "active" | "completed" | "cancelled";
  selectedInfluencers: string[];
  deliverables: Deliverable[];
  createdAt: string;
  updatedAt: string;
}

export interface Deliverable {
  id: string;
  type: "post" | "story" | "reel" | "video";
  platform: "instagram" | "youtube";
  description: string;
  deadline?: string;
  status: "pending" | "submitted" | "approved" | "revision_requested";
  submittedContent?: string;
  approvedAt?: string;
}

export interface CampaignFilters {
  status?: Campaign["status"];
  brandId?: string;
  influencerId?: string;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCampaignData {
  title: string;
  description: string;
  budget: number;
  deadline: string;
  selectedInfluencers: string[];
  deliverables: Omit<Deliverable, "id" | "status">[];
}

export interface UpdateCampaignData {
  title?: string;
  description?: string;
  budget?: number;
  deadline?: string;
  status?: Campaign["status"];
  selectedInfluencers?: string[];
  deliverables?: Omit<Deliverable, "id" | "status">[];
}

export const campaignsAPI = {
  getAll: async (
    filters?: CampaignFilters,
    page = 1,
    limit = 20
  ): Promise<CampaignsResponse> => {
    const response = await api.get<CampaignsResponse>("/campaigns", {
      params: { ...filters, page, limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<{ campaign: Campaign }> => {
    const response = await api.get<{ campaign: Campaign }>(`/campaigns/${id}`);
    return response.data;
  },

  getMyCampaigns: async (
    page = 1,
    limit = 20
  ): Promise<CampaignsResponse> => {
    const response = await api.get<CampaignsResponse>("/campaigns/my-campaigns", {
      params: { page, limit },
    });
    return response.data;
  },

  create: async (data: CreateCampaignData): Promise<{ campaign: Campaign }> => {
    const response = await api.post<{ campaign: Campaign }>("/campaigns", data);
    return response.data;
  },

  update: async (id: string, data: UpdateCampaignData): Promise<{ campaign: Campaign }> => {
    const response = await api.patch<{ campaign: Campaign }>(`/campaigns/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/campaigns/${id}`);
  },

  addInfluencer: async (campaignId: string, influencerId: string): Promise<void> => {
    await api.post(`/campaigns/${campaignId}/influencers`, { influencerId });
  },

  removeInfluencer: async (campaignId: string, influencerId: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/influencers/${influencerId}`);
  },

  submitDeliverable: async (
    campaignId: string,
    deliverableId: string,
    content: string
  ): Promise<void> => {
    await api.post(`/campaigns/${campaignId}/deliverables/${deliverableId}/submit`, {
      content,
    });
  },

  approveDeliverable: async (
    campaignId: string,
    deliverableId: string
  ): Promise<void> => {
    await api.post(`/campaigns/${campaignId}/deliverables/${deliverableId}/approve`);
  },
};
