import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from './auth';

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const user = await User.findById(req.user.userId).select('isAdmin');
    if (!user?.isAdmin) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
