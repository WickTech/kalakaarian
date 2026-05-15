import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { password } = req.body;
    if (!password) { res.status(400).json({ message: 'Password required to confirm account deletion' }); return; }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('email')
      .eq('id', req.user.userId)
      .single();

    if (!profile?.email) {
      res.status(400).json({ message: 'Cannot delete account: no email associated' }); return;
    }

    const { error: signInError } = await adminClient.auth.signInWithPassword({
      email: profile.email,
      password,
    });
    if (signInError) {
      res.status(401).json({ message: 'Incorrect password' }); return;
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(req.user.userId);
    if (deleteError) throw deleteError;

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
