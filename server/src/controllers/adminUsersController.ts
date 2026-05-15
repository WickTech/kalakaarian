import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { logAdminAction } from './adminController';

export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { suspend } = req.body as { suspend: boolean };
    const { error } = await adminClient.from('profiles').update({ is_suspended: !!suspend }).eq('id', id);
    if (error) { res.status(500).json({ message: 'Failed to update user' }); return; }
    await logAdminAction(req.user!.userId, suspend ? 'suspend_user' : 'unsuspend_user', 'user', id, {}, req.ip);
    res.json({ message: suspend ? 'User suspended' : 'User unsuspended' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyCreator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { verified } = req.body as { verified: boolean };
    const { error } = await adminClient
      .from('influencer_profiles')
      .update({ is_verified: !!verified })
      .eq('id', id);
    if (error) { res.status(500).json({ message: 'Failed to verify creator' }); return; }
    await logAdminAction(req.user!.userId, verified ? 'verify_creator' : 'unverify_creator', 'creator', id, {}, req.ip);
    res.json({ message: verified ? 'Creator verified' : 'Verification removed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const forcePresence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { online } = req.body as { online: boolean };
    const now = new Date().toISOString();
    const { error } = await adminClient.from('influencer_profiles').update({
      is_online: !!online,
      last_seen_at: online ? null : now,
    }).eq('id', id);
    if (error) { res.status(500).json({ message: 'Failed to update presence' }); return; }
    await logAdminAction(req.user!.userId, online ? 'force_creator_online' : 'force_creator_offline', 'creator', id, {}, req.ip);
    res.json({ message: `Creator set ${online ? 'online' : 'offline'}` });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Prevent self-deletion
    if (id === req.user!.userId) {
      res.status(400).json({ message: 'Cannot delete your own account via admin panel' }); return;
    }
    // Prevent deleting other super admins
    const { data: target } = await adminClient.from('profiles').select('is_super_admin, name').eq('id', id).single();
    if (target?.is_super_admin) {
      res.status(403).json({ message: 'Cannot delete a super admin account' }); return;
    }
    await logAdminAction(req.user!.userId, 'delete_user', 'user', id, { name: target?.name }, req.ip);
    const { error } = await adminClient.auth.admin.deleteUser(id);
    if (error) { res.status(500).json({ message: error.message }); return; }
    res.json({ message: 'User deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const promoteSuperAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { promote } = req.body as { promote: boolean };
    const { error } = await adminClient.from('profiles').update({ is_super_admin: !!promote }).eq('id', id);
    if (error) { res.status(500).json({ message: 'Failed to update role' }); return; }
    // Sync user_metadata
    await adminClient.auth.admin.updateUserById(id, {
      user_metadata: { is_super_admin: !!promote },
    });
    await logAdminAction(req.user!.userId, promote ? 'promote_super_admin' : 'demote_super_admin', 'user', id, {}, req.ip);
    res.json({ message: promote ? 'User promoted to super admin' : 'Super admin revoked' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
