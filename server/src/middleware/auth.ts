import { Request, Response, NextFunction } from 'express';
import { adminClient } from '../config/supabase';

export interface AuthRequest extends Request {
  user?: { userId: string; role: string; isAdmin: boolean };
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

  req.user = {
    userId: user.id,
    role: user.user_metadata?.role ?? '',
    isAdmin: user.user_metadata?.is_admin ?? false,
  };
  next();
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    const { data: { user }, error } = await adminClient.auth.getUser(token);
    if (error) console.warn('optionalAuth: invalid token ignored', error.message);
    if (user) {
      req.user = {
        userId: user.id,
        role: user.user_metadata?.role ?? '',
        isAdmin: user.user_metadata?.is_admin ?? false,
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
