import { Router, Response } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/:campaignId/workflow', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId } = req.params;
    let { data: workflow } = await adminClient.from('campaign_workflow').select('*').eq('campaign_id', campaignId).single();

    if (!workflow) {
      const { data: campaign } = await adminClient.from('campaigns').select('id').eq('id', campaignId).single();
      if (!campaign) { res.status(404).json({ message: 'Campaign not found' }); return; }

      const { data: accepted } = await adminClient.from('proposals')
        .select('influencer_id').eq('campaign_id', campaignId).eq('status', 'accepted');

      const { data: created } = await adminClient.from('campaign_workflow').insert({
        campaign_id: campaignId,
        selected_creators: (accepted ?? []).map((p: { influencer_id: string }) => p.influencer_id),
      }).select().single();
      workflow = created;
    }

    res.json(workflow);
  } catch { res.status(500).json({ message: 'Error fetching workflow' }); }
});

router.put('/:campaignId/workflow/stage', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { stage } = req.body;
    const { campaignId } = req.params;
    const now = new Date().toISOString();

    const update: Record<string, unknown> = {};
    if (stage === 'shooting')  { update.shooting = true; update.shooting_at = now; }
    else if (stage === 'uploaded') { update.uploaded = true; update.uploaded_at = now; }
    else if (stage === 'payment')  { update.payment_done = true; update.payment_at = now; }
    else { res.status(400).json({ message: 'Invalid stage' }); return; }

    const { data, error } = await adminClient.from('campaign_workflow')
      .update(update).eq('campaign_id', campaignId).select().single();
    if (error || !data) { res.status(404).json({ message: 'Workflow not found' }); return; }
    res.json(data);
  } catch { res.status(500).json({ message: 'Error updating workflow stage' }); }
});

router.post('/:campaignId/videos', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { videoUrl, platform, influencerId } = req.body;
    const { campaignId } = req.params;

    const { data: workflow } = await adminClient.from('campaign_workflow').select('id, videos').eq('campaign_id', campaignId).single();
    if (!workflow) { res.status(404).json({ message: 'Workflow not found' }); return; }

    const videos = Array.isArray(workflow.videos) ? workflow.videos : [];
    videos.push({ influencerId, videoUrl, platform: platform || 'file', status: 'pending', uploadedAt: new Date().toISOString() });

    const { data } = await adminClient.from('campaign_workflow').update({ videos }).eq('id', workflow.id).select().single();
    res.json(data);
  } catch { res.status(500).json({ message: 'Error adding video' }); }
});

router.put('/:campaignId/videos/:videoIndex', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, feedback } = req.body;
    const { campaignId, videoIndex } = req.params;

    const { data: campaign } = await adminClient.from('campaigns').select('brand_id').eq('id', campaignId).single();
    if (!campaign || campaign.brand_id !== req.user!.userId) { res.status(403).json({ message: 'Not authorized' }); return; }

    const { data: workflow } = await adminClient.from('campaign_workflow').select('id, videos').eq('campaign_id', campaignId).single();
    if (!workflow) { res.status(404).json({ message: 'Workflow not found' }); return; }

    const videos = Array.isArray(workflow.videos) ? [...workflow.videos] : [];
    const idx = parseInt(videoIndex);
    if (idx >= 0 && idx < videos.length) {
      videos[idx] = { ...videos[idx], status };
      if (feedback) videos[idx].feedback = feedback;
    }

    const { data } = await adminClient.from('campaign_workflow').update({ videos }).eq('id', workflow.id).select().single();
    res.json(data);
  } catch { res.status(500).json({ message: 'Error updating video' }); }
});

export default router;
