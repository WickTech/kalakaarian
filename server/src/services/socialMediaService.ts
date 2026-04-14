export interface InstagramPost {
  postId: string;
  url: string;
  thumbnail: string;
  caption: string;
}

export interface YouTubeVideo {
  videoId: string;
  url: string;
  thumbnail: string;
  title: string;
  views: number;
  publishedAt: Date;
}

const INSTAGRAM_MOCK_POSTS: InstagramPost[] = [
  {
    postId: 'mock_1',
    url: 'https://instagram.com/p/mock1',
    thumbnail: 'https://via.placeholder.com/640x640',
    caption: 'Mock Instagram post #1',
  },
  {
    postId: 'mock_2',
    url: 'https://instagram.com/p/mock2',
    thumbnail: 'https://via.placeholder.com/640x640',
    caption: 'Mock Instagram post #2',
  },
  {
    postId: 'mock_3',
    url: 'https://instagram.com/p/mock3',
    thumbnail: 'https://via.placeholder.com/640x640',
    caption: 'Mock Instagram post #3',
  },
];

const YOUTUBE_MOCK_VIDEOS: YouTubeVideo[] = [
  {
    videoId: 'dQw4w9WgXcQ',
    url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://via.placeholder.com/1280x720',
    title: 'Mock YouTube Video #1',
    views: 1000000,
    publishedAt: new Date('2024-01-15'),
  },
  {
    videoId: 'abc123def456',
    url: 'https://youtube.com/watch?v=abc123def456',
    thumbnail: 'https://via.placeholder.com/1280x720',
    title: 'Mock YouTube Video #2',
    views: 500000,
    publishedAt: new Date('2024-02-20'),
  },
  {
    videoId: 'xyz789uvw012',
    url: 'https://youtube.com/watch?v=xyz789uvw012',
    thumbnail: 'https://via.placeholder.com/1280x720',
    title: 'Mock YouTube Video #3',
    views: 250000,
    publishedAt: new Date('2024-03-10'),
  },
];

function validateHandle(handle: string): boolean {
  if (!handle || handle.length < 1 || handle.length > 30) {
    return false;
  }
  return /^[a-zA-Z0-9._]+$/.test(handle);
}

function validateChannelId(channelId: string): boolean {
  if (!channelId || channelId.length < 1) {
    return false;
  }
  return true;
}

export async function getInstagramPosts(
  handle: string,
  limit: number = 10
): Promise<InstagramPost[]> {
  if (!validateHandle(handle)) {
    throw new Error(`Invalid Instagram handle: ${handle}`);
  }

  return INSTAGRAM_MOCK_POSTS.slice(0, limit);
}

export async function getYouTubeVideos(
  channelId: string,
  limit: number = 10
): Promise<YouTubeVideo[]> {
  if (!validateChannelId(channelId)) {
    throw new Error(`Invalid YouTube channel ID: ${channelId}`);
  }

  return YOUTUBE_MOCK_VIDEOS.slice(0, limit);
}

const YOUTUBE_CHANNEL_REGEX = /(?:channel\/|@)([a-zA-Z0-9_-]{22})/;
const YOUTUBE_SHORT_REGEX = /youtube\.com\/@([a-zA-Z0-9_-]+)/;

export function extractYouTubeChannelId(url: string): string | null {
  if (!url) {
    return null;
  }

  const channelMatch = url.match(YOUTUBE_CHANNEL_REGEX);
  if (channelMatch) {
    return channelMatch[1];
  }

  const shortMatch = url.match(YOUTUBE_SHORT_REGEX);
  if (shortMatch) {
    return `@${shortMatch[1]}`;
  }

  return null;
}