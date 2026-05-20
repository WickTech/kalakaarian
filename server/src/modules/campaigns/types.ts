import type { ICampaign } from '../../types';

export type Campaign = ICampaign;

export interface ListCampaignsQuery {
  status?: string;
  genre?: string | string[];
  platform?: string | string[];
  page?: string | number;
  limit?: string | number;
}

export interface CreateCampaignInput {
  title: string;
  description?: string;
  genre?: string[];
  platform?: string[];
  budget?: number | null;
  deadline?: string | null;
  requirements?: string;
}

export interface UpdateCampaignInput {
  title?: string;
  description?: string;
  genre?: string[];
  platform?: string[];
  budget?: number | null;
  deadline?: string | null;
  requirements?: string;
  status?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
