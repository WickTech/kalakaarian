import { adminClient } from '../../config/supabase';
import type { ConversationRef, ConversationRow } from './types';

// All Supabase access for the messaging domain lives here.

export async function findConversation(participantIds: string[]): Promise<ConversationRef | null> {
  const { data } = await adminClient
    .from('conversations')
    .select('id')
    .contains('participant_ids', participantIds)
    .maybeSingle();
  return (data as ConversationRef | null) ?? null;
}

// True when sender + receiver are linked through at least one campaign
// (one as the brand, the other as a selected creator — in either direction).
export async function hasCampaignRelationship(a: string, b: string): Promise<boolean> {
  const [r1, r2] = await Promise.all([
    adminClient
      .from('campaign_creators')
      .select('id, campaigns!inner(brand_id)')
      .eq('influencer_id', a)
      .eq('campaigns.brand_id', b)
      .limit(1),
    adminClient
      .from('campaign_creators')
      .select('id, campaigns!inner(brand_id)')
      .eq('influencer_id', b)
      .eq('campaigns.brand_id', a)
      .limit(1),
  ]);
  return (r1.data?.length ?? 0) > 0 || (r2.data?.length ?? 0) > 0;
}

export async function createConversation(participantIds: string[]): Promise<ConversationRef | null> {
  const { data, error } = await adminClient
    .from('conversations')
    .insert({ participant_ids: participantIds })
    .select('id')
    .single();
  if (error || !data) return null;
  return data as ConversationRef;
}

export async function insertMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<unknown | null> {
  const { data, error } = await adminClient
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();
  if (error || !data) return null;
  return data;
}

export async function touchConversation(id: string): Promise<void> {
  await adminClient
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', id);
}

export async function listConversations(userId: string): Promise<unknown[]> {
  const { data, error } = await adminClient
    .from('conversations')
    .select('*, messages!conversations_id_fkey(id, content, sender_id, is_read, created_at)')
    .contains('participant_ids', [userId])
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function findConversationById(id: string): Promise<ConversationRow | null> {
  const { data } = await adminClient
    .from('conversations')
    .select('id, participant_ids')
    .eq('id', id)
    .single();
  return (data as ConversationRow | null) ?? null;
}

export async function listMessages(conversationId: string): Promise<unknown[]> {
  const { data } = await adminClient
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function markRead(conversationId: string, userId: string): Promise<void> {
  await adminClient
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('is_read', false);
}
