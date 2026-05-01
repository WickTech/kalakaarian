import { Router, Request, Response, RequestHandler } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { adminClient } from '../config/supabase';
import { validate } from '../middleware/validate';
import { auth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many contact submissions. Please try again later.' },
}) as unknown as RequestHandler;

router.post(
  '/',
  contactLimiter,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('phone').optional(),
    body('message').notEmpty().withMessage('Message is required'),
    body('type').optional().isIn(['general', 'callback', 'business']).withMessage('Invalid type'),
  ],
  validate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, phone, message, type } = req.body;
      if (!email && !phone) { res.status(400).json({ message: 'Either email or phone is required' }); return; }

      const { data, error } = await adminClient.from('contacts').insert({
        name, email: email || null, phone: phone || null,
        message, type: type || 'general', status: 'new',
      }).select().single();
      if (error || !data) { res.status(500).json({ message: 'Failed to submit contact form' }); return; }

      res.status(201).json({ message: 'Thank you for your message! We will get back to you soon.', contact: data });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ message: 'Failed to submit contact form' });
    }
  }
);

router.get('/', auth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data } = await adminClient.from('contacts').select('*').order('created_at', { ascending: false });
    res.json(data ?? []);
  } catch { res.status(500).json({ message: 'Failed to fetch contacts' }); }
});

router.put('/:id/status', auth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const { data } = await adminClient.from('contacts').update({ status }).eq('id', req.params.id).select().single();
    res.json(data);
  } catch { res.status(500).json({ message: 'Failed to update contact' }); }
});

export default router;
