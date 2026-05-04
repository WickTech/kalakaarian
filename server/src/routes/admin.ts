import { Router, Response } from 'express';
import { auth, requireAdmin, AuthRequest } from '../middleware/auth';
import { adminClient } from '../config/supabase';

const router = Router();

router.get('/users', auth, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await adminClient
      .from('profiles')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) { res.status(500).json({ message: 'Failed to fetch users' }); return; }
    res.json({ users: data ?? [] });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/campaigns', auth, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
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
});

router.put('/campaigns/:id/status', auth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['open', 'closed', 'archived'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' }); return;
    }
    const { error } = await adminClient.from('campaigns').update({ status }).eq('id', req.params.id);
    if (error) { res.status(500).json({ message: 'Failed to update campaign' }); return; }
    res.json({ message: 'Updated' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
