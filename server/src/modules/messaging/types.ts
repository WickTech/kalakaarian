// Domain types for the messaging module. No Express types here.

export interface SendMessageInput {
  receiverId: string;
  content: string;
}

export interface ConversationRef {
  id: string;
}

export interface ConversationRow {
  id: string;
  participant_ids: string[];
}
