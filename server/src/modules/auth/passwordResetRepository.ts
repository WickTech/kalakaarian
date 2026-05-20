import { adminClient } from '../../config/supabase';

// Supabase DAO for the password-reset concern (password_reset_tokens + profiles).

export interface ResetProfile {
  id: string;
  name: string | null;
  email: string;
}

export async function findProfileByEmail(email: string): Promise<ResetProfile | null> {
  const { data } = await adminClient
    .from('profiles')
    .select('id, name, email')
    .eq('email', email)
    .maybeSingle();
  return data as ResetProfile | null;
}

export async function countRecentTokens(userId: string, sinceIso: string): Promise<number> {
  const { count } = await adminClient
    .from('password_reset_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sinceIso);
  return count ?? 0;
}

export async function invalidatePriorTokens(userId: string): Promise<void> {
  await adminClient
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('used_at', null);
}

export async function insertResetToken(row: Record<string, unknown>): Promise<boolean> {
  const { error } = await adminClient.from('password_reset_tokens').insert(row);
  if (error) console.error('forgotPassword insert error:', error);
  return !error;
}

export interface ResetTokenRow {
  id: string;
  user_id: string;
  used_at: string | null;
  expires_at: string;
}

export async function findTokenByHash(hash: string): Promise<ResetTokenRow | null> {
  const { data } = await adminClient
    .from('password_reset_tokens')
    .select('id, user_id, used_at, expires_at')
    .eq('token_hash', hash)
    .maybeSingle();
  return data as ResetTokenRow | null;
}

// Atomic single-use claim: marks the token used only if it was still unused.
// Returns true when this call is the one that consumed it.
export async function markTokenUsed(id: string): Promise<boolean> {
  const { data, error } = await adminClient
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', id)
    .is('used_at', null)
    .select('id')
    .maybeSingle();
  return !error && !!data;
}

export async function updateUserPassword(userId: string, password: string): Promise<boolean> {
  const { error } = await adminClient.auth.admin.updateUserById(userId, { password });
  if (error) console.error('resetPassword updateUserById error:', error);
  return !error;
}

export async function getProfileContact(
  userId: string,
): Promise<{ email: string | null; name: string | null } | null> {
  const { data } = await adminClient
    .from('profiles')
    .select('email, name')
    .eq('id', userId)
    .maybeSingle();
  return data;
}
