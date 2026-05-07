import { Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { formatInfluencer } from './influencerController';

export async function recommendCreators(req: AuthRequest, res: Response): Promise<void> {
  try {
    const brandId = req.user!.userId;

    const { data: campaigns } = await adminClient
      .from('campaigns')
      .select('niches')
      .eq('brand_id', brandId)
      .limit(5);

    const niches: string[] = [...new Set(
      (campaigns || []).flatMap((c: any) => c.niches || [])
    )];

    let q = adminClient
      .from('influencer_profiles')
      .select('*, profiles(name, avatar_url), influencer_pricing(platform, content_type, price)')
      .not('avg_rating', 'is', null)
      .order('avg_rating', { ascending: false })
      .order('rating_count', { ascending: false })
      .limit(6);

    if (niches.length > 0) {
      q = q.overlaps('niches', niches);
    }

    const { data, error } = await q;
    if (error) { res.status(500).json({ message: error.message }); return; }

    res.json((data || []).map(formatInfluencer));
  } catch (err) {
    console.error('Recommend creators error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function recommendCampaigns(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const { data: profile } = await adminClient
      .from('influencer_profiles')
      .select('niches')
      .eq('id', userId)
      .single();

    const niches: string[] = (profile as any)?.niches || [];

    let q = adminClient
      .from('campaigns')
      .select('id, title, budget, deadline, niches, platforms, status, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6);

    if (niches.length > 0) {
      q = q.overlaps('niches', niches);
    }

    const { data, error } = await q;
    if (error) { res.status(500).json({ message: error.message }); return; }

    res.json(data || []);
  } catch (err) {
    console.error('Recommend campaigns error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
