import { adminClient } from '../config/supabase';
import crypto from 'crypto';

const FB_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

async function fetchOgImageUrl(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/`, {
      headers: { 'User-Agent': FB_UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/property="og:image"\s+content="([^"]+)"/);
    return m ? m[1].replace(/&amp;/g, '&') : null;
  } catch {
    return null;
  }
}

async function fetchSessionApiUrl(handle: string): Promise<string | null> {
  const sid = process.env.INSTAGRAM_SESSION_ID;
  if (!sid) return null;
  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
      {
        headers: {
          'x-ig-app-id': '936619743392459',
          Cookie: `sessionid=${sid}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const json = await res.json() as {
      data?: { user?: { profile_pic_url_hd?: string; profile_pic_url?: string } };
    };
    return json?.data?.user?.profile_pic_url_hd ?? json?.data?.user?.profile_pic_url ?? null;
  } catch {
    return null;
  }
}

export async function syncInstagramAvatar(userId: string, handle: string): Promise<string | null> {
  const picUrl = (await fetchOgImageUrl(handle)) ?? (await fetchSessionApiUrl(handle));
  if (!picUrl) return null;

  let buffer: Buffer;
  try {
    const img = await fetch(picUrl, { signal: AbortSignal.timeout(10000) });
    if (!img.ok) return null;
    buffer = Buffer.from(await img.arrayBuffer());
  } catch {
    return null;
  }

  const key = `profile/${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await adminClient.storage
    .from('avatars')
    .upload(key, buffer, { contentType: 'image/jpeg', upsert: true });
  if (error) return null;

  const { data: { publicUrl } } = adminClient.storage.from('avatars').getPublicUrl(key);
  await adminClient.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
  return publicUrl;
}
