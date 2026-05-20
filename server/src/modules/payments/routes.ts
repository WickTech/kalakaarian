import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { addToCartValidators } from './validators';
import {
  getCart, addToCart, removeFromCart, clearCart, updateCartItem, checkout, handleCartWebhook,
} from './cartController';

const router = Router();

router.get('/', auth, getCart);
router.post('/add', auth, addToCartValidators, validate, addToCart);
router.delete('/remove/:influencerId', auth, removeFromCart);
router.delete('/clear', auth, clearCart);
router.put('/update/:influencerId', auth, updateCartItem);
router.post('/checkout', auth, checkout);

// No auth — called by Razorpay servers; verified via HMAC signature in handler.
router.post('/webhook', handleCartWebhook);

export default router;
