import { Request, Response } from 'express';
import { adminClient } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { formatInfluencer } from './influencerController';

const CAMPAIGN_SELECT = '*, profiles!campaigns_brand_id_fkey(name, email)';

export const getCampaigns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    const { status, genre, platform, page = 1, limit = 20 } = req.query;
    const clampedLimit = Math.min(Number(limit) || 20, 100);
    const from = (Number(page) - 1) * clampedLimit;
    const to = from + clampedLimit - 1;

    let q = adminClient.from('campaigns').select(CAMPAIGN_SELECT, { count: 'exact' });

    if (req.user.role === 'brand') {
      q = q.eq('brand_id', req.user.userId);
      if (status) q = q.eq('status', status as string);
    } else {
      q = q.eq('status', 'open');
    }
    if (genre) q = q.overlaps('niches', Array.isArray(genre) ? genre : [genre]);
    if (platform) q = q.overlaps('platforms', Array.isArray(platform) ? platform : [platform]);

    const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;

    res.json({
      campaigns: data ?? [],
      pagination: { page: Number(page), limit: clampedLimit, total: count ?? 0, pages: Math.ceil((count ?? 0) / clampedLimit) },
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOpenCampaigns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { genre, platform, budgetMin, budgetMax, page = 1, limit = 20 } = req.query;
    const clampedLimit = Math.min(Number(limit) || 20, 100);
    const from = (Number(page) - 1) * clampedLimit;
    const to = from + clampedLimit - 1;

    let q = adminClient.from('campaigns').select(CAMPAIGN_SELECT, { count: 'exact' }).eq('status', 'open');
    if (genre) q = q.overlaps('niches', Array.isArray(genre) ? genre : [genre]);
    if (platform) q = q.overlaps('platforms', Array.isArray(platform) ? platform : [platform]);
    if (budgetMin) q = q.gte('budget', Number(budgetMin));
    if (budgetMax) q = q.lte('budget', Number(budgetMax));

    const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;

    res.json({
      campaigns: data ?? [],
      pagination: { page: Number(page), limit: clampedLimit, total: count ?? 0, pages: Math.ceil((count ?? 0) / clampedLimit) },
    });
  } catch (error) {
    console.error('Get open campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCampaignById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await adminClient.from('campaigns').select(CAMPAIGN_SELECT).eq('id', req.params.id).single();
    if (error || !data) { res.status(404).json({ message: 'Campaign not found' }); return; }
    res.json({ campaign: data });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can create campaigns' }); return;
    }
    const { title, description, genre, platform, budget, deadline, requirements } = req.body;
    const { data, error } = await adminClient.from('campaigns').insert({
      brand_id: req.user.userId,
      title,
      description: description || '',
      niches: genre || [],
      platforms: platform || [],
      budget: budget || null,
      deadline: deadline || null,
      requirements: requirements || '',
      status: 'open',
    }).select(CAMPAIGN_SELECT).single();
    if (error || !data) { res.status(500).json({ message: 'Failed to create campaign' }); return; }
    res.status(201).json({ campaign: data });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can update campaigns' }); return;
    }
    const { title, description, genre, platform, budget, deadline, requirements, status } = req.body;
    const update: Record<string, unknown> = {};
    if (title) update.title = title;
    if (description) update.description = description;
    if (genre) update.niches = genre;
    if (platform) update.platforms = platform;
    if (budget) update.budget = budget;
    if (deadline) update.deadline = deadline;
    if (requirements !== undefined) update.requirements = requirements;
    if (status) update.status = status;

    const { data, error } = await adminClient.from('campaigns')
      .update(update)
      .eq('id', req.params.id)
      .eq('brand_id', req.user.userId)
      .select(CAMPAIGN_SELECT)
      .single();
    if (error || !data) { res.status(404).json({ message: 'Campaign not found' }); return; }
    res.json({ campaign: data });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCampaign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Only brands can delete campaigns' }); return;
    }
    // Cascades delete proposals via FK constraint
    const { error } = await adminClient.from('campaigns')
      .delete()
      .eq('id', req.params.id)
      .eq('brand_id', req.user.userId);
    if (error) { res.status(404).json({ message: 'Campaign not found' }); return; }
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCampaignInfluencers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ message: 'Forbidden' }); return;
    }
    const { id: campaignId } = req.params;
    const brandId = req.user.userId;

    const [txResult, cartResult] = await Promise.all([
      adminClient.from('transactions').select('influencer_id, amount')
        .eq('campaign_id', campaignId).eq('brand_id', brandId),
      adminClient.from('cart_items').select('influencer_id, price')
        .eq('campaign_id', campaignId).eq('brand_id', brandId),
    ]);

    const paidMap = new Map<string, number>();
    for (const r of txResult.data ?? []) paidMap.set(r.influencer_id, r.amount);

    const pendingMap = new Map<string, number>();
    for (const r of cartResult.data ?? []) {
      if (!paidMap.has(r.influencer_id)) pendingMap.set(r.influencer_id, r.price);
    }

    const allIds = [...paidMap.keys(), ...pendingMap.keys()];
    if (!allIds.length) { res.json({ influencers: [] }); return; }

    const { data: profiles, error } = await adminClient
      .from('influencer_profiles')
      .select('*, profiles(name, avatar_url), influencer_pricing(platform, content_type, price)')
      .in('id', allIds);

    if (error) throw error;

    const influencers = (profiles ?? []).map((row: any) => ({
      ...formatInfluencer(row),
      cartPrice: paidMap.get(row.id) ?? pendingMap.get(row.id) ?? 0,
      paymentStatus: paidMap.has(row.id) ? 'paid' : 'pending',
    }));

    res.json({ influencers });
  } catch (err) {
    console.error('getCampaignInfluencers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
