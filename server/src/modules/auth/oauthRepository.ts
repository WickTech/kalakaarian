import { adminClient } from '../../config/supabase';
import type { AuthTokenResponse } from '@supabase/supabase-js';

// Supabase DAO for the Google OAuth concern.

export function signInWithIdToken(idToken: string): Promise<AuthTokenResponse> {
  return adminClient.auth.signInWithIdToken({ provider: 'google', token: idToken });
}

export async function findProfileBasic(
  userId: string,
): Promise<{ id: string; onboarding_completed: boolean | null } | null> {
  const { data } = await adminClient
    .from('profiles')
    .select('id, onboarding_completed')
    .eq('id', userId)
    .single();
  return data;
}

export async function insertStubProfile(row: Record<string, unknown>): Promise<void> {
  await adminClient.from('profiles').insert(row);
}

export interface GoogleProfile {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  is_super_admin: boolean | null;
  onboarding_completed: boolean | null;
}

export async function getGoogleProfile(userId: string): Promise<GoogleProfile | null> {
  const { data } = await adminClient
    .from('profiles')
    .select('id, email, name, role, is_super_admin, onboarding_completed')
    .eq('id', userId)
    .single();
  return data as GoogleProfile | null;
}

export async function getOnboardingProfile(
  userId: string,
): Promise<{ role: string; name: string | null; onboarding_completed: boolean | null } | null> {
  const { data } = await adminClient
    .from('profiles')
    .select('role, name, onboarding_completed')
    .eq('id', userId)
    .single();
  return data;
}

export async function updateProfile(
  userId: string,
  patch: Record<string, unknown>,
): Promise<{ code?: string }> {
  const { error } = await adminClient.from('profiles').update(patch).eq('id', userId);
  return { code: (error as { code?: string } | null)?.code };
}

export async function upsertBrandProfile(row: Record<string, unknown>): Promise<void> {
  await adminClient.from('brand_profiles').upsert(row);
}

export async function upsertInfluencerProfile(row: Record<string, unknown>): Promise<void> {
  await adminClient.from('influencer_profiles').upsert(row);
}

export async function upsertPricing(rows: Record<string, unknown>[]): Promise<void> {
  const { error } = await adminClient
    .from('influencer_pricing')
    .upsert(rows, { onConflict: 'influencer_id,platform,content_type' });
  if (error) console.error('pricing upsert failed:', error);
}

export async function setOnboardingComplete(userId: string): Promise<void> {
  await adminClient.from('profiles').update({ onboarding_completed: true }).eq('id', userId);
}
