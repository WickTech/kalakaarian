import { Router, Response } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { data } = await adminClient.from('notifications')
      .select('*')
      .eq('user_id', req.user!.userId)
      .order('created_at', { ascending: false })
      .limit(50);
    res.json(data ?? []);
  } catch { res.status(500).json({ message: 'Error fetching notifications' }); }
});

router.get('/unread-count', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { count } = await adminClient.from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user!.userId)
      .eq('is_read', false);
    res.json({ count: count ?? 0 });
  } catch { res.status(500).json({ message: 'Error fetching count' }); }
});

router.put('/read-all', auth, async (req: AuthRequest, res: Response) => {
  try {
    await adminClient.from('notifications').update({ is_read: true })
      .eq('user_id', req.user!.userId).eq('is_read', false);
    res.json({ message: 'All marked as read' });
  } catch { res.status(500).json({ message: 'Error marking all as read' }); }
});

router.put('/:id/read', auth, async (req: AuthRequest, res: Response) => {
  try {
    await adminClient.from('notifications').update({ is_read: true })
      .eq('id', req.params.id).eq('user_id', req.user!.userId);
    res.json({ message: 'Marked as read' });
  } catch { res.status(500).json({ message: 'Error marking as read' }); }
});

router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    await adminClient.from('notifications').delete()
      .eq('id', req.params.id).eq('user_id', req.user!.userId);
    res.json({ message: 'Notification deleted' });
  } catch { res.status(500).json({ message: 'Error deleting notification' }); }
});

export default router;
