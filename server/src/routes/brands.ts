import { Router, RequestHandler } from 'express';
import { adminClient } from '../config/supabase';

const router = Router();

router.get('/:id/public', (async (req, res) => {
  const { id } = req.params;
  try {
    const { data: bp, error: bpErr } = await adminClient
      .from('brand_profiles')
      .select('company_name, industry, description, website, logo, user_id')
      .eq('user_id', id)
      .single();
    if (bpErr || !bp) return res.status(404).json({ error: 'Brand not found' });

    const { data: profile } = await adminClient
      .from('profiles')
      .select('name')
      .eq('id', id)
      .single();

    const { count: openCampaignCount } = await adminClient
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', id)
      .eq('status', 'open');

    res.json({
      companyName: (bp as Record<string, unknown>).company_name,
      industry: (bp as Record<string, unknown>).industry,
      description: (bp as Record<string, unknown>).description,
      website: (bp as Record<string, unknown>).website,
      logo: (bp as Record<string, unknown>).logo,
      ownerName: (profile as Record<string, unknown> | null)?.name,
      openCampaignCount: openCampaignCount ?? 0,
    });
  } catch (err) {
    console.error('brand public profile error:', err);
    res.status(500).json({ error: 'Failed to fetch brand profile' });
  }
}) as RequestHandler);

export default router;
