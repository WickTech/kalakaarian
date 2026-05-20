import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as service from './service';

// Thin HTTP handlers: authorize, adapt the request, delegate to the service,
// and shape the response. No business logic or DB access here.

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await service.sendMessage(req.user!.userId, req.body);
    if (result.kind === 'forbidden') {
      res.status(403).json({ message: 'Can only message users connected via a campaign' });
      return;
    }
    if (result.kind === 'error') {
      res.status(500).json({ message: result.message });
      return;
    }
    res.status(201).json({ message: result.message, conversationId: result.conversationId });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversations = await service.listConversations(req.user!.userId);
    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await service.getMessages(req.params.conversationId, req.user!.userId);
    if (result.kind === 'not_found') {
      res.status(404).json({ message: 'Conversation not found' });
      return;
    }
    if (result.kind === 'forbidden') {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }
    res.json({ conversation: result.conversation, messages: result.messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markConversationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await service.markConversationRead(req.params.conversationId, req.user!.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
