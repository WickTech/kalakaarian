import { Router, Response } from 'express';
import { auth, AuthRequest } from '../middleware/auth';
import { getPresignedUploadUrl } from '../services/storageService';
import crypto from 'crypto';

const router = Router();

const ALLOWED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['profile', 'campaign'],
  'image/png': ['profile', 'campaign'],
  'image/webp': ['profile', 'campaign'],
  'application/pdf': ['campaign'],
  'video/mp4': ['video'],
};

router.post('/presign', auth, async (req: AuthRequest, res: Response) => {
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

    const ext = fileName.split('.').pop() ?? 'bin';
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
