import { adminClient } from '../config/supabase';
import crypto from 'crypto';

const FB_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const IG_APP_ID = '936619743392459';

interface IgData {
  picUrl: string | null;
  followerCount: number | null;
}

async function fetchOgImageUrl(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/`, {
      headers: { 'User-Agent': FB_UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Match either attribute ordering with any intervening attrs
    const m =
      html.match(/property="og:image"[^>]*?content="([^"]+)"/) ??
      html.match(/content="([^"]+)"[^>]*?property="og:image"/);
    return m ? m[1].replace(/&amp;/g, '&') : null;
  } catch {
    return null;
  }
}

async function fetchSessionApiData(handle: string): Promise<IgData> {
  const sid = process.env.INSTAGRAM_SESSION_ID;
  if (!sid) return { picUrl: null, followerCount: null };
  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
      {
        headers: {
          'x-ig-app-id': IG_APP_ID,
          Cookie: `sessionid=${sid}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return { picUrl: null, followerCount: null };
    const json = await res.json() as { data?: { user?: Record<string, any> } };
    const user = json?.data?.user;
    return {
      picUrl: user?.profile_pic_url_hd ?? user?.profile_pic_url ?? null,
      followerCount: user?.edge_followed_by?.count ?? null,
    };
  } catch {
    return { picUrl: null, followerCount: null };
  }
}

async function uploadToStorage(userId: string, buffer: Buffer): Promise<string | null> {
  const key = `profile/${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await adminClient.storage
    .from('avatars')
    .upload(key, buffer, { contentType: 'image/jpeg', upsert: true });
  if (error) return null;
  const { data: { publicUrl } } = adminClient.storage.from('avatars').getPublicUrl(key);
  return publicUrl;
}

export async function syncInstagramAvatar(
  userId: string,
  handle: string
): Promise<{ avatarUrl: string | null; followerCount: number | null }> {
  // Try og:image scrape for pic; session API for pic + follower count
  const [ogPicUrl, apiData] = await Promise.all([
    fetchOgImageUrl(handle),
    fetchSessionApiData(handle),
  ]);

  const picUrl = ogPicUrl ?? apiData.picUrl;
  const { followerCount } = apiData;

  // Update follower count if available
  if (followerCount !== null) {
    await adminClient
      .from('influencer_profiles')
      .update({ followers_count: followerCount })
      .eq('id', userId);
  }

  if (!picUrl) return { avatarUrl: null, followerCount };

  // Download image
  let buffer: Buffer;
  try {
    const img = await fetch(picUrl, { signal: AbortSignal.timeout(10000) });
    if (!img.ok) return { avatarUrl: null, followerCount };
    buffer = Buffer.from(await img.arrayBuffer());
  } catch {
    return { avatarUrl: null, followerCount };
  }

  const publicUrl = await uploadToStorage(userId, buffer);
  if (publicUrl) {
    await adminClient.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
  }

  return { avatarUrl: publicUrl, followerCount };
}
