import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { adminClient } from '../config/supabase';

const RATABLE_STAGES = new Set(['approved', 'payment_pending', 'payment_released']);

export const submitRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { id } = req.params;
    const { score, review } = req.body as { score: number; review?: string };

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      res.status(400).json({ message: 'score must be integer 1-5' }); return;
    }
    if (review !== undefined && (typeof review !== 'string' || review.length > 500)) {
      res.status(400).json({ message: 'review must be a string ≤ 500 chars' }); return;
    }

    const { data: campaignCreator, error: ccErr } = await adminClient
      .from('campaign_creators')
      .select('influencer_id, campaign_id, workflow_stage')
      .eq('id', id)
      .single();
    if (ccErr || !campaignCreator) { res.status(404).json({ message: 'Campaign creator not found' }); return; }

    if (!RATABLE_STAGES.has(campaignCreator.workflow_stage ?? '')) {
      res.status(422).json({ message: 'Rating only available after content is approved' }); return;
    }

    const { data: campaign } = await adminClient
      .from('campaigns').select('brand_id').eq('id', campaignCreator.campaign_id).single();
    if (!campaign) { res.status(404).json({ message: 'Campaign not found' }); return; }

    const isBrand = req.user.role === 'brand' && campaign.brand_id === req.user.userId;
    const isInfluencer = req.user.role === 'influencer' && campaignCreator.influencer_id === req.user.userId;
    if (!isBrand && !isInfluencer) { res.status(403).json({ message: 'Not a participant on this campaign' }); return; }

    const raterRole = isBrand ? 'brand' : 'influencer';
    const rateeId   = isBrand ? campaignCreator.influencer_id : campaign.brand_id;

    const { data: rating, error } = await adminClient
      .from('ratings')
      .upsert(
        { campaign_creator_id: id, rater_id: req.user.userId, rater_role: raterRole, ratee_id: rateeId, score, review: review ?? null },
        { onConflict: 'campaign_creator_id,rater_role' },
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ rating });
  } catch (err) {
    console.error('Submit rating error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCampaignCreatorRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { data } = await adminClient
      .from('ratings')
      .select('id, score, review, created_at')
      .eq('campaign_creator_id', req.params.id)
      .eq('rater_id', req.user.userId)
      .maybeSingle();
    res.json({ rating: data ?? null });
  } catch (err) {
    console.error('Get rating error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInfluencerRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const { data, error } = await adminClient
      .from('ratings')
      .select('id, score, review, created_at')
      .eq('ratee_id', req.params.id)
      .eq('rater_role', 'brand')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    const reviews = data ?? [];
    const avg = reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.score, 0) / reviews.length) * 10) / 10
      : null;
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ ratings: reviews, avg, count: reviews.length });
  } catch (err) {
    console.error('Get influencer ratings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
