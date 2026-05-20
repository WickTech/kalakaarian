import { adminClient } from '../../config/supabase';

// All Supabase access for the notifications domain lives here.

export async function listForUser(userId: string): Promise<Record<string, unknown>[]> {
  const { data } = await adminClient
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data ?? []) as Record<string, unknown>[];
}

export async function countUnread(userId: string): Promise<number> {
  const { count } = await adminClient
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return count ?? 0;
}

export async function markAllRead(userId: string): Promise<void> {
  await adminClient
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}

export async function markRead(id: string, userId: string): Promise<void> {
  await adminClient
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', userId);
}

export async function remove(id: string, userId: string): Promise<void> {
  await adminClient.from('notifications').delete().eq('id', id).eq('user_id', userId);
}
