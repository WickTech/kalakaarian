import { Router, Response } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/send', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user!.userId;
    if (!receiverId || !content) {
      res.status(400).json({ message: 'Receiver ID and content are required' }); return;
    }

    // Find or create conversation (participant_ids stored sorted via DB trigger)
    const sorted = [senderId, receiverId].sort();
    let { data: conversation } = await adminClient
      .from('conversations')
      .select('id')
      .contains('participant_ids', sorted)
      .single();

    if (!conversation) {
      const { data: newConv, error: convErr } = await adminClient
        .from('conversations')
        .insert({ participant_ids: sorted })
        .select('id')
        .single();
      if (convErr || !newConv) { res.status(500).json({ message: 'Failed to create conversation' }); return; }
      conversation = newConv;
    }

    const { data: message, error: msgErr } = await adminClient.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: senderId,
      content,
    }).select().single();
    if (msgErr || !message) { res.status(500).json({ message: 'Failed to send message' }); return; }

    await adminClient.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversation.id);

    res.status(201).json({ message, conversationId: conversation.id });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/conversations', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { data, error } = await adminClient
      .from('conversations')
      .select('*, messages!conversations_id_fkey(id, content, sender_id, is_read, created_at)')
      .contains('participant_ids', [userId])
      .order('last_message_at', { ascending: false, nullsFirst: false });
    if (error) throw error;
    res.json({ conversations: data ?? [] });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/conversations/:conversationId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.userId;

    const { data: conversation } = await adminClient.from('conversations').select('id, participant_ids').eq('id', conversationId).single();
    if (!conversation) { res.status(404).json({ message: 'Conversation not found' }); return; }
    if (!conversation.participant_ids.includes(userId)) { res.status(403).json({ message: 'Not authorized' }); return; }

    const { data: messages } = await adminClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    res.json({ conversation, messages: messages ?? [] });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/conversations/:conversationId/read', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.userId;
    await adminClient.from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
