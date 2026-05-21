import { Router, Response } from 'express';
import { adminClient } from '../config/supabase';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

// DB rows are snake_cased; the client `CampaignFile` contract is camelCase.
// Map every response through this so uploaded briefs render with names/links.
type CampaignFileRow = {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  uploader_id: string;
  created_at: string;
  profiles?: { name?: string } | null;
};
const mapFile = (r: CampaignFileRow) => ({
  _id: r.id,
  fileUrl: r.file_url,
  fileName: r.file_name,
  fileType: r.file_type,
  uploadedBy: r.profiles?.name || r.uploader_id,
  createdAt: r.created_at,
});

router.post('/:campaignId/files', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { fileUrl, fileType, fileName } = req.body;
    const { campaignId } = req.params;
    const userId = req.user!.userId;

    try { new URL(fileUrl); } catch { res.status(400).json({ message: 'fileUrl must be a valid URL' }); return; }

    // Verify brand owns the campaign
    const { data: campaign } = await adminClient.from('campaigns').select('id').eq('id', campaignId).eq('brand_id', userId).single();
    if (!campaign) { res.status(403).json({ message: 'Not authorized' }); return; }

    const { data, error } = await adminClient.from('campaign_files').insert({
      campaign_id: campaignId,
      uploader_id: userId,
      file_url: fileUrl,
      file_type: fileType || 'brief',
      file_name: fileName || 'Untitled',
    }).select().single();
    if (error || !data) { res.status(500).json({ message: 'Error uploading file' }); return; }
    res.json(mapFile(data as CampaignFileRow));
  } catch { res.status(500).json({ message: 'Error uploading file' }); }
});

router.get('/:campaignId/files', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { campaignId } = req.params;

    const { data: campaign } = await adminClient.from('campaigns').select('brand_id').eq('id', campaignId).single();
    if (!campaign) { res.status(404).json({ message: 'Campaign not found' }); return; }

    const isBrand = campaign.brand_id === userId;
    if (!isBrand) {
      const { data: proposal } = await adminClient.from('campaign_creators')
        .select('id').eq('campaign_id', campaignId).eq('influencer_id', userId).eq('status', 'accepted').single();
      if (!proposal) { res.status(403).json({ message: 'Not authorized' }); return; }
    }

    const { data } = await adminClient.from('campaign_files')
      .select('*, profiles!campaign_files_uploader_id_fkey(name)')
      .eq('campaign_id', campaignId);
    res.json((data ?? []).map((r) => mapFile(r as unknown as CampaignFileRow)));
  } catch { res.status(500).json({ message: 'Error fetching files' }); }
});

router.delete('/:campaignId/files/:fileId', auth, async (req: AuthRequest, res: Response) => {
  try {
    await adminClient.from('campaign_files').delete()
      .eq('id', req.params.fileId)
      .eq('campaign_id', req.params.campaignId)
      .eq('uploader_id', req.user!.userId);
    res.json({ message: 'File deleted' });
  } catch { res.status(500).json({ message: 'Error deleting file' }); }
});

export default router;
