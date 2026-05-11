import { Router, Response } from 'express';
import { auth } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import {
  getInstagramAuthUrl,
  handleInstagramCallback,
  getInstagramConnectionStatus,
  disconnectInstagram,
} from '../controllers/instagramOAuthController';

const router = Router();

router.get('/instagram/auth', auth, (req, res) => getInstagramAuthUrl(req as AuthRequest, res));
router.get('/instagram/callback', (req, res) => handleInstagramCallback(req, res));
router.get('/instagram/status', auth, (req, res) => getInstagramConnectionStatus(req as AuthRequest, res));
router.delete('/instagram/disconnect', auth, (req, res) => disconnectInstagram(req as AuthRequest, res));

export default router;
