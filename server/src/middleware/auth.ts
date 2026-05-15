import { Request, Response, NextFunction } from 'express';
import { adminClient } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: { userId: string; role: string; isAdmin: boolean; isSuperAdmin: boolean };
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const { data: { user }, error } = await adminClient.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }

  const isSuperAdmin = user.user_metadata?.is_super_admin ?? false;
  const isAdmin = isSuperAdmin || (user.user_metadata?.is_admin ?? false);

  // Suspended users cannot access any authenticated route
  if (!isSuperAdmin) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('is_suspended')
      .eq('id', user.id)
      .single();
    if (profile?.is_suspended) {
      res.status(403).json({ message: 'Account suspended. Contact support.' });
      return;
    }
  }

  req.user = { userId: user.id, role: user.user_metadata?.role ?? '', isAdmin, isSuperAdmin };
  next();
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    const { data: { user }, error } = await adminClient.auth.getUser(token);
    if (error) console.warn('optionalAuth: invalid token ignored', error.message);
    if (user) {
      const isSuperAdmin = user.user_metadata?.is_super_admin ?? false;
      req.user = {
        userId: user.id,
        role: user.user_metadata?.role ?? '',
        isAdmin: isSuperAdmin || (user.user_metadata?.is_admin ?? false),
        isSuperAdmin,
      };
    }
  }
  next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};

// Super admin check: DB lookup for defense-in-depth (can't be spoofed via JWT)
export const requireSuperAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const { data } = await adminClient
    .from('profiles')
    .select('is_super_admin')
    .eq('id', req.user.userId)
    .single();
  if (!data?.is_super_admin) {
    res.status(403).json({ message: 'Super admin access required' });
    return;
  }
  req.user.isSuperAdmin = true;
  next();
};
