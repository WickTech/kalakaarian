import * as repo from './repository';
import type { NotificationDTO } from './types';

// Business logic for the notifications domain. No Express types here.

const mapNotification = (n: Record<string, unknown>): NotificationDTO => ({
  id: n.id,
  userId: n.user_id,
  type: n.type,
  title: n.title,
  // DB columns are `body` + `data` (jsonb); the client DTO uses message + link.
  message: n.body ?? '',
  read: n.is_read,
  link: (n.data as { link?: string } | null)?.link ?? undefined,
  createdAt: n.created_at,
});

export async function getNotifications(userId: string): Promise<NotificationDTO[]> {
  const rows = await repo.listForUser(userId);
  return rows.map(mapNotification);
}

export function getUnreadCount(userId: string): Promise<number> {
  return repo.countUnread(userId);
}

export function markAllRead(userId: string): Promise<void> {
  return repo.markAllRead(userId);
}

export function markRead(id: string, userId: string): Promise<void> {
  return repo.markRead(id, userId);
}

export function deleteNotification(id: string, userId: string): Promise<void> {
  return repo.remove(id, userId);
}
