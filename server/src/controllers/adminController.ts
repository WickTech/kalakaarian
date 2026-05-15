import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const logAdminAction = async (
  adminId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  details: object,
  ip: string | undefined,
): Promise<void> => {
  await adminClient.from('admin_audit_logs').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    ip_address: ip ?? null,
  });
};

export const getPlatformStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      { count: totalUsers },
      { count: totalCreators },
      { count: totalBrands },
      { count: totalCampaigns },
      { count: verifiedCreators },
      { count: suspendedUsers },
    ] = await Promise.all([
      adminClient.from('profiles').select('*', { count: 'exact', head: true }),
      adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'influencer'),
      adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'brand'),
      adminClient.from('campaigns').select('*', { count: 'exact', head: true }),
      adminClient.from('influencer_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('is_suspended', true),
    ]);
    res.json({ totalUsers, totalCreators, totalBrands, totalCampaigns, verifiedCreators, suspendedUsers });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, suspended, search, limit = '100', offset = '0' } = req.query as Record<string, string>;
    let query = adminClient
      .from('profiles')
      .select('id, name, email, role, is_super_admin, is_suspended, created_at')
      .order('created_at', { ascending: false })
      .limit(Math.min(Number(limit) || 100, 200))
      .range(Number(offset), Number(offset) + Math.min(Number(limit) || 100, 200) - 1);

    if (role) query = query.eq('role', role);
    if (suspended === 'true') query = query.eq('is_suspended', true);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query;
    if (error) { res.status(500).json({ message: 'Failed to fetch users' }); return; }
    res.json({ users: data ?? [] });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const listCampaigns = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await adminClient
      .from('campaigns')
      .select('id, title, status, brand_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) { res.status(500).json({ message: 'Failed to fetch campaigns' }); return; }
    res.json({ campaigns: data ?? [] });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCampaignStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['open', 'closed', 'archived'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' }); return;
    }
    const { error } = await adminClient.from('campaigns').update({ status }).eq('id', req.params.id);
    if (error) { res.status(500).json({ message: 'Failed to update campaign' }); return; }
    await logAdminAction(req.user!.userId, 'update_campaign_status', 'campaign', req.params.id, { status }, req.ip);
    res.json({ message: 'Updated' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAuditLogs = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await adminClient
      .from('admin_audit_logs')
      .select('id, admin_id, action, target_type, target_id, details, ip_address, created_at, profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) { res.status(500).json({ message: 'Failed to fetch logs' }); return; }
    res.json({ logs: data ?? [] });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
