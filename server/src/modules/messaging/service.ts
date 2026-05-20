import * as repo from './repository';
import type { SendMessageInput } from './types';

// Business logic for the messaging domain. No Express types here.

export type SendResult =
  | { kind: 'forbidden' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; message: unknown; conversationId: string };

export async function sendMessage(senderId: string, input: SendMessageInput): Promise<SendResult> {
  // participant_ids are stored sorted (the DB trigger also enforces this).
  const sorted = [senderId, input.receiverId].sort();

  let conversation = await repo.findConversation(sorted);
  if (!conversation) {
    // Relationship guard: messaging is only allowed once the two users are
    // connected through a campaign (or an existing conversation).
    const related = await repo.hasCampaignRelationship(senderId, input.receiverId);
    if (!related) return { kind: 'forbidden' };
    conversation = await repo.createConversation(sorted);
    if (!conversation) return { kind: 'error', message: 'Failed to create conversation' };
  }

  const message = await repo.insertMessage(conversation.id, senderId, input.content);
  if (!message) return { kind: 'error', message: 'Failed to send message' };

  await repo.touchConversation(conversation.id);
  return { kind: 'ok', message, conversationId: conversation.id };
}

export function listConversations(userId: string): Promise<unknown[]> {
  return repo.listConversations(userId);
}

export type MessagesResult =
  | { kind: 'not_found' }
  | { kind: 'forbidden' }
  | { kind: 'ok'; conversation: unknown; messages: unknown[] };

export async function getMessages(conversationId: string, userId: string): Promise<MessagesResult> {
  const conversation = await repo.findConversationById(conversationId);
  if (!conversation) return { kind: 'not_found' };
  if (!conversation.participant_ids.includes(userId)) return { kind: 'forbidden' };
  const messages = await repo.listMessages(conversationId);
  return { kind: 'ok', conversation, messages };
}

export function markConversationRead(conversationId: string, userId: string): Promise<void> {
  return repo.markRead(conversationId, userId);
}
