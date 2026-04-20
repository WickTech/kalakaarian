import axios from 'axios';

export interface YouTubeVideo {
  videoId: string; url: string; thumbnail: string; title: string;
  views: number; likes: number; publishedAt: Date;
}
export interface YouTubeStats {
  handle: string; channelId: string; subscribers: number; videos: number;
  totalViews: number; avgViews: number; isMock: boolean;
}

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

function generateMockStats(channelId: string): YouTubeStats {
  const baseSubscribers = Math.floor(Math.random() * 500000) + 50000;
  return {
    handle: channelId, channelId, subscribers: baseSubscribers,
    videos: Math.floor(Math.random() * 200) + 20,
    totalViews: baseSubscribers * Math.floor(Math.random() * 100 + 50),
    avgViews: baseSubscribers * Math.floor(Math.random() * 10 + 5), isMock: true,
  };
}

function generateMockVideos(limit: number): YouTubeVideo[] {
  return Array.from({ length: limit }, (_, i) => {
    const views = Math.floor(Math.random() * 100000) + 10000;
    return {
      videoId: `mock_${i}`, url: `https://youtube.com/watch?v=mock${i}`,
      thumbnail: `https://picsum.photos/seed/video${i}/1280/720`,
      title: `Mock YouTube Video #${i + 1}`, views, likes: Math.floor(views * 0.05),
      publishedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    };
  });
}

async function resolveChannelId(channelId: string): Promise<string> {
  if (!YOUTUBE_API_KEY) return channelId;
  if (channelId.startsWith('@')) {
    const { data } = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet', forHandle: channelId, key: YOUTUBE_API_KEY },
    });
    return data.items?.[0]?.id || channelId;
  }
  if (!channelId.startsWith('UC')) {
    const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', q: channelId, type: 'channel', key: YOUTUBE_API_KEY },
    });
    return data.items?.[0]?.id?.channelId || channelId;
  }
  return channelId;
}

async function getUploadsPlaylistId(channelId: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) return null;
  try {
    const { data } = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'contentDetails', id: channelId, key: YOUTUBE_API_KEY },
    });
    return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
  } catch (error) { console.error('Error getting uploads playlist:', error); return null; }
}

export async function getYouTubeStats(channelId: string): Promise<YouTubeStats> {
  if (!channelId) throw new Error('Channel ID is required');
  if (YOUTUBE_API_KEY) {
    try {
      const id = await resolveChannelId(channelId);
      const { data } = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: { part: 'snippet,statistics', id, key: YOUTUBE_API_KEY },
      });
      if (data.items?.length > 0) {
        const { snippet, statistics, id: cid } = data.items[0];
        return {
          handle: snippet.title, channelId: cid,
          subscribers: parseInt(statistics.subscriberCount) || 0,
          videos: parseInt(statistics.videoCount) || 0,
          totalViews: parseInt(statistics.viewCount) || 0,
          avgViews: parseInt(statistics.viewCount) / (parseInt(statistics.videoCount) || 1),
          isMock: false,
        };
      }
    } catch (error) { console.error('YouTube API error:', error); }
  }
  return generateMockStats(channelId);
}

export async function getYouTubeVideos(channelId: string, limit = 10): Promise<YouTubeVideo[]> {
  if (!channelId) throw new Error('Channel ID is required');
  if (YOUTUBE_API_KEY) {
    try {
      const id = await resolveChannelId(channelId);
      const playlistId = await getUploadsPlaylistId(id);
      if (playlistId) {
        const { data } = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
          params: { part: 'snippet,contentDetails', playlistId, maxResults: limit, key: YOUTUBE_API_KEY },
        });
        return data.items.map((item: any) => ({
          videoId: item.contentDetails.videoId,
          url: `https://youtube.com/watch?v=${item.contentDetails.videoId}`,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || '',
          title: item.snippet.title, views: 0, likes: 0, publishedAt: item.snippet.publishedAt,
        }));
      }
    } catch (error) { console.error('YouTube videos API error:', error); }
  }
  return generateMockVideos(limit);
}

export function extractYouTubeChannelId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]{22})/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return url.startsWith('@') ? url : null;
}
