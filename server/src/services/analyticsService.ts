import { InstagramStats, YouTubeStats } from './socialMediaService';

export interface InfluencerAnalytics {
  engagementRate: number;
  avgViews: number;
  costPerView: number;
  totalFollowers: number;
  avgLikes: number;
  avgComments: number;
  reachEstimate: number;
  authenticityScore: number;
  source: 'instagram' | 'youtube' | 'both';
}

export function calculateAnalytics(
  instagramStats?: InstagramStats | null,
  youtubeStats?: YouTubeStats | null
): InfluencerAnalytics {
  const defaultAnalytics: InfluencerAnalytics = {
    engagementRate: 0,
    avgViews: 0,
    costPerView: 0,
    totalFollowers: 0,
    avgLikes: 0,
    avgComments: 0,
    reachEstimate: 0,
    authenticityScore: 100,
    source: 'instagram',
  };

  if (!instagramStats && !youtubeStats) {
    return defaultAnalytics;
  }

  let totalFollowers = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalViews = 0;
  let engagementRate = 0;
  let source: 'instagram' | 'youtube' | 'both' = 'instagram';

  if (instagramStats && youtubeStats) {
    source = 'both';
    totalFollowers = instagramStats.followers + youtubeStats.subscribers;
    
    const igEngagement = instagramStats.avgLikes + instagramStats.avgComments;
    const ytViews = youtubeStats.avgViews;
    
    totalLikes = instagramStats.avgLikes;
    totalComments = instagramStats.avgComments;
    totalViews = ytViews;
    
    engagementRate = ((igEngagement / instagramStats.followers) * 100 + 
                     (ytViews / youtubeStats.subscribers) * 100) / 2;
    
    const avgViews = (instagramStats.avgLikes + ytViews) / 2;
    
    return {
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      avgViews: Math.round(avgViews),
      costPerView: 0,
      totalFollowers,
      avgLikes: Math.round(totalLikes),
      avgComments: Math.round(totalComments),
      reachEstimate: Math.round(totalFollowers * 0.3),
      authenticityScore: instagramStats.isMock || youtubeStats.isMock ? 85 : 95,
      source,
    };
  }

  if (instagramStats) {
    source = 'instagram';
    totalFollowers = instagramStats.followers;
    totalLikes = instagramStats.avgLikes;
    totalComments = instagramStats.avgComments;
    
    engagementRate = ((totalLikes + totalComments) / instagramStats.followers) * 100;
    
    return {
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      avgViews: Math.round(instagramStats.avgLikes * 10),
      costPerView: 0,
      totalFollowers,
      avgLikes: Math.round(totalLikes),
      avgComments: Math.round(totalComments),
      reachEstimate: Math.round(totalFollowers * 0.3),
      authenticityScore: instagramStats.isMock ? 85 : 95,
      source,
    };
  }

  if (youtubeStats) {
    source = 'youtube';
    totalFollowers = youtubeStats.subscribers;
    totalViews = youtubeStats.avgViews;
    
    engagementRate = (totalViews / youtubeStats.subscribers) * 100;
    
    return {
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      avgViews: Math.round(totalViews),
      costPerView: 0,
      totalFollowers,
      avgLikes: 0,
      avgComments: 0,
      reachEstimate: Math.round(totalViews * 0.4),
      authenticityScore: youtubeStats.isMock ? 85 : 95,
      source,
    };
  }

  return defaultAnalytics;
}

export function calculateCostPerView(
  analytics: InfluencerAnalytics,
  basePrice: number
): number {
  if (analytics.avgViews === 0) return 0;
  return parseFloat((basePrice / analytics.avgViews).toFixed(3));
}

export function getTierFromFollowers(followers: number): {
  tier: 'nano' | 'micro' | 'macro' | 'celeb';
  label: string;
} {
  if (followers >= 3000000) return { tier: 'celeb', label: 'Celebrity' };
  if (followers >= 200000) return { tier: 'macro', label: 'Macro Influencer' };
  if (followers >= 21000) return { tier: 'micro', label: 'Micro Influencer' };
  return { tier: 'nano', label: 'Nano Influencer' };
}

export function getEngagementRating(er: number): {
  rating: 'excellent' | 'good' | 'average' | 'low';
  color: string;
} {
  if (er >= 6) return { rating: 'excellent', color: 'text-green-500' };
  if (er >= 3) return { rating: 'good', color: 'text-blue-500' };
  if (er >= 1) return { rating: 'average', color: 'text-yellow-500' };
  return { rating: 'low', color: 'text-red-500' };
}
