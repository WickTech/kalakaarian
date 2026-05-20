import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { validateBody } from '../../middleware/zodValidate';
import { sendMessageSchema } from './validators';
import {
  sendMessage,
  getConversations,
  getMessages,
  markConversationRead,
} from './controller';

const router = Router();

router.post('/send', auth, validateBody(sendMessageSchema), sendMessage);
router.get('/conversations', auth, getConversations);
router.get('/conversations/:conversationId', auth, getMessages);
router.put('/conversations/:conversationId/read', auth, markConversationRead);

export default router;
