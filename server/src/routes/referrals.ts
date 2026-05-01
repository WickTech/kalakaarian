import { Router, Response } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// The referral_code is auto-generated when the profile is created (DB trigger).
// This endpoint just returns it (or generates one if missing).
router.post('/generate', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { data: profile } = await adminClient.from('profiles').select('referral_code').eq('id', userId).single();
    res.json({ code: profile?.referral_code ?? null });
  } catch { res.status(500).json({ message: 'Error generating referral code' }); }
});

router.post('/use', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user!.userId;

    // Find profile that owns this referral code
    const { data: referrer } = await adminClient.from('profiles').select('id').eq('referral_code', code).single();
    if (!referrer) { res.status(404).json({ message: 'Invalid referral code' }); return; }
    if (referrer.id === userId) { res.status(400).json({ message: 'Cannot use your own referral code' }); return; }

    // Check not already referred
    const { data: existing } = await adminClient.from('referrals').select('id').eq('referred_id', userId).single();
    if (existing) { res.status(400).json({ message: 'Referral already applied' }); return; }

    await adminClient.from('referrals').insert({
      referrer_id: referrer.id,
      referred_id: userId,
      referral_code: code,
      status: 'completed',
    });

    // Link referred_by on profile
    await adminClient.from('profiles').update({ referred_by: referrer.id }).eq('id', userId);

    res.json({ message: 'Referral applied successfully' });
  } catch { res.status(500).json({ message: 'Error using referral code' }); }
});

router.get('/stats', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { data: profile } = await adminClient.from('profiles').select('referral_code').eq('id', userId).single();
    const { count: usedCount } = await adminClient.from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', userId);
    res.json({
      code: profile?.referral_code ?? null,
      usedCount: usedCount ?? 0,
      goldUnlocked: (usedCount ?? 0) >= 10,
      silverUnlocked: (usedCount ?? 0) >= 1,
    });
  } catch { res.status(500).json({ message: 'Error fetching referral stats' }); }
});

export default router;
