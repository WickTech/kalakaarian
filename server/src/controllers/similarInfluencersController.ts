import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { formatInfluencer } from './influencerController';
import { applyPlatformMargin } from '../utils/pricing';

export const getSimilarInfluencers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: target } = await adminClient
      .from('influencer_profiles')
      .select('tier')
      .eq('id', id)
      .single();

    if (!target) { res.status(404).json({ message: 'Influencer not found' }); return; }

    const { data: rows } = await adminClient
      .from('influencer_profiles')
      .select('*, profiles!inner(name, email)')
      .eq('tier', target.tier)
      .neq('id', id)
      .order('avg_rating', { ascending: false })
      .limit(12);

    let results = rows || [];

    if (results.length < 6) {
      const { data: fallback } = await adminClient
        .from('influencer_profiles')
        .select('*, profiles!inner(name, email)')
        .neq('id', id)
        .neq('tier', target.tier)
        .order('avg_rating', { ascending: false })
        .limit(12 - results.length);
      results = [...results, ...(fallback || [])];
    }

    const influencers = results.map((row: any) => {
      const formatted = formatInfluencer(row);
      return { ...formatted, pricing: applyPlatformMargin(formatted.pricing) };
    });

    res.json({ influencers });
  } catch (error) {
    console.error('Similar influencers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
