import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const { confirmation } = req.body;
    if (confirmation !== 'DELETE') {
      res.status(400).json({ message: 'Type DELETE to confirm account deletion' }); return;
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(req.user.userId);
    if (deleteError) throw deleteError;

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
