import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  updateCartItem,
  checkout,
  handleCartWebhook,
} from '../controllers/cartController';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/', auth, getCart);

router.post(
  '/add',
  auth,
  [
    body('influencerId').notEmpty().withMessage('Influencer ID is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
  ],
  validate,
  addToCart
);

router.delete('/remove/:influencerId', auth, removeFromCart);

router.delete('/clear', auth, clearCart);

router.put('/update/:influencerId', auth, updateCartItem);

router.post('/checkout', auth, checkout);

// No auth — called by Razorpay servers; verified via HMAC signature in handler
router.post('/webhook', handleCartWebhook);

export default router;
