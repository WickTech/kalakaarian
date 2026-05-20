import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './service';

// Thin HTTP handlers for the notifications domain.

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json(await service.getNotifications(req.user!.userId));
  } catch {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({ count: await service.getUnreadCount(req.user!.userId) });
  } catch {
    res.status(500).json({ message: 'Error fetching count' });
  }
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await service.markAllRead(req.user!.userId);
    res.json({ message: 'All marked as read' });
  } catch {
    res.status(500).json({ message: 'Error marking all as read' });
  }
};

export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await service.markRead(req.params.id, req.user!.userId);
    res.json({ message: 'Marked as read' });
  } catch {
    res.status(500).json({ message: 'Error marking as read' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await service.deleteNotification(req.params.id, req.user!.userId);
    res.json({ message: 'Notification deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting notification' });
  }
};
