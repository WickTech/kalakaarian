// Domain types for the influencers module. No Express types here.

export interface InfluencerListQuery {
  tier?: string;
  city?: string;
  gender?: string;
  genre?: string | string[];
  platform?: string | string[];
  q?: string;
  name?: string;
  page?: string | number;
  limit?: string | number;
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  city?: string;
  state?: string;
  gender?: string;
  niches?: string[];
  platform?: string[];
  tier?: string;
  pricing?: Record<string, unknown>;
  portfolio?: unknown[];
  instagramPosts?: unknown;
  youtubeVideos?: unknown;
  socialHandles?: { instagram?: string; youtube?: string };
  instagramHandle?: string;
  youtubeHandle?: string;
  username?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
