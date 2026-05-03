import { Router, Response } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId, videoUrl, platform } = req.body;
    const { data, error } = await adminClient.from('campaign_videos').insert({
      influencer_id: req.user!.userId,
      campaign_id: campaignId,
      video_url: videoUrl,
      platform: platform || 'file',
    }).select().single();
    if (error || !data) { res.status(500).json({ message: 'Error uploading video' }); return; }
    res.json(data);
  } catch { res.status(500).json({ message: 'Error uploading video' }); }
});

router.get('/campaign/:campaignId', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { data } = await adminClient.from('campaign_videos')
      .select('*').eq('campaign_id', req.params.campaignId).eq('influencer_id', req.user!.userId);
    res.json(data ?? []);
  } catch { res.status(500).json({ message: 'Error fetching videos' }); }
});

router.get('/my', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { data } = await adminClient.from('campaign_videos')
      .select('*, campaigns!campaign_videos_campaign_id_fkey(title)')
      .eq('influencer_id', req.user!.userId)
      .order('created_at', { ascending: false });
    res.json(data ?? []);
  } catch { res.status(500).json({ message: 'Error fetching videos' }); }
});

router.put('/:id/review', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, feedback } = req.body;
    const { data: video } = await adminClient.from('campaign_videos').select('campaign_id').eq('id', req.params.id).single();
    if (!video) { res.status(404).json({ message: 'Video not found' }); return; }
    const { data: campaign } = await adminClient.from('campaigns').select('brand_id').eq('id', video.campaign_id).single();
    if (!campaign || campaign.brand_id !== req.user!.userId) { res.status(403).json({ message: 'Not authorized' }); return; }

    const { data, error } = await adminClient.from('campaign_videos')
      .update({ status, feedback: feedback || null }).eq('id', req.params.id).select().single();
    if (error || !data) { res.status(404).json({ message: 'Video not found' }); return; }
    res.json(data);
  } catch { res.status(500).json({ message: 'Error reviewing video' }); }
});

export default router;
