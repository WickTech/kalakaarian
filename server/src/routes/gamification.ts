import { Router, Request, Response } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

const BADGES = [
  { id: 'rising_star',       name: 'Rising Star',        description: 'First accepted campaign',         emoji: '⭐' },
  { id: 'power_performer',   name: 'Power Performer',     description: '10+ active proposals',            emoji: '⚡' },
  { id: 'campaign_champion', name: 'Campaign Champion',   description: '5+ completed campaigns',          emoji: '🏆' },
  { id: 'trusted_creator',   name: 'Trusted Creator',     description: 'Avg rating ≥ 4.0 (3+ reviews)',   emoji: '🛡️' },
  { id: 'top_rated',         name: 'Top Rated',           description: 'Avg rating ≥ 4.5 (5+ reviews)',   emoji: '💎' },
];

function getLevelInfo(xp: number): { name: string; nextLevelXp: number | null } {
  if (xp >= 600) return { name: 'Platinum', nextLevelXp: null };
  if (xp >= 300) return { name: 'Gold', nextLevelXp: 600 };
  if (xp >= 100) return { name: 'Silver', nextLevelXp: 300 };
  return { name: 'Bronze', nextLevelXp: 100 };
}

function computeEarned(wf: number, completed: number, avg: number, count: number): Set<string> {
  const e = new Set<string>();
  if (wf >= 1) e.add('rising_star');
  if (wf >= 10) e.add('power_performer');
  if (completed >= 5) e.add('campaign_champion');
  if (avg >= 4.0 && count >= 3) e.add('trusted_creator');
  if (avg >= 4.5 && count >= 5) e.add('top_rated');
  return e;
}

router.get('/influencer', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'influencer') { res.status(403).json({ message: 'Forbidden' }); return; }
    const userId = req.user!.userId;

    const [proposalsRes, profileRes, ratingsRes] = await Promise.all([
      adminClient.from('proposals').select('workflow_stage').eq('influencer_id', userId),
      adminClient.from('influencer_profiles').select('avg_rating, rating_count').eq('id', userId).single(),
      adminClient.from('ratings').select('score').eq('ratee_id', userId).eq('rater_role', 'brand'),
    ]);

    const proposals = proposalsRes.data || [];
    const profile = profileRes.data;
    const ratings = ratingsRes.data || [];

    const wf = proposals.filter((p: any) => p.workflow_stage).length;
    const completed = proposals.filter((p: any) => p.workflow_stage === 'payment_released').length;
    const avg = profile?.avg_rating ? Number(profile.avg_rating) : 0;
    const count = profile?.rating_count ?? 0;

    const xp = wf * 10 + completed * 20 + count * 15 + ratings.filter((r: any) => r.score === 5).length * 10;
    const earned = computeEarned(wf, completed, avg, count);

    res.json({ xp, ...getLevelInfo(xp), badges: BADGES.map(b => ({ ...b, earned: earned.has(b.id) })) });
  } catch (error) {
    console.error('Gamification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/influencer/:id/public', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    const [proposalsRes, profileRes] = await Promise.all([
      adminClient.from('proposals').select('workflow_stage').eq('influencer_id', userId),
      adminClient.from('influencer_profiles').select('avg_rating, rating_count').eq('id', userId).maybeSingle(),
    ]);

    const proposals = proposalsRes.data || [];
    const profile = profileRes.data;

    const wf = proposals.filter((p: any) => p.workflow_stage).length;
    const completed = proposals.filter((p: any) => p.workflow_stage === 'payment_released').length;
    const avg = profile?.avg_rating ? Number(profile.avg_rating) : 0;
    const count = profile?.rating_count ?? 0;

    const earned = computeEarned(wf, completed, avg, count);
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ badges: BADGES.filter(b => earned.has(b.id)) });
  } catch (error) {
    console.error('Public gamification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
