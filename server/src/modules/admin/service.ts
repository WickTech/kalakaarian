import * as repo from './repository';
import { isValidCampaignStatus } from './validators';
import type { ListUsersQuery, AuditEntry } from './types';

// Business logic for the admin domain. No Express types here.

export type AdminResult =
  | { kind: 'ok'; message: string }
  | { kind: 'error'; status: number; message: string };

async function logAction(e: AuditEntry): Promise<void> {
  await repo.insertAuditLog({
    admin_id: e.adminId,
    action: e.action,
    target_type: e.targetType,
    target_id: e.targetId,
    details: e.details,
    ip_address: e.ip ?? null,
  });
}

// ---- reads -----------------------------------------------------------------

export const getStats = (): Promise<repo.StatsCounts> => repo.getStatsCounts();
export const listUsers = (query: ListUsersQuery): Promise<unknown[]> => repo.listUsers(query);
export const listCampaigns = (): Promise<unknown[]> => repo.listCampaigns();
export const getAuditLogs = (): Promise<unknown[]> => repo.listAuditLogs();
export const getFeatureFlags = (): Promise<unknown[]> => repo.listFeatureFlags();

// ---- mutations -------------------------------------------------------------

export async function updateCampaignStatus(
  adminId: string, campaignId: string, status: unknown, ip: string | undefined,
): Promise<AdminResult> {
  if (!isValidCampaignStatus(status)) return { kind: 'error', status: 400, message: 'Invalid status' };
  if (!(await repo.updateCampaignStatus(campaignId, status))) {
    return { kind: 'error', status: 500, message: 'Failed to update campaign' };
  }
  await logAction({ adminId, action: 'update_campaign_status', targetType: 'campaign', targetId: campaignId, details: { status }, ip });
  return { kind: 'ok', message: 'Updated' };
}

export async function suspendUser(
  adminId: string, userId: string, suspend: boolean, ip: string | undefined,
): Promise<AdminResult> {
  if (!(await repo.setSuspended(userId, !!suspend))) {
    return { kind: 'error', status: 500, message: 'Failed to update user' };
  }
  await logAction({ adminId, action: suspend ? 'suspend_user' : 'unsuspend_user', targetType: 'user', targetId: userId, details: {}, ip });
  return { kind: 'ok', message: suspend ? 'User suspended' : 'User unsuspended' };
}

export async function verifyCreator(
  adminId: string, creatorId: string, verified: boolean, ip: string | undefined,
): Promise<AdminResult> {
  if (!(await repo.setVerified(creatorId, !!verified))) {
    return { kind: 'error', status: 500, message: 'Failed to verify creator' };
  }
  await logAction({ adminId, action: verified ? 'verify_creator' : 'unverify_creator', targetType: 'creator', targetId: creatorId, details: {}, ip });
  return { kind: 'ok', message: verified ? 'Creator verified' : 'Verification removed' };
}

export async function forcePresence(
  adminId: string, creatorId: string, online: boolean, ip: string | undefined,
): Promise<AdminResult> {
  if (!(await repo.setPresence(creatorId, !!online))) {
    return { kind: 'error', status: 500, message: 'Failed to update presence' };
  }
  await logAction({ adminId, action: online ? 'force_creator_online' : 'force_creator_offline', targetType: 'creator', targetId: creatorId, details: {}, ip });
  return { kind: 'ok', message: `Creator set ${online ? 'online' : 'offline'}` };
}

export async function deleteUser(
  adminId: string, userId: string, ip: string | undefined,
): Promise<AdminResult> {
  if (userId === adminId) {
    return { kind: 'error', status: 400, message: 'Cannot delete your own account via admin panel' };
  }
  const target = await repo.getProfileForDelete(userId);
  if (target?.is_super_admin) {
    return { kind: 'error', status: 403, message: 'Cannot delete a super admin account' };
  }
  await logAction({ adminId, action: 'delete_user', targetType: 'user', targetId: userId, details: { name: target?.name }, ip });
  const errMessage = await repo.deleteAuthUser(userId);
  if (errMessage) return { kind: 'error', status: 500, message: errMessage };
  return { kind: 'ok', message: 'User deleted' };
}

export async function promoteSuperAdmin(
  adminId: string, userId: string, promote: boolean, ip: string | undefined,
): Promise<AdminResult> {
  if (!(await repo.setSuperAdmin(userId, !!promote))) {
    return { kind: 'error', status: 500, message: 'Failed to update role' };
  }
  await logAction({ adminId, action: promote ? 'promote_super_admin' : 'demote_super_admin', targetType: 'user', targetId: userId, details: {}, ip });
  return { kind: 'ok', message: promote ? 'User promoted to super admin' : 'Super admin revoked' };
}

export async function updateFeatureFlag(
  adminId: string, key: string, enabled: unknown, ip: string | undefined,
): Promise<AdminResult> {
  if (typeof enabled !== 'boolean') {
    return { kind: 'error', status: 400, message: 'enabled must be boolean' };
  }
  const ok = await repo.upsertFeatureFlag({
    key, enabled, updated_by: adminId, updated_at: new Date().toISOString(),
  });
  if (!ok) return { kind: 'error', status: 500, message: 'Failed to update flag' };
  await logAction({ adminId, action: 'toggle_feature_flag', targetType: 'flag', targetId: key, details: { enabled }, ip });
  return { kind: 'ok', message: 'Flag updated' };
}
