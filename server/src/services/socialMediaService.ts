// Re-exports for backward compatibility — logic lives in instagramService.ts and youtubeService.ts
export type { InstagramPost, InstagramStats } from './instagramService';
export type { YouTubeVideo, YouTubeStats } from './youtubeService';
export { getInstagramStats, getInstagramPosts } from './instagramService';
export { getYouTubeStats, getYouTubeVideos, extractYouTubeChannelId } from './youtubeService';
