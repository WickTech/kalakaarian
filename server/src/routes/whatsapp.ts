import { Router, Request, Response } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';
import { whatsappService } from '../services/whatsapp';

const router = Router();

router.get('/status', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { data } = await adminClient.from('profiles')
      .select('phone, phone_verified, whatsapp_notifications')
      .eq('id', req.user!.userId)
      .single();
    const prefs = data?.whatsapp_notifications ?? {};
    res.json({
      enabled: (prefs as any).enabled || false,
      phone: data?.phone,
      phoneVerified: data?.phone_verified,
      preferences: prefs,
    });
  } catch { res.status(500).json({ message: 'Error fetching WhatsApp status' }); }
});

router.put('/preferences', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { enabled, campaigns, proposals, messages, payments } = req.body;
    const { data: current } = await adminClient.from('profiles')
      .select('whatsapp_notifications').eq('id', req.user!.userId).single();
    const prefs: Record<string, boolean> = { ...((current?.whatsapp_notifications as any) ?? {}) };
    if (typeof enabled === 'boolean')    prefs.enabled = enabled;
    if (typeof campaigns === 'boolean')  prefs.campaigns = campaigns;
    if (typeof proposals === 'boolean')  prefs.proposals = proposals;
    if (typeof messages === 'boolean')   prefs.messages = messages;
    if (typeof payments === 'boolean')   prefs.payments = payments;
    await adminClient.from('profiles').update({ whatsapp_notifications: prefs }).eq('id', req.user!.userId);
    res.json({ message: 'Preferences updated' });
  } catch { res.status(500).json({ message: 'Error updating preferences' }); }
});

router.post('/send-test', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { data } = await adminClient.from('profiles').select('phone').eq('id', req.user!.userId).single();
    if (!data?.phone) { res.status(400).json({ message: 'No phone number on file' }); return; }
    if (!whatsappService.isConfigured()) { res.status(503).json({ message: 'WhatsApp not configured on server' }); return; }
    await whatsappService.sendMessage({ to: data.phone, template: 'hello_world' });
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
  if (mode === 'subscribe' && await whatsappService.verifyWebhook(token)) {
    res.status(200).send(challenge); return;
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
