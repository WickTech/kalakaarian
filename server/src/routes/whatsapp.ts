import { Router, Request, Response } from 'express';
import User from '../models/User';
import { auth, AuthRequest } from '../middleware/auth';
import { whatsappService } from '../services/whatsapp';

const router = Router();

router.get('/status', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId).select('whatsappNotifications phone phoneVerified');

    res.json({
      enabled: user?.whatsappNotifications?.enabled || false,
      phone: user?.phone,
      phoneVerified: user?.phoneVerified,
      preferences: user?.whatsappNotifications || {},
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching WhatsApp status' });
  }
});

router.put('/preferences', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { enabled, campaigns, proposals, messages, payments } = req.body;

    const updateData: any = {};
    if (typeof enabled === 'boolean') updateData['whatsappNotifications.enabled'] = enabled;
    if (typeof campaigns === 'boolean') updateData['whatsappNotifications.campaigns'] = campaigns;
    if (typeof proposals === 'boolean') updateData['whatsappNotifications.proposals'] = proposals;
    if (typeof messages === 'boolean') updateData['whatsappNotifications.messages'] = messages;
    if (typeof payments === 'boolean') updateData['whatsappNotifications.payments'] = payments;

    await User.findByIdAndUpdate(userId, updateData);
    res.json({ message: 'Preferences updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating preferences' });
  }
});

router.post('/send-test', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId);

    if (!user?.phone) {
      res.status(400).json({ message: 'No phone number on file' });
      return;
    }

    if (!whatsappService.isConfigured()) {
      res.status(503).json({ message: 'WhatsApp not configured on server' });
      return;
    }

    await whatsappService.sendMessage({
      to: user.phone,
      template: 'hello_world',
    });

    res.json({ message: 'Test message sent' });
  } catch (error) {
    console.error('WhatsApp test error:', error);
    res.status(500).json({ message: 'Failed to send test message' });
  }
});

router.get('/webhook', async (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe') {
    const isValid = await whatsappService.verifyWebhook(token);
    if (isValid) {
      res.status(200).send(challenge);
      return;
    }
  }

  res.status(403).send('Forbidden');
});

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    await whatsappService.processWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

export default router;
