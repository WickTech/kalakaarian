import { adminClient } from '../../config/supabase';
import type { ListUsersQuery } from './types';

// All Supabase access for the admin domain lives here.

export interface StatsCounts {
  totalUsers: number | null;
  totalCreators: number | null;
  totalBrands: number | null;
  totalCampaigns: number | null;
  verifiedCreators: number | null;
  suspendedUsers: number | null;
}

export async function getStatsCounts(): Promise<StatsCounts> {
  const [users, creators, brands, campaigns, verified, suspended] = await Promise.all([
    adminClient.from('profiles').select('*', { count: 'exact', head: true }),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'influencer'),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'brand'),
    adminClient.from('campaigns').select('*', { count: 'exact', head: true }),
    adminClient.from('influencer_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('is_suspended', true),
  ]);
  return {
    totalUsers: users.count,
    totalCreators: creators.count,
    totalBrands: brands.count,
    totalCampaigns: campaigns.count,
    verifiedCreators: verified.count,
    suspendedUsers: suspended.count,
  };
}

export async function listUsers(filter: ListUsersQuery): Promise<unknown[]> {
  const clamped = Math.min(Number(filter.limit) || 100, 200);
  const offset = Number(filter.offset) || 0;
  let query = adminClient
    .from('profiles')
    .select('id, name, email, role, is_super_admin, is_suspended, created_at')
    .order('created_at', { ascending: false })
    .limit(clamped)
    .range(offset, offset + clamped - 1);

  if (filter.role) query = query.eq('role', filter.role);
  if (filter.suspended === 'true') query = query.eq('is_suspended', true);
  if (filter.search) query = query.ilike('name', `%${filter.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listCampaigns(): Promise<unknown[]> {
  const { data, error } = await adminClient
    .from('campaigns')
    .select('id, title, status, brand_id, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function updateCampaignStatus(id: string, status: string): Promise<boolean> {
  const { error } = await adminClient.from('campaigns').update({ status }).eq('id', id);
  return !error;
}

export async function listAuditLogs(): Promise<unknown[]> {
  const { data, error } = await adminClient
    .from('admin_audit_logs')
    .select('id, admin_id, action, target_type, target_id, details, ip_address, created_at, profiles(name, email)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function insertAuditLog(row: Record<string, unknown>): Promise<void> {
  await adminClient.from('admin_audit_logs').insert(row);
}

export async function setSuspended(id: string, value: boolean): Promise<boolean> {
  const { error } = await adminClient.from('profiles').update({ is_suspended: value }).eq('id', id);
  return !error;
}

export async function setVerified(id: string, value: boolean): Promise<boolean> {
  const { error } = await adminClient
    .from('influencer_profiles')
    .update({ is_verified: value })
    .eq('id', id);
  return !error;
}

export async function setPresence(id: string, online: boolean): Promise<boolean> {
  const { error } = await adminClient
    .from('influencer_profiles')
    .update({ is_online: online, last_seen_at: online ? null : new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function getProfileForDelete(
  id: string,
): Promise<{ is_super_admin: boolean | null; name: string | null } | null> {
  const { data } = await adminClient
    .from('profiles')
    .select('is_super_admin, name')
    .eq('id', id)
    .single();
  return data;
}

export async function deleteAuthUser(id: string): Promise<string | null> {
  const { error } = await adminClient.auth.admin.deleteUser(id);
  return error ? error.message : null;
}

export async function setSuperAdmin(id: string, value: boolean): Promise<boolean> {
  const { error } = await adminClient.from('profiles').update({ is_super_admin: value }).eq('id', id);
  if (error) return false;
  await adminClient.auth.admin.updateUserById(id, { user_metadata: { is_super_admin: value } });
  return true;
}

export async function listFeatureFlags(): Promise<unknown[]> {
  const { data, error } = await adminClient
    .from('feature_flags')
    .select('key, enabled, description, updated_at')
    .order('key');
  if (error) throw error;
  return data ?? [];
}

export async function upsertFeatureFlag(row: Record<string, unknown>): Promise<boolean> {
  const { error } = await adminClient.from('feature_flags').upsert(row, { onConflict: 'key' });
  return !error;
}
