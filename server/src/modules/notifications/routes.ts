import { Router } from 'express';
import { auth } from '../../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
  deleteNotification,
} from './controller';

const router = Router();

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.put('/read-all', auth, markAllRead);
router.put('/:id/read', auth, markRead);
router.delete('/:id', auth, deleteNotification);

export default router;
