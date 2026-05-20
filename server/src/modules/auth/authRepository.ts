import { adminClient, createAuthClient } from '../../config/supabase';
import type { AuthResponse, UserResponse } from '@supabase/supabase-js';

// Supabase DAO for the register/login concern.

export interface CreateAuthUserInput {
  email?: string;
  phone?: string;
  password: string;
  userMetadata: Record<string, unknown>;
}

export function createAuthUser(input: CreateAuthUserInput): Promise<UserResponse> {
  return adminClient.auth.admin.createUser({
    email: input.email || undefined,
    phone: input.phone,
    password: input.password,
    email_confirm: true,
    phone_confirm: !!input.phone,
    user_metadata: input.userMetadata,
  });
}

// Rollback helper — used when a profile/role-row insert fails after the auth
// user was already created.
export async function deleteAuthUser(userId: string): Promise<void> {
  await adminClient.auth.admin
    .deleteUser(userId)
    .catch((e) => console.error('Rollback deleteUser failed:', e));
}

export async function insertProfile(
  row: Record<string, unknown>,
): Promise<{ ok: boolean; code?: string }> {
  const { error } = await adminClient.from('profiles').insert(row);
  return { ok: !error, code: (error as { code?: string } | null)?.code };
}

export async function insertBrandProfile(row: Record<string, unknown>): Promise<boolean> {
  const { error } = await adminClient.from('brand_profiles').insert(row);
  return !error;
}

export async function insertInfluencerProfile(row: Record<string, unknown>): Promise<boolean> {
  const { error } = await adminClient.from('influencer_profiles').insert(row);
  return !error;
}

export async function insertPricing(rows: Record<string, unknown>[]): Promise<void> {
  const { error } = await adminClient.from('influencer_pricing').insert(rows);
  if (error) console.error('Pricing insert failed (non-fatal):', error);
}

// Ephemeral client — never signInWithPassword on adminClient (warm-lambda
// session pollution).
export function signInWithPassword(email: string, password: string): Promise<AuthResponse> {
  return createAuthClient().auth.signInWithPassword({ email, password });
}

export async function findProfileIdByPhone(phone: string): Promise<{ id: string } | null> {
  const { data } = await adminClient.from('profiles').select('id').eq('phone', phone).single();
  return data;
}

export async function findEmailByUsername(username: string): Promise<{ email: string } | null> {
  const { data } = await adminClient
    .from('profiles')
    .select('email')
    .eq('username', username)
    .single();
  return data;
}

export interface LoginProfile {
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  role: string;
  is_super_admin: boolean | null;
}

export async function getLoginProfile(userId: string): Promise<LoginProfile | null> {
  const { data } = await adminClient
    .from('profiles')
    .select('id, email, username, name, role, is_super_admin')
    .eq('id', userId)
    .single();
  return data as LoginProfile | null;
}

export async function updateUserMetadata(
  userId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await adminClient.auth.admin.updateUserById(userId, { user_metadata: metadata });
}
