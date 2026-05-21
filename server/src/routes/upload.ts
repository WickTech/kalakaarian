import { Router, Response } from 'express';
import { createRateLimiter } from '../middleware/rateLimit';
import { auth, AuthRequest } from '../middleware/auth';
import { getPresignedUploadUrl } from '../services/storageService';
import crypto from 'crypto';

const router = Router();

const ALLOWED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['profile', 'campaign', 'gallery', 'video'],
  'image/png':  ['profile', 'campaign', 'gallery', 'video'],
  'image/webp': ['profile', 'campaign', 'gallery', 'video'],
  'application/pdf': ['campaign'],
  'application/msword': ['campaign'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['campaign'],
  'video/mp4':       ['video'],
  'video/quicktime': ['video'],
  'video/webm':      ['video'],
};

const presignLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/presign', presignLimiter, auth, async (req: AuthRequest, res: Response) => {
  try {
    const { fileName, contentType, purpose = 'campaign' } = req.body;
    if (!fileName || !contentType) {
      res.status(400).json({ message: 'fileName and contentType are required' });
      return;
    }
    const allowedPurposes = ALLOWED_TYPES[contentType];
    if (!allowedPurposes || !allowedPurposes.includes(purpose)) {
      res.status(400).json({ message: 'Unsupported file type for this purpose' });
      return;
    }

    const rawExt = fileName.split('.').pop() ?? '';
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'bin';
    const key = `${purpose}/${req.user!.userId}/${crypto.randomUUID()}.${ext}`;

    const result = await getPresignedUploadUrl(key, contentType);
    if (!result) {
      res.status(503).json({ message: 'Storage not configured' });
      return;
    }

    res.json({ uploadUrl: result.uploadUrl, fileUrl: result.fileUrl, key });
  } catch (error) {
    console.error('Presign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
