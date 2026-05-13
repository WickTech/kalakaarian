import { adminClient } from '../config/supabase';
import { encryptToken, decryptToken } from '../utils/tokenCrypto';

export type PlatformKind = 'instagram' | 'youtube';

export interface PlatformAccount {
  id: string;
  influencer_id: string;
  platform: PlatformKind;
  platform_user_id: string;
  platform_username: string | null;
  platform_profile_url: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  connected_at: string;
  last_synced_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  deleted_at: string | null;
}

export interface UpsertAccountInput {
  influencerId: string;
  platform: PlatformKind;
  platformUserId: string;
  platformUsername?: string | null;
  platformProfileUrl?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  scopes?: string[];
}

function sanitize(row: Record<string, unknown>): PlatformAccount {
  const { access_token_encrypted, refresh_token_encrypted, ...safe } = row;
  void access_token_encrypted;
  void refresh_token_encrypted;
  return safe as unknown as PlatformAccount;
}

export async function upsertPlatformAccount(input: UpsertAccountInput): Promise<PlatformAccount> {
  const row = {
    influencer_id: input.influencerId,
    platform: input.platform,
    platform_user_id: input.platformUserId,
    platform_username: input.platformUsername ?? null,
    platform_profile_url: input.platformProfileUrl ?? null,
    access_token_encrypted: encryptToken(input.accessToken),
    refresh_token_encrypted: input.refreshToken ? encryptToken(input.refreshToken) : null,
    token_expires_at: input.tokenExpiresAt ?? null,
    scopes: input.scopes ?? null,
    deleted_at: null,
    connected_at: new Date().toISOString(),
  };

  const { data: existing } = await adminClient
    .from('creator_platform_accounts')
    .select('id')
    .eq('influencer_id', input.influencerId)
    .eq('platform', input.platform)
    .is('deleted_at', null)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await adminClient
      .from('creator_platform_accounts')
      .update(row)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return sanitize(data);
  }

  const { data, error } = await adminClient
    .from('creator_platform_accounts')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return sanitize(data);
}

export async function getActiveAccount(influencerId: string, platform: PlatformKind): Promise<PlatformAccount | null> {
  const { data } = await adminClient
    .from('creator_platform_accounts')
    .select('*')
    .eq('influencer_id', influencerId)
    .eq('platform', platform)
    .is('deleted_at', null)
    .maybeSingle();
  return data ? sanitize(data) : null;
}

export async function getDecryptedTokens(accountId: string): Promise<{ accessToken: string; refreshToken: string | null }> {
  const { data, error } = await adminClient
    .from('creator_platform_accounts')
    .select('access_token_encrypted, refresh_token_encrypted')
    .eq('id', accountId)
    .single();
  if (error || !data) throw new Error('Account not found');
  return {
    accessToken: decryptToken(data.access_token_encrypted),
    refreshToken: data.refresh_token_encrypted ? decryptToken(data.refresh_token_encrypted) : null,
  };
}

export async function softDeleteAccount(influencerId: string, platform: PlatformKind): Promise<void> {
  await adminClient
    .from('creator_platform_accounts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('influencer_id', influencerId)
    .eq('platform', platform)
    .is('deleted_at', null);
}

export async function listAllActiveForSync(): Promise<PlatformAccount[]> {
  const { data, error } = await adminClient
    .from('creator_platform_accounts')
    .select('*')
    .is('deleted_at', null)
    .order('last_synced_at', { ascending: true, nullsFirst: true });
  if (error) throw error;
  return (data ?? []).map(sanitize);
}

export async function listForUser(influencerId: string): Promise<PlatformAccount[]> {
  const { data, error } = await adminClient
    .from('creator_platform_accounts')
    .select('*')
    .eq('influencer_id', influencerId)
    .is('deleted_at', null);
  if (error) throw error;
  return (data ?? []).map(sanitize);
}

export async function markSyncResult(accountId: string, status: 'ok' | 'token_expired' | 'failed', error?: string): Promise<void> {
  await adminClient
    .from('creator_platform_accounts')
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_status: status,
      last_sync_error: error ?? null,
    })
    .eq('id', accountId);
}

export async function updateAccessToken(accountId: string, newAccessToken: string, newExpiresAt: string | null): Promise<void> {
  await adminClient
    .from('creator_platform_accounts')
    .update({
      access_token_encrypted: encryptToken(newAccessToken),
      token_expires_at: newExpiresAt,
    })
    .eq('id', accountId);
}
