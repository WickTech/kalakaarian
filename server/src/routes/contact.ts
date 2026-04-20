import { Router, Request, Response, RequestHandler } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate';
import { auth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import Contact from '../models/Contact';

const router = Router();

// Public contact form — limit to 5 submissions per hour per IP
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

      if (!email && !phone) {
        res.status(400).json({ message: 'Either email or phone is required' });
        return;
      }

      const contact = await Contact.create({
        name,
        email,
        phone,
        message,
        type: type || 'general',
        status: 'new',
      });

      res.status(201).json({
        message: 'Thank you for your message! We will get back to you soon.',
        contact,
      });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ message: 'Failed to submit contact form' });
    }
  }
);

// Admin-only: read and manage contact submissions
router.get('/', auth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
});

router.put('/:id/status', auth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update contact' });
  }
});

export default router;
