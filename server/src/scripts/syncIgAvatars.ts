import path from 'path';
import dotenv from 'dotenv';
// Must load env before any module that reads process.env at import time
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

/* eslint-disable @typescript-eslint/no-var-requires */
const { adminClient } = require('../config/supabase') as typeof import('../config/supabase');
const { syncInstagramAvatar } = require('../services/instagramAvatarService') as typeof import('../services/instagramAvatarService');
const { getInstagramStats } = require('../services/instagramService') as typeof import('../services/instagramService');

async function main() {
  const { data, error } = await adminClient
    .from('influencer_profiles')
    .select('id, instagram_handle')
    .not('instagram_handle', 'is', null);

  if (error) { console.error('Fetch error:', error.message); process.exit(1); }

  const rows = (data ?? []).filter((r: any) => r.instagram_handle);
  console.log(`Syncing ${rows.length} creators...`);

  for (const row of rows) {
    const handle = row.instagram_handle as string;
    process.stdout.write(`  @${handle} ... `);

    const [{ avatarUrl, followerCount: sessionFollowers }, igStats] = await Promise.all([
      syncInstagramAvatar(row.id as string, handle),
      getInstagramStats(handle).catch(() => null),
    ]);

    // Prefer session API count; fall back to igStats (which may be mock)
    const finalFollowers = sessionFollowers ?? igStats?.followers ?? null;

    if (finalFollowers != null) {
      await adminClient
        .from('influencer_profiles')
        .update({ followers_count: finalFollowers })
        .eq('id', row.id);
    }

    const parts = [
      avatarUrl ? 'avatar OK' : 'no avatar',
      finalFollowers != null ? `${finalFollowers.toLocaleString()} followers` : 'no follower count',
    ];
    console.log(parts.join(' | '));
  }

  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
